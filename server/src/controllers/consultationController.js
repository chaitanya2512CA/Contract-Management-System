import crypto from 'crypto';
import { query } from '../config/db.js';

/**
 * Create Consultation Booking Request
 */
export const createConsultation = async (req, res) => {
  try {
    const clientId = req.user.id || req.user._id;
    const {
      lawyerId, // lawyer_profiles id
      practiceArea,
      consultationMode = 'video',
      durationMinutes = 30,
      scheduledStart,
      legalIssueDescription,
      urgency = 'medium',
      clientDocuments = [],
    } = req.body;

    if (!lawyerId || !legalIssueDescription || !scheduledStart) {
      return res.status(400).json({
        success: false,
        message: 'Lawyer ID, scheduled start time, and legal issue description are required.',
      });
    }

    // Get lawyer details and pricing
    const lawyerRes = await query('SELECT * FROM lawyer_profiles WHERE id = $1', [lawyerId]);
    if (lawyerRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Selected advocate profile not found.' });
    }

    const lawyer = lawyerRes.rows[0];
    let fee = parseFloat(lawyer.consultation_fee_30);
    if (durationMinutes === 15) fee = parseFloat(lawyer.consultation_fee_15);
    else if (durationMinutes === 60) fee = parseFloat(lawyer.consultation_fee_60);

    const bookingRef = `CIQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const bookingId = crypto.randomUUID();
    const meetingRoomId = `room_${bookingRef.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    const startDate = new Date(scheduledStart);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

    // Initial status: if lawyer has instant booking, confirmed once paid; initial state is pending
    const status = lawyer.is_instant_booking ? 'accepted' : 'pending';

    await query(
      `INSERT INTO consultation_bookings (
        id, booking_ref, client_id, lawyer_id, practice_area, consultation_mode,
        duration_minutes, scheduled_start, scheduled_end, fee_amount, currency,
        payment_status, status, legal_issue_description, urgency, client_documents,
        meeting_room_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'INR', 'pending', $11, $12, $13, $14, $15)`,
      [
        bookingId,
        bookingRef,
        clientId,
        lawyerId,
        practiceArea || lawyer.primary_specialty,
        consultationMode,
        durationMinutes,
        startDate.toISOString(),
        endDate.toISOString(),
        fee,
        status,
        legalIssueDescription.trim(),
        urgency,
        JSON.stringify(clientDocuments),
        meetingRoomId,
      ]
    );

    // Create linked conversation
    const conversationId = crypto.randomUUID();
    await query(
      `INSERT INTO conversations (id, booking_id, client_id, lawyer_id)
       VALUES ($1, $2, $3, $4)`,
      [conversationId, bookingId, clientId, lawyer.user_id]
    );

    // Notification to lawyer
    await query(
      `INSERT INTO notifications (id, recipient_id, title, message, type, link)
       VALUES ($1, $2, $3, $4, 'consultation', '/lawyer/consultations')`,
      [
        crypto.randomUUID(),
        lawyer.user_id,
        'New Legal Consultation Request',
        `Client ${req.user.name} has requested a ${durationMinutes}-minute ${consultationMode} consultation for ${practiceArea || lawyer.primary_specialty}.`,
      ]
    );

    const created = await query('SELECT * FROM consultation_bookings WHERE id = $1', [bookingId]);

    res.status(201).json({
      success: true,
      message: 'Consultation booked successfully. Proceed to payment to confirm your appointment.',
      booking: created.rows[0],
    });
  } catch (error) {
    console.error('Error in createConsultation:', error);
    res.status(500).json({ success: false, message: 'Failed to create consultation booking.' });
  }
};

/**
 * Get User Consultations (Filtered by Role: Client or Lawyer)
 */
export const getConsultations = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const role = req.user.role;
    const { status, practiceArea } = req.query;

    let queryStr = `
      SELECT
        cb.*,
        u_client.name as client_name,
        u_client.email as client_email,
        u_client.phone as client_phone,
        u_client.avatar as client_avatar,
        lp.full_name as lawyer_name,
        lp.primary_specialty as lawyer_specialty,
        lp.city as lawyer_city,
        u_lawyer.avatar as lawyer_avatar,
        cr.rating as client_rating,
        cr.review_text as client_review
      FROM consultation_bookings cb
      JOIN users u_client ON cb.client_id = u_client.id
      JOIN lawyer_profiles lp ON cb.lawyer_id = lp.id
      JOIN users u_lawyer ON lp.user_id = u_lawyer.id
      LEFT JOIN client_reviews cr ON cr.booking_id = cb.id
    `;

    const conditions = [];
    const params = [];

    if (role === 'client' || role === 'business') {
      conditions.push(`cb.client_id = $${params.length + 1}`);
      params.push(userId);
    } else if (role === 'lawyer') {
      conditions.push(`lp.user_id = $${params.length + 1}`);
      params.push(userId);
    } else if (role !== 'admin') {
      conditions.push(`(cb.client_id = $${params.length + 1} OR lp.user_id = $${params.length + 1})`);
      params.push(userId);
    }

    if (status && status !== 'all') {
      conditions.push(`cb.status = $${params.length + 1}`);
      params.push(status);
    }

    if (practiceArea) {
      conditions.push(`cb.practice_area = $${params.length + 1}`);
      params.push(practiceArea);
    }

    if (conditions.length > 0) {
      queryStr += ` WHERE ${conditions.join(' AND ')}`;
    }

    queryStr += ` ORDER BY cb.scheduled_start DESC`;

    const result = await query(queryStr, params);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      consultations: result.rows,
    });
  } catch (error) {
    console.error('Error in getConsultations:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve consultations.' });
  }
};

