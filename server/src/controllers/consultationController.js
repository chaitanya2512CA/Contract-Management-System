import crypto from 'crypto';
import { query } from '../config/db.js';
import { sendConsultationAcceptedEmail, sendEscrowPayoutReleasedEmail } from '../utils/email.js';

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
      // Check if id is a consultation_request id
      const reqRes = await query(
        `SELECT cr.*,
                adv.name as lawyer_name, adv.avatar as lawyer_avatar, adv.id as lawyer_user_id,
                cli.name as client_name, cli.email as client_email, cli.avatar as client_avatar,
                lp.id as lawyer_id, lp.primary_specialty as lawyer_specialty
         FROM consultation_requests cr
         LEFT JOIN users adv ON cr.advocate_id = adv.id
         LEFT JOIN users cli ON cr.client_id = cli.id
         LEFT JOIN lawyer_profiles lp ON adv.id = lp.user_id OR cr.advocate_id = lp.id
         WHERE cr.id = $1`,
        [id]
      );

      if (reqRes.rows.length > 0) {
        const reqItem = reqRes.rows[0];
        if (reqItem.booking_id) {
          const linkedRes = await query(
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
              cr_rev.rating as client_rating,
              cr_rev.review_text as client_review
            FROM consultation_bookings cb
            JOIN users u_client ON cb.client_id = u_client.id
            JOIN lawyer_profiles lp ON cb.lawyer_id = lp.id
            JOIN users u_lawyer ON lp.user_id = u_lawyer.id
            LEFT JOIN client_reviews cr_rev ON cr_rev.booking_id = cb.id
            WHERE cb.id = $1`,
            [reqItem.booking_id]
          );
          if (linkedRes.rows.length > 0) {
            return res.status(200).json({
              success: true,
              consultation: { ...linkedRes.rows[0], request_status: reqItem.status, request_id: reqItem.id },
            });
          }
        }

        return res.status(200).json({
          success: true,
          consultation: {
            id: reqItem.id,
            request_id: reqItem.id,
            booking_ref: `REQ-${reqItem.id.slice(0, 8)}`,
            client_id: reqItem.client_id,
            client_name: reqItem.client_name,
            client_avatar: reqItem.client_avatar,
            lawyer_id: reqItem.lawyer_id || reqItem.advocate_id,
            lawyer_user_id: reqItem.lawyer_user_id || reqItem.advocate_id,
            lawyer_name: reqItem.lawyer_name,
            lawyer_avatar: reqItem.lawyer_avatar,
            practice_area: reqItem.lawyer_specialty || 'General Consultation',
            consultation_mode: reqItem.mode === 'call' ? 'audio' : 'chat',
            duration_minutes: reqItem.duration_minutes || reqItem.duration_mins || 15,
            fee_amount: reqItem.calculated_fee || (parseFloat(reqItem.rate_per_min) || 25) * (reqItem.duration_minutes || reqItem.duration_mins || 15),
            status: reqItem.status,
            request_status: reqItem.status,
            payment_status: reqItem.payment_status || 'unpaid',
            payout_status: reqItem.payout_status || 'pending',
            meeting_room_id: reqItem.meeting_room_id || `room_${reqItem.id}`,
            created_at: reqItem.created_at,
          },
        });
      }

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
  return respondToConsultationRequest(req, res);
};

/**
 * Lawyer Reject Consultation Request
 */
export const rejectConsultation = async (req, res) => {
  req.body = { ...req.body, action: 'decline' };
  return respondToConsultationRequest(req, res);
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
/**
 * Astrotalk End Consultation Session & Release Escrow
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
    const bRes = await query(
      `UPDATE consultation_bookings
       SET status = 'completed', completed_at = NOW(), lawyer_notes = COALESCE($1, lawyer_notes),
           payment_status = CASE WHEN payment_status = 'held_in_escrow' THEN 'released_to_advocate' ELSE payment_status END,
           payout_status = 'released_to_advocate',
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [notes || null, id]
    );

    // Also update consultation_requests if linked
    await query(
      `UPDATE consultation_requests
       SET status = 'completed', payout_status = 'released_to_advocate',
           payment_status = CASE WHEN payment_status = 'held_in_escrow' THEN 'released_to_advocate' ELSE payment_status END,
           updated_at = NOW()
       WHERE id = $1 OR booking_id = $1`,
      [id]
    );

    // Release escrow and credit advocate balance
    if (bRes.rows.length > 0) {
      const booking = bRes.rows[0];
      const gross = parseFloat(booking.fee_amount) || 0;
      if (gross > 0) {
        const commissionRate = 15.0; // 15% platform commission
        const commission = (gross * commissionRate) / 100;
        const net = gross - commission;

        // Fetch advocate user details
        const advUserRes = await query(
          `SELECT u.id, u.name, u.email
           FROM users u
           LEFT JOIN lawyer_profiles lp ON lp.user_id = u.id OR lp.id = $1
           WHERE u.id = $1 OR lp.id = $1 OR lp.user_id = $1
           LIMIT 1`,
          [booking.lawyer_id]
        );

        // Fetch client details
        const cliUserRes = await query(
          `SELECT id, name, email FROM users WHERE id = $1`,
          [booking.client_id]
        );

        const advocateUser = advUserRes.rows[0];
        const clientUser = cliUserRes.rows[0];

        // Insert into lawyer_earnings if not already recorded
        const existingEarning = await query(
          'SELECT id FROM lawyer_earnings WHERE description LIKE $1',
          [`%${booking.booking_ref || id}%`]
        );

        if (existingEarning.rows.length === 0) {
          await query(
            `INSERT INTO lawyer_earnings (
               id, lawyer_id, transaction_id, gross_amount, platform_commission, net_earnings, description, status, created_at
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'available', NOW())`,
            [
              crypto.randomUUID(),
              booking.lawyer_id,
              booking.id,
              gross,
              commission,
              net,
              `Consultation escrow release (${booking.booking_ref || id})`,
            ]
          );

          // Update advocate wallet balance in users table
          if (advocateUser?.id) {
            try {
              await query(
                `UPDATE users SET wallet_balance = COALESCE(wallet_balance, 0) + $1 WHERE id = $2`,
                [net, advocateUser.id]
              );
            } catch (_) {}
          }

          // Dispatch automated payout confirmation email to advocate (await for serverless)
          if (advocateUser?.email) {
            try {
              await sendEscrowPayoutReleasedEmail({
                toEmail: advocateUser.email,
                advocateName: advocateUser.name || 'Advocate',
                clientName: clientUser?.name || 'Valued Client',
                grossAmount: gross,
                platformCommission: commission,
                netAmount: net,
                consultationRef: booking.booking_ref || id,
              });
            } catch (mailErr) {
              console.warn('[Escrow Release Email Notice]:', mailErr.message);
            }
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Consultation session concluded and escrow released to advocate successfully.',
    });
  } catch (error) {
    console.error('Error in endConsultationSession:', error);
    res.status(500).json({ success: false, message: 'Failed to record session completion.' });
  }
};

/**
 * Step 1: Create Consultation Request (Client Sends Request — No Payment Required Yet)
 */
export const createConsultationRequest = async (req, res) => {
  try {
    const clientId = (req.user && (req.user.id || req.user._id)) || req.body.clientId;
    if (!clientId) {
      return res.status(401).json({ success: false, message: 'Authentication required to request a consultation.' });
    }

    const {
      advocateId,
      channel,
      mode = channel || 'chat',
      durationMins,
      durationMinutes = durationMins || 15,
      ratePerMin,
      calculatedFee,
      matterDescription,
      legalDescription = matterDescription || 'Immediate Legal Consultation',
      legalIssueDescription = legalDescription,
    } = req.body;

    if (!advocateId) {
      return res.status(400).json({ success: false, message: 'Advocate ID is required.' });
    }

    // Ensure table exists
    await query(`
      CREATE TABLE IF NOT EXISTS consultation_requests (
        id VARCHAR(36) PRIMARY KEY,
        client_id VARCHAR(36) NOT NULL,
        advocate_id VARCHAR(36) NOT NULL,
        channel VARCHAR(20) NOT NULL DEFAULT 'chat',
        mode VARCHAR(20) NOT NULL DEFAULT 'chat',
        duration_mins INT DEFAULT 15,
        duration_minutes INT DEFAULT 15,
        calculated_fee NUMERIC(10, 2) NOT NULL DEFAULT 499.00,
        rate_per_min NUMERIC(10, 2) DEFAULT 25.00,
        matter_description TEXT DEFAULT '',
        legal_issue_description TEXT DEFAULT '',
        status VARCHAR(30) DEFAULT 'pending_acceptance',
        payment_status VARCHAR(30) DEFAULT 'unpaid',
        payout_status VARCHAR(30) DEFAULT 'pending',
        booking_id VARCHAR(36) DEFAULT NULL,
        meeting_room_id VARCHAR(100) DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Fetch advocate details across lawyer_profiles, advocates, and users
    const advocateRes = await query(
      `SELECT lp.id as profile_id, lp.user_id, COALESCE(lp.full_name, a.full_name, u.name, 'Advocate') as full_name,
              lp.consultation_fee_15, lp.consultation_fee_30, lp.consultation_fee_60,
              COALESCE(u.email, a.email) as email,
              COALESCE(lp.primary_specialty, a.primary_specialty, 'Legal Consultation') as primary_specialty
       FROM users u
       LEFT JOIN lawyer_profiles lp ON lp.user_id = u.id OR lp.id = $1
       LEFT JOIN advocates a ON a.user_id = u.id OR a.id = $1
       WHERE u.id = $1 OR lp.id = $1 OR a.id = $1 OR a.user_id = $1
       LIMIT 1`,
      [advocateId]
    );

    let targetAdvocateId = advocateId;
    let targetUserId = advocateId;
    let advocateName = 'Advocate';
    let fee15 = 499, fee30 = 899, fee60 = 1499;

    if (advocateRes.rows.length > 0) {
      const adv = advocateRes.rows[0];
      targetAdvocateId = adv.profile_id || adv.user_id || advocateId;
      targetUserId = adv.user_id || advocateId;
      advocateName = adv.full_name;
      fee15 = parseFloat(adv.consultation_fee_15) || 499;
      fee30 = parseFloat(adv.consultation_fee_30) || 899;
      fee60 = parseFloat(adv.consultation_fee_60) || 1499;
    }

    const chosenDuration = parseInt(durationMinutes, 10) || 15;
    let sessionFee = parseFloat(calculatedFee);
    if (!sessionFee || isNaN(sessionFee) || sessionFee <= 0) {
      if (chosenDuration === 30) sessionFee = fee30;
      else if (chosenDuration === 60) sessionFee = fee60;
      else sessionFee = fee15;
    }
    const computedRate = parseFloat(ratePerMin) || Math.max(15, Math.round(sessionFee / chosenDuration));
    const finalMatter = (legalIssueDescription || matterDescription || legalDescription || 'Immediate Legal Consultation').trim();
    const finalChannel = (channel || mode || 'chat').toLowerCase();

    const requestId = crypto.randomUUID();

    // Clean INSERT with exact parameter alignment
    await query(
      `INSERT INTO consultation_requests (
         id, client_id, advocate_id, channel, mode, duration_mins, duration_minutes,
         calculated_fee, rate_per_min, matter_description, legal_issue_description,
         status, payment_status, payout_status, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending_acceptance', 'unpaid', 'pending', NOW(), NOW())`,
      [
        requestId,
        clientId,
        targetAdvocateId,
        finalChannel,
        finalChannel,
        chosenDuration,
        chosenDuration,
        sessionFee,
        computedRate,
        finalMatter,
        finalMatter,
      ]
    );

    // Notify advocate
    try {
      await query(
        `INSERT INTO notifications (id, recipient_id, title, message, type, link)
         VALUES ($1, $2, $3, $4, 'consultation_request', $5)`,
        [
          crypto.randomUUID(),
          targetUserId,
          'New Consultation Request Received',
          `Client ${(req.user && req.user.name) || 'A client'} requested a ${chosenDuration}-min ${finalChannel.toUpperCase()} consultation for: "${finalMatter.substring(0, 50)}..." (Fee: ₹${sessionFee})`,
          '/lawyer/dashboard',
        ]
      );
    } catch (_) {}

    return res.status(201).json({
      success: true,
      message: 'Consultation request sent successfully. Waiting for advocate acceptance.',
      request: {
        id: requestId,
        client_id: clientId,
        advocate_id: targetAdvocateId,
        advocate_name: advocateName,
        channel: finalChannel,
        mode: finalChannel,
        duration_mins: chosenDuration,
        duration_minutes: chosenDuration,
        calculated_fee: sessionFee,
        rate_per_min: computedRate,
        matter_description: finalMatter,
        status: 'pending_acceptance',
        payment_status: 'unpaid',
      },
    });
  } catch (error) {
    console.error('Error in createConsultationRequest:', error);
    return res.status(500).json({ success: false, message: 'Failed to create consultation request.', error: error.message });
  }
};

/**
 * Get Single Consultation Request Status (for Client polling)
 */
export const getConsultationRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT cr.*,
              COALESCE(adv.name, adv.full_name, lp.full_name, 'Advocate') as advocate_name,
              COALESCE(adv.avatar, '') as advocate_avatar,
              cli.name as client_name, cli.email as client_email, cli.avatar as client_avatar,
              cb.meeting_room_id, cb.payment_status as booking_payment_status,
              cb.status as booking_status
       FROM consultation_requests cr
       LEFT JOIN users adv ON cr.advocate_id = adv.id
       LEFT JOIN lawyer_profiles lp ON cr.advocate_id = lp.id OR cr.advocate_id = lp.user_id
       LEFT JOIN users cli ON cr.client_id = cli.id
       LEFT JOIN consultation_bookings cb ON cr.booking_id = cb.id
       WHERE cr.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Consultation request not found.' });
    }

    const request = result.rows[0];
    const isAccepted =
      request.status === 'accepted_awaiting_payment' ||
      request.status === 'accepted' ||
      request.status === 'paid_ready' ||
      request.status === 'in_progress';

    const isPaid =
      request.payment_status === 'held_in_escrow' ||
      request.payment_status === 'paid' ||
      request.booking_payment_status === 'held_in_escrow' ||
      request.booking_payment_status === 'paid';

    res.status(200).json({
      success: true,
      request,
      bookingId: request.booking_id || request.id,
      meetingRoomId: request.meeting_room_id,
      status: request.status,
      paymentStatus: request.payment_status,
      isPending: request.status === 'pending_acceptance' || request.status === 'pending',
      isAccepted,
      isAwaitingPayment: request.status === 'accepted_awaiting_payment',
      isPaidReady: request.status === 'paid_ready' || request.status === 'in_progress',
      isPaid,
      isDeclined: request.status === 'declined' || request.status === 'rejected',
    });
  } catch (error) {
    console.error('Error in getConsultationRequestStatus:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch request status.' });
  }
};

