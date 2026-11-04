import crypto from 'crypto';
import { query } from '../config/db.js';

/**
 * Get Messages for a Consultation Booking or Request
 */
export const getMessagesByBooking = async (req, res) => {
  try {
    const { id } = req.params; // booking_id or request_id
    const userId = req.user.id || req.user._id;

    let targetBookingId = id;

    // Check authorization for booking
    let bookingRes = await query(
      `SELECT cb.*, lp.user_id as lawyer_user_id
       FROM consultation_bookings cb
       JOIN lawyer_profiles lp ON cb.lawyer_id = lp.id
       WHERE cb.id = $1`,
      [targetBookingId]
    );

    if (bookingRes.rows.length === 0) {
      // Check if id is consultation_requests id
      const reqRes = await query(
        `SELECT cr.*, lp.user_id as lawyer_user_id
         FROM consultation_requests cr
         LEFT JOIN lawyer_profiles lp ON (cr.advocate_id = lp.id OR cr.advocate_id = lp.user_id)
         WHERE cr.id = $1`,
        [id]
      );

      if (reqRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Consultation booking not found.' });
      }

      const reqRow = reqRes.rows[0];
      const advUserId = reqRow.lawyer_user_id || reqRow.advocate_id;
      if (
        req.user.role !== 'admin' &&
        reqRow.client_id !== userId &&
        advUserId !== userId
      ) {
        return res.status(403).json({ success: false, message: 'Access denied to this conversation.' });
      }

      if (reqRow.booking_id) {
        targetBookingId = reqRow.booking_id;
      } else {
        // Not accepted yet, return empty messages list
        return res.status(200).json({
          success: true,
          messages: [],
        });
      }
    } else {
      const booking = bookingRes.rows[0];
      if (
        req.user.role !== 'admin' &&
        booking.client_id !== userId &&
        booking.lawyer_user_id !== userId
      ) {
        return res.status(403).json({ success: false, message: 'Access denied to this conversation.' });
      }
    }

    const messagesRes = await query(
      `SELECT
        m.*,
        u_sender.name as sender_name,
        u_sender.avatar as sender_avatar,
        u_sender.role as sender_role
      FROM messages m
      JOIN users u_sender ON m.sender_id = u_sender.id
      WHERE m.booking_id = $1
      ORDER BY m.created_at ASC`,
      [targetBookingId]
    );

    // Mark unread messages sent to current user as read
    await query(
      `UPDATE messages SET is_read = true, read_at = NOW()
       WHERE booking_id = $1 AND recipient_id = $2 AND is_read = false`,
      [targetBookingId, userId]
    );

    res.status(200).json({
      success: true,
      messages: messagesRes.rows,
    });
  } catch (error) {
    console.error('Error in getMessagesByBooking:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve messages.' });
  }
};

/**
 * Send Message in Consultation
 */
export const sendMessage = async (req, res) => {
  try {
    const { id } = req.params; // booking_id or request_id
    const { content, messageType = 'text', attachmentUrl, attachmentName } = req.body;
    const userId = req.user.id || req.user._id;

    if (!content && !attachmentUrl) {
      return res.status(400).json({ success: false, message: 'Message content or attachment is required.' });
    }

    let targetBookingId = id;
    let clientId;
    let lawyerUserId;

    let bookingRes = await query(
      `SELECT cb.*, lp.user_id as lawyer_user_id
       FROM consultation_bookings cb
       JOIN lawyer_profiles lp ON cb.lawyer_id = lp.id
       WHERE cb.id = $1`,
      [targetBookingId]
    );

    if (bookingRes.rows.length === 0) {
      const reqRes = await query(
        `SELECT cr.*, lp.user_id as lawyer_user_id
         FROM consultation_requests cr
         LEFT JOIN lawyer_profiles lp ON (cr.advocate_id = lp.id OR cr.advocate_id = lp.user_id)
         WHERE cr.id = $1`,
        [id]
      );

      if (reqRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Consultation booking not found.' });
      }

      const reqRow = reqRes.rows[0];
      if (reqRow.status !== 'accepted') {
        return res.status(403).json({
          success: false,
          message: 'Consultation request has not been accepted yet. Please wait for the advocate to accept.',
        });
      }

      if (!reqRow.booking_id) {
        return res.status(400).json({
          success: false,
          message: 'Session has not been initialized for this consultation request.',
        });
      }

      targetBookingId = reqRow.booking_id;
      clientId = reqRow.client_id;
      lawyerUserId = reqRow.lawyer_user_id || reqRow.advocate_id;
    } else {
      const booking = bookingRes.rows[0];
      clientId = booking.client_id;
      lawyerUserId = booking.lawyer_user_id;
    }

    const isClient = clientId === userId;
    const isLawyer = lawyerUserId === userId;

    if (!isClient && !isLawyer && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied to this conversation.' });
    }

    const recipientId = isClient ? lawyerUserId : clientId;

    // Get or create conversation
    let convRes = await query('SELECT id FROM conversations WHERE booking_id = $1', [targetBookingId]);
    let conversationId;
    if (convRes.rows.length === 0) {
      conversationId = crypto.randomUUID();
      await query(
        'INSERT INTO conversations (id, booking_id, client_id, lawyer_id) VALUES ($1, $2, $3, $4)',
        [conversationId, targetBookingId, clientId, lawyerUserId]
      );
    } else {
      conversationId = convRes.rows[0].id;
    }

    const msgId = crypto.randomUUID();
    await query(
      `INSERT INTO messages (
        id, conversation_id, booking_id, sender_id, recipient_id, content,
        message_type, attachment_url, attachment_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        msgId,
        conversationId,
        targetBookingId,
        userId,
        recipientId,
        content || '',
        messageType,
        attachmentUrl || '',
        attachmentName || '',
      ]
    );

    const created = await query(
      `SELECT
        m.*,
        u_sender.name as sender_name,
        u_sender.avatar as sender_avatar,
        u_sender.role as sender_role
      FROM messages m
      JOIN users u_sender ON m.sender_id = u_sender.id
      WHERE m.id = $1`,
      [msgId]
    );

    res.status(201).json({
      success: true,
      message: created.rows[0],
    });
  } catch (error) {
    console.error('Error in sendMessage:', error);
    res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
};