/**
 * Get Single Consultation Detail
 */
export const getConsultationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;

    const result = await query(
      `SELECT
        cb.*,
        u_client.name as client_name,
        u_client.email as client_email,
        u_client.phone as client_phone,
        u_client.avatar as client_avatar,
        lp.full_name as lawyer_name,
        lp.headline as lawyer_headline,
        lp.primary_specialty as lawyer_specialty,
        lp.bar_council_number as lawyer_bar_number,
        lp.is_verified as lawyer_verified,
        lp.rating_avg as lawyer_rating,
        u_lawyer.avatar as lawyer_avatar,
        u_lawyer.id as lawyer_user_id,
        cr.rating as client_rating,
        cr.review_text as client_review
      FROM consultation_bookings cb
      JOIN users u_client ON cb.client_id = u_client.id
      JOIN lawyer_profiles lp ON cb.lawyer_id = lp.id
      JOIN users u_lawyer ON lp.user_id = u_lawyer.id
      LEFT JOIN client_reviews cr ON cr.booking_id = cb.id
      WHERE cb.id = $1 OR cb.booking_ref = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Consultation booking not found.' });
    }

    const booking = result.rows[0];

    // Authorization check
    if (
      req.user.role !== 'admin' &&
      booking.client_id !== userId &&
      booking.lawyer_user_id !== userId
    ) {
      return res.status(403).json({ success: false, message: 'Access denied to this consultation.' });
    }

    // Hide confidential lawyer notes from client
    if (req.user.role === 'client' || req.user.role === 'business') {
      delete booking.lawyer_notes;
    }

    res.status(200).json({
      success: true,
      consultation: booking,
    });
  } catch (error) {
    console.error('Error in getConsultationById:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve consultation.' });
  }
};

/**
 * Lawyer Accept Consultation Request
 */
export const acceptConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;

    const bookingRes = await query(
      `SELECT cb.*, lp.user_id as lawyer_user_id
       FROM consultation_bookings cb
       JOIN lawyer_profiles lp ON cb.lawyer_id = lp.id
       WHERE cb.id = $1`,
      [id]
    );

    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const booking = bookingRes.rows[0];
    if (booking.lawyer_user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized action.' });
    }

    const nextStatus = booking.payment_status === 'paid' ? 'confirmed' : 'accepted';

    await query(
      `UPDATE consultation_bookings SET status = $1, updated_at = NOW() WHERE id = $2`,
      [nextStatus, id]
    );

    // Notify client
    await query(
      `INSERT INTO notifications (id, recipient_id, title, message, type, link)
       VALUES ($1, $2, $3, $4, 'consultation', $5)`,
      [
        crypto.randomUUID(),
        booking.client_id,
        'Consultation Request Accepted',
        `Advocate has accepted your consultation request for ${booking.practice_area}.`,
        `/consultations/${id}`,
      ]
    );

    res.status(200).json({
      success: true,
      message: 'Consultation request accepted.',
      status: nextStatus,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to accept consultation.' });
  }
};

/**
 * Lawyer Reject Consultation Request
 */
export const rejectConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const userId = req.user.id || req.user._id;

    const bookingRes = await query(
      `SELECT cb.*, lp.user_id as lawyer_user_id
       FROM consultation_bookings cb
       JOIN lawyer_profiles lp ON cb.lawyer_id = lp.id
       WHERE cb.id = $1`,
      [id]
    );

    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const booking = bookingRes.rows[0];
    if (booking.lawyer_user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized action.' });
    }

    await query(
      `UPDATE consultation_bookings SET
        status = 'rejected',
        rejection_reason = $1,
        updated_at = NOW()
      WHERE id = $2`,
      [rejectionReason || 'Advocate unavailable at requested schedule', id]
    );

    // If already paid, trigger automatic refund record
    if (booking.payment_status === 'paid') {
      const refundId = crypto.randomUUID();
      const refundRef = `REF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await query(
        `INSERT INTO refunds (id, refund_ref, booking_id, requested_by, amount, reason, status)
         VALUES ($1, $2, $3, $4, $5, 'Advocate declined consultation request', 'pending')`,
        [refundId, refundRef, id, booking.client_id, booking.fee_amount]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Consultation declined.',
      status: 'rejected',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to decline consultation.' });
  }
};