/**
 * Step 2: Get Incoming Consultation Requests (for Advocate Dashboard)
 */
export const getIncomingConsultationRequests = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const lpRes = await query('SELECT id FROM lawyer_profiles WHERE user_id = $1', [userId]);
    const lawyerProfileId = lpRes.rows[0]?.id;

    const result = await query(
      `SELECT cr.*,
              cli.name as client_name, cli.email as client_email, cli.phone as client_phone, cli.avatar as client_avatar
       FROM consultation_requests cr
       JOIN users cli ON cr.client_id = cli.id
       WHERE (cr.advocate_id = $1 OR cr.advocate_id = $2)
         AND (cr.status = 'pending_acceptance' OR cr.status = 'pending')
       ORDER BY cr.created_at DESC`,
      [userId, lawyerProfileId || userId]
    );

    res.status(200).json({
      success: true,
      requests: result.rows,
    });
  } catch (error) {
    console.error('Error in getIncomingConsultationRequests:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch incoming requests.' });
  }
};

/**
 * Step 2: Respond to Consultation Request (Advocate Accepts or Declines)
 */
export const respondToConsultationRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const rawAction = req.body?.action || req.body?.status || (req.path && req.path.includes('accept') ? 'accept' : 'accept');
    const action = String(rawAction).toLowerCase();

    if (action !== 'accept' && action !== 'decline' && action !== 'reject' && action !== 'declined' && action !== 'rejected') {
      return res.status(400).json({ success: false, message: "Action must be 'accept' or 'decline'." });
    }

    const isDecline = action === 'decline' || action === 'reject' || action === 'declined' || action === 'rejected';

    // 1. Check consultation_requests table first
    let reqRes = null;
    try {
      reqRes = await query('SELECT * FROM consultation_requests WHERE id = $1 OR booking_id = $1 LIMIT 1', [id]);
    } catch (e) {
      console.warn('[respondToConsultationRequest] Query consultation_requests error:', e.message);
    }

    if (reqRes && reqRes.rows.length > 0) {
      const request = reqRes.rows[0];

      if (isDecline) {
        await query(
          `UPDATE consultation_requests SET status = 'declined', updated_at = NOW() WHERE id = $1`,
          [request.id]
        );
        return res.status(200).json({
          success: true,
          message: 'Consultation request declined.',
          status: 'declined',
          consultation: { ...request, status: 'declined' },
        });
      }

      // Action is 'accept' -> transition to 'accepted_awaiting_payment'
      let bookingId = request.booking_id;
      const bookingRef = `ASTRO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const meetingRoomId = request.meeting_room_id || `room_${bookingRef.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const durationMins = request.duration_mins || request.duration_minutes || 15;
      const fee = parseFloat(request.calculated_fee) || ((parseFloat(request.rate_per_min) || 25) * durationMins);

      // Fetch advocate profile safely (resilient to different table shapes)
      let lawyer = null;
      try {
        const lpRes = await query(
          `SELECT id, user_id, primary_specialty, full_name, email FROM lawyer_profiles WHERE user_id = $1 OR id = $1 LIMIT 1`,
          [request.advocate_id]
        );
        if (lpRes.rows.length > 0) {
          lawyer = lpRes.rows[0];
        }
      } catch (_) {}

      if (!lawyer) {
        try {
          const uRes = await query(
            `SELECT id, id as user_id, COALESCE(name, full_name, 'Advocate') as full_name, email, primary_specialty FROM users WHERE id = $1 LIMIT 1`,
            [request.advocate_id]
          );
          if (uRes.rows.length > 0) {
            lawyer = uRes.rows[0];
          }
        } catch (_) {}
      }

      if (!lawyer) {
        lawyer = {
          id: request.advocate_id,
          user_id: request.advocate_id,
          primary_specialty: 'Legal Consultation',
          full_name: 'Advocate',
        };
      }

      // Fetch client details safely
      let client = { name: 'Valued Client', email: '' };
      try {
        const clientRes = await query('SELECT id, name, email FROM users WHERE id = $1 LIMIT 1', [request.client_id]);
        if (clientRes.rows.length > 0) {
          client = clientRes.rows[0];
        }
      } catch (_) {}

      if (!bookingId) {
        bookingId = crypto.randomUUID();

        // Safely insert into consultation_bookings
        try {
          await query(
            `INSERT INTO consultation_bookings (
               id, booking_ref, client_id, lawyer_id, practice_area, consultation_mode,
               duration_minutes, scheduled_start, scheduled_end, fee_amount, currency,
               payment_status, status, legal_issue_description, urgency, meeting_room_id, payout_status
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW() + INTERVAL '15 minutes', $8, 'INR', 'unpaid', 'accepted_awaiting_payment', $9, 'high', $10, 'held_in_escrow')`,
            [
              bookingId,
              bookingRef,
              request.client_id,
              lawyer.id,
              lawyer.primary_specialty || 'General Legal Counsel',
              request.channel === 'call' || request.mode === 'call' ? 'audio' : 'chat',
              durationMins,
              fee,
              request.matter_description || 'Instant Legal Consultation',
              meetingRoomId,
            ]
          );
        } catch (cbErr) {
          console.warn('[respondToConsultationRequest] consultation_bookings insert notice:', cbErr.message);
        }

        // Create linked conversation safely
        try {
          const convId = crypto.randomUUID();
          await query(
            `INSERT INTO conversations (id, booking_id, client_id, lawyer_id) VALUES ($1, $2, $3, $4)`,
            [convId, bookingId, request.client_id, lawyer.user_id || lawyer.id]
          );

          const greeting =
            request.channel === 'call' || request.mode === 'call'
              ? `Call consultation accepted by ${lawyer.full_name}. Complete UPI escrow payment to begin live call.`
              : `Consultation accepted by ${lawyer.full_name}. Complete UPI escrow payment to unlock live messaging.`;

          await query(
            `INSERT INTO messages (id, conversation_id, booking_id, sender_id, recipient_id, content, message_type)
             VALUES ($1, $2, $3, $4, $5, $6, 'system')`,
            [crypto.randomUUID(), convId, bookingId, lawyer.user_id || lawyer.id, request.client_id, greeting]
          );
        } catch (convErr) {
          console.warn('[respondToConsultationRequest] conversation insert notice:', convErr.message);
        }
      }

      // Update consultation_requests to 'accepted_awaiting_payment'
      const updateRes = await query(
        `UPDATE consultation_requests
         SET status = 'accepted_awaiting_payment', booking_id = $1, meeting_room_id = $2, updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [bookingId, meetingRoomId, request.id]
      );

      const updatedRow = (updateRes && updateRes.rows[0]) || {
        ...request,
        status: 'accepted_awaiting_payment',
        booking_id: bookingId,
        meeting_room_id: meetingRoomId,
      };

      // Notify client via email asynchronously inside try/catch
      if (client.email) {
        try {
          await sendConsultationAcceptedEmail({
            toEmail: client.email,
            userName: client.name,
            advocateName: lawyer.full_name,
            channel: request.channel || request.mode || 'Chat',
            durationMins,
            amount: fee,
            bookingId,
          });
        } catch (mailErr) {
          console.warn('[Consultation Accept Email Notice]:', mailErr.message);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Consultation request accepted. Client has been notified to complete direct UPI escrow payment.',
        status: 'accepted_awaiting_payment',
        consultation: updatedRow,
        bookingId,
        meetingRoomId,
        requestId: request.id,
        fee,
      });
    }

    // 2. Check consultation_bookings table
    const cbRes = await query(
      `SELECT cb.*, lp.user_id as lawyer_user_id
       FROM consultation_bookings cb
       LEFT JOIN lawyer_profiles lp ON cb.lawyer_id = lp.id
       WHERE cb.id = $1 OR cb.booking_ref = $1
       LIMIT 1`,
      [id]
    );

    if (cbRes.rows.length > 0) {
      const booking = cbRes.rows[0];

      if (isDecline) {
        await query(
          `UPDATE consultation_bookings SET status = 'rejected', updated_at = NOW() WHERE id = $1`,
          [booking.id]
        );
        return res.status(200).json({
          success: true,
          message: 'Consultation declined.',
          status: 'rejected',
          consultation: { ...booking, status: 'rejected' },
        });
      }

      const nextStatus = booking.payment_status === 'paid' ? 'confirmed' : 'accepted_awaiting_payment';

      const updateCb = await query(
        `UPDATE consultation_bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [nextStatus, booking.id]
      );

      return res.status(200).json({
        success: true,
        message: 'Consultation request accepted.',
        status: nextStatus,
        consultation: updateCb.rows[0] || { ...booking, status: nextStatus },
        bookingId: booking.id,
        requestId: id,
      });
    }

    return res.status(404).json({ success: false, message: 'Consultation request not found.' });
  } catch (error) {
    console.error('[respondToConsultationRequest Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: error.message || 'Failed to respond to consultation request.',
    });
  }
};

export const cancelConsultationRequest = async (req, res) => {
  try {
    const { id } = req.params;
    await query(
      `UPDATE consultation_requests SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
      [id]
    );
    res.status(200).json({ success: true, message: 'Consultation request cancelled.' });
  } catch (error) {
    console.error('Error in cancelConsultationRequest:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel consultation request.' });
  }
};
