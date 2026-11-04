import crypto from 'crypto';
import { query } from '../config/db.js';

/**
 * Get Messages for a Consultation Booking
 */
export const getMessagesByBooking = async (req, res) => {
  try {
    const { id } = req.params; // booking_id
    const userId = req.user.id || req.user._id;

    // Check authorization for booking
    const bookingRes = await query(
      `SELECT cb.*, lp.user_id as lawyer_user_id
       FROM consultation_bookings cb
       JOIN lawyer_profiles lp ON cb.lawyer_id = lp.id
       WHERE cb.id = $1`,
      [id]
    );

    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Consultation booking not found.' });
    }

    const booking = bookingRes.rows[0];
    if (
      req.user.role !== 'admin' &&
      booking.client_id !== userId &&
      booking.lawyer_user_id !== userId
    ) {
      return res.status(403).json({ success: false, message: 'Access denied to this conversation.' });
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
      [id]
    );

    // Mark unread messages sent to current user as read
    await query(
      `UPDATE messages SET is_read = true, read_at = NOW()
       WHERE booking_id = $1 AND recipient_id = $2 AND is_read = false`,
      [id, userId]
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
    const { id } = req.params; // booking_id
    const { content, messageType = 'text', attachmentUrl, attachmentName } = req.body;
    const userId = req.user.id || req.user._id;

    if (!content && !attachmentUrl) {
      return res.status(400).json({ success: false, message: 'Message content or attachment is required.' });
    }

    const bookingRes = await query(
      `SELECT cb.*, lp.user_id as lawyer_user_id
       FROM consultation_bookings cb
       JOIN lawyer_profiles lp ON cb.lawyer_id = lp.id
       WHERE cb.id = $1`,
      [id]
    );

    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Consultation booking not found.' });
    }

    const booking = bookingRes.rows[0];
    const isClient = booking.client_id === userId;
    const isLawyer = booking.lawyer_user_id === userId;

    if (!isClient && !isLawyer && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied to this conversation.' });
    }

    const recipientId = isClient ? booking.lawyer_user_id : booking.client_id;

    // Get or create conversation
    let convRes = await query('SELECT id FROM conversations WHERE booking_id = $1', [id]);
    let conversationId;
    if (convRes.rows.length === 0) {
      conversationId = crypto.randomUUID();
      await query(
        'INSERT INTO conversations (id, booking_id, client_id, lawyer_id) VALUES ($1, $2, $3, $4)',
        [conversationId, id, booking.client_id, booking.lawyer_user_id]
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
        id,
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