/**
 * Access Audio/Video Consultation Room
 */
export const joinConsultationRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;

    const bookingRes = await query(
      `SELECT cb.*, lp.user_id as lawyer_user_id, lp.full_name as lawyer_name, u_client.name as client_name
       FROM consultation_bookings cb
       JOIN lawyer_profiles lp ON cb.lawyer_id = lp.id
       JOIN users u_client ON cb.client_id = u_client.id
       WHERE cb.id = $1`,
      [id]
    );

    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Consultation room not found.' });
    }

    const booking = bookingRes.rows[0];

    // Authorization check
    const isClient = booking.client_id === userId;
    const isLawyer = booking.lawyer_user_id === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isClient && !isLawyer && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied to this consultation room.' });
    }

    if (booking.payment_status !== 'paid' && !isAdmin) {
      return res.status(402).json({
        success: false,
        message: 'Payment confirmation required to access the consultation room.',
      });
    }

    // Update status to in_progress if currently confirmed
    if (booking.status === 'confirmed') {
      await query(`UPDATE consultation_bookings SET status = 'in_progress', updated_at = NOW() WHERE id = $1`, [id]);
    }

    // Generate ephemeral room credentials for WebRTC / Agora / Daily compatible session
    const roomSessionToken = crypto.randomBytes(24).toString('hex');
    const meetingRoomId = booking.meeting_room_id || `room_ciq_${booking.id.slice(0, 8)}`;

    res.status(200).json({
      success: true,
      room: {
        roomId: meetingRoomId,
        bookingRef: booking.booking_ref,
        scheduledStart: booking.scheduled_start,
        scheduledEnd: booking.scheduled_end,
        durationMinutes: booking.duration_minutes,
        mode: booking.consultation_mode,
        sessionToken: roomSessionToken,
        participant: {
          id: userId,
          name: isClient ? booking.client_name : (isLawyer ? booking.lawyer_name : 'Legal Observer'),
          role: isLawyer ? 'host' : 'attendee',
        },
      },
    });
  } catch (error) {
    console.error('Error in joinConsultationRoom:', error);
    res.status(500).json({ success: false, message: 'Failed to access consultation room.' });
  }
};

/**
 * Complete Consultation and Record Lawyer Notes & Ledger
 */
export const completeConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user.id || req.user._id;

    const bookingRes = await query(
      `SELECT cb.*, lp.user_id as lawyer_user_id
       FROM consultation_bookings cb
       JOIN lawyer_profiles lp ON cb.lawyer_id = lp.id
       WHERE cb.id = $1`,
      [id]
    );

    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const booking = bookingRes.rows[0];
    if (booking.lawyer_user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized action.' });
    }

    await query(
      `UPDATE consultation_bookings SET
        status = 'completed',
        lawyer_notes = COALESCE($1, lawyer_notes),
        completed_at = NOW(),
        updated_at = NOW()
      WHERE id = $2`,
      [notes || null, id]
    );

    // Update lawyer consultation counts
    await query(
      `UPDATE lawyer_profiles SET
        total_consultations = total_consultations + 1,
        updated_at = NOW()
      WHERE id = $1`,
      [booking.lawyer_id]
    );

    // Credit lawyer earnings ledger if not already credited
    const existingEarning = await query(
      'SELECT id FROM lawyer_earnings WHERE description LIKE $1',
      [`%${booking.booking_ref}%`]
    );

    if (existingEarning.rows.length === 0 && booking.payment_status === 'paid') {
      const gross = parseFloat(booking.fee_amount);
      const commissionRate = 15.0; // 15% platform commission
      const commission = (gross * commissionRate) / 100;
      const net = gross - commission;

      await query(
        `INSERT INTO lawyer_earnings (
          id, lawyer_id, gross_amount, platform_commission, net_earnings, description, status
        ) VALUES ($1, $2, $3, $4, $5, $6, 'available')`,
        [
          crypto.randomUUID(),
          booking.lawyer_id,
          gross,
          commission,
          net,
          `Consultation fee for Booking ${booking.booking_ref}`,
        ]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Consultation marked as completed.',
    });
  } catch (error) {
    console.error('Error in completeConsultation:', error);
    res.status(500).json({ success: false, message: 'Failed to complete consultation.' });
  }
};


/**
 * Astrotalk-style Instant Consultation Start
 * Supports instant chat and call sessions
 */
export const startInstantConsultation = async (req, res) => {
  try {
    const clientId = req.user.id || req.user._id;
    const {
      lawyerId,
      mode = 'chat', // 'chat' | 'call' | 'audio' | 'video'
      durationMinutes = 15,
      legalIssueDescription = 'Astrotalk Instant Legal Consultation',
    } = req.body;

    if (!lawyerId) {
      return res.status(400).json({ success: false, message: 'Advocate ID is required.' });
    }

    // Fetch advocate details
    const lawyerRes = await query(
      'SELECT lp.*, u.email, u.phone FROM lawyer_profiles lp JOIN users u ON lp.user_id = u.id WHERE lp.id = $1 OR lp.user_id = $1',
      [lawyerId]
    );

    if (lawyerRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Advocate profile not found.' });
    }

    const lawyer = lawyerRes.rows[0];
    const fee15 = parseFloat(lawyer.consultation_fee_15) || 499;
    const fee30 = parseFloat(lawyer.consultation_fee_30) || 899;
    const fee60 = parseFloat(lawyer.consultation_fee_60) || 1499;

    let fee = fee15;
    if (Number(durationMinutes) === 30) fee = fee30;
    else if (Number(durationMinutes) === 60) fee = fee60;

    const bookingRef = `ASTRO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const bookingId = crypto.randomUUID();
    const sessionLogId = crypto.randomUUID();
    const meetingRoomId = `room_${bookingRef.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + Number(durationMinutes) * 60000);

    // Ensure consultation_session_logs table exists
    await query(`
      CREATE TABLE IF NOT EXISTS consultation_session_logs (
        id VARCHAR(36) PRIMARY KEY,
        booking_id VARCHAR(36),
        advocate_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        mode VARCHAR(20) NOT NULL,
        duration_seconds INT DEFAULT 0,
        fee_charged NUMERIC(10, 2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'started',
        started_at TIMESTAMPTZ DEFAULT NOW(),
        ended_at TIMESTAMPTZ,
        metadata JSONB DEFAULT '{}'
      );
    `);

    const normalizedMode = mode === 'call' ? 'audio' : mode;

    // Create confirmed instant consultation booking
    await query(
      `INSERT INTO consultation_bookings (
        id, booking_ref, client_id, lawyer_id, practice_area, consultation_mode,
        duration_minutes, scheduled_start, scheduled_end, fee_amount, currency,
        payment_status, status, legal_issue_description, urgency, meeting_room_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'INR', 'paid', 'confirmed', $11, 'high', $12)`,
      [
        bookingId,
        bookingRef,
        clientId,
        lawyer.id,
        lawyer.primary_specialty,
        normalizedMode,
        durationMinutes,
        startDate.toISOString(),
        endDate.toISOString(),
        fee,
        legalIssueDescription,
        meetingRoomId,
      ]
    );

    // Create linked conversation
    const convId = crypto.randomUUID();
    await query(
      `INSERT INTO conversations (id, booking_id, client_id, lawyer_id) VALUES ($1, $2, $3, $4)`,
      [convId, bookingId, clientId, lawyer.user_id]
    );

    // Welcome greeting in chat
    const greeting = mode === 'chat'
      ? `Hello! Your instant consultation with ${lawyer.full_name} is active. Type your legal queries below.`
      : `Instant call connection active with ${lawyer.full_name}.`;

    await query(
      `INSERT INTO messages (id, conversation_id, booking_id, sender_id, recipient_id, content, message_type)
       VALUES ($1, $2, $3, $4, $5, $6, 'text')`,
      [crypto.randomUUID(), convId, bookingId, lawyer.user_id, clientId, greeting]
    );

    // Log in consultation_session_logs directly in PostgreSQL
    await query(
      `INSERT INTO consultation_session_logs (
        id, booking_id, advocate_id, user_id, mode, fee_charged, status, started_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'started', NOW())`,
      [sessionLogId, bookingId, lawyer.id, clientId, mode, fee]
    );

    res.status(201).json({
      success: true,
      message: `Instant ${mode} consultation started successfully.`,
      booking: {
        id: bookingId,
        booking_ref: bookingRef,
        meeting_room_id: meetingRoomId,
        fee_amount: fee,
        mode,
        status: 'confirmed',
        scheduled_start: startDate.toISOString(),
      },
      sessionLogId,
    });
  } catch (error) {
    console.error('Error in startInstantConsultation:', error);
    res.status(500).json({ success: false, message: 'Failed to start instant consultation.' });
  }
};

/**
 * End Active Consultation Session & Persist Logs
 */
export const endConsultationSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { durationSeconds = 0, notes = '' } = req.body;

    // Update session logs
    await query(
      `UPDATE consultation_session_logs
       SET duration_seconds = $1, ended_at = NOW(), status = 'completed'
       WHERE booking_id = $2 OR id = $2`,
      [parseInt(durationSeconds, 10) || 0, id]
    );

    // Update consultation booking
    await query(
      `UPDATE consultation_bookings
       SET status = 'completed', completed_at = NOW(), lawyer_notes = COALESCE($1, lawyer_notes)
       WHERE id = $2`,
      [notes, id]
    );

    res.status(200).json({
      success: true,
      message: 'Consultation session concluded and recorded successfully.',
    });
  } catch (error) {
    console.error('Error in endConsultationSession:', error);
    res.status(500).json({ success: false, message: 'Failed to record session completion.' });
  }
};
