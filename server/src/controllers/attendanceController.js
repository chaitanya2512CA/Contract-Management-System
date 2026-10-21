import crypto from 'crypto';
import { query } from '../config/db.js';

/**
 * Verify Ticket Code and Mark Attendance
 * Used by mobile-friendly QR scanner and manual entry
 */
export const verifyAndMarkAttendance = async (req, res) => {
  try {
    const organizer = req.user;
    const { ticketCode, eventId, method } = req.body;

    if (!ticketCode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid ticket code or QR payload.',
      });
    }

    // Clean ticket code
    let cleanCode = ticketCode.trim();

    // If QR payload contains JSON
    try {
      if (cleanCode.startsWith('{') && cleanCode.endsWith('}')) {
        const parsed = JSON.parse(cleanCode);
        if (parsed.ticketCode) {
          cleanCode = parsed.ticketCode;
        }
      }
    } catch {
      // not json, proceed with string
    }

    const regRes = await query(
      `SELECT r.*, 
              u.id as user_id, u.name as user_name, u.email as user_email, u.student_id as user_student_id, u.department as user_department,
              e.id as event_id, e.title as event_title, e.event_date, e.creator_id, e.venue
       FROM event_registrations r
       JOIN users u ON r.user_id = u.id
       JOIN events e ON r.event_id = e.id
       WHERE r.ticket_code = $1`,
      [cleanCode]
    );

    if (regRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No active registration found matching ticket code "${cleanCode}".`,
      });
    }

    const registration = regRes.rows[0];

    // Check if organizer is authorized for this event
    const organizerId = organizer.id || organizer._id;
    if (
      organizer.role !== 'admin' &&
      String(registration.creator_id) !== String(organizerId) &&
      eventId &&
      String(registration.event_id) !== String(eventId)
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to mark attendance for this event.',
      });
    }

    // If already marked
    if (registration.status === 'attended') {
      const attRes = await query('SELECT * FROM attendances WHERE registration_id = $1', [registration.id]);
      const attendedTime = attRes.rows[0]?.checked_in_at || registration.updated_at;
      return res.status(200).json({
        success: true,
        alreadyMarked: true,
        message: `Attendance was already verified for ${registration.user_name} on ${new Date(attendedTime).toLocaleTimeString()}`,
        attendee: {
          name: registration.user_name,
          email: registration.user_email,
          studentId: registration.user_student_id,
          department: registration.user_department,
          ticketCode: registration.ticket_code,
          eventTitle: registration.event_title,
          attendedAt: attendedTime,
        },
      });
    }

    if (registration.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This registration has been cancelled by the student.',
      });
    }

    const now = new Date();
    // Mark as attended
    await query(
      "UPDATE event_registrations SET status = 'attended', updated_at = NOW() WHERE id = $1",
      [registration.id]
    );

    // Create attendance log
    await query(
      `INSERT INTO attendances (id, event_id, registration_id, student_id, ticket_code, checked_in_at, verified_by, scan_method, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, NOW())`,
      [
        crypto.randomUUID(),
        registration.event_id,
        registration.id,
        registration.user_id,
        registration.ticket_code,
        organizerId,
        method || 'qr_scan',
      ]
    );

    // Notify attendee
    await query(
      `INSERT INTO notifications (id, recipient_id, title, message, type, link, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, false, NOW())`,
      [
        crypto.randomUUID(),
        registration.user_id,
        'Attendance Verified! 🎉',
        `Your attendance for "${registration.event_title}" has been successfully verified. You are now eligible for your participation certificate.`,
        'event_update',
        '/certificates',
      ]
    ).catch(() => {});

    res.status(200).json({
      success: true,
      alreadyMarked: false,
      message: `Attendance marked successfully for ${registration.user_name}!`,
      attendee: {
        name: registration.user_name,
        email: registration.user_email,
        studentId: registration.user_student_id,
        department: registration.user_department,
        ticketCode: registration.ticket_code,
        eventTitle: registration.event_title,
        attendedAt: now,
      },
    });
  } catch (error) {
    console.error('Error in verifyAndMarkAttendance:', error);
    res.status(500).json({ success: false, message: 'Server error marking attendance.' });
  }
};

/**
 * Get Attendance Statistics for an Event
 */
export const getEventAttendanceStats = async (req, res) => {
  try {
    const { eventId } = req.params;
    const eventRes = await query('SELECT id, max_capacity FROM events WHERE id = $1', [eventId]);
    if (eventRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }
    const maxCapacity = eventRes.rows[0].max_capacity;

    const [totalRegRes, attendedRes, waitlistedRes] = await Promise.all([
      query("SELECT COUNT(*) FROM event_registrations WHERE event_id = $1 AND status IN ('confirmed', 'attended')", [eventId]),
      query("SELECT COUNT(*) FROM event_registrations WHERE event_id = $1 AND status = 'attended'", [eventId]),
      query("SELECT COUNT(*) FROM event_registrations WHERE event_id = $1 AND status = 'waitlisted'", [eventId]),
    ]);

    const totalRegistrations = parseInt(totalRegRes.rows[0].count, 10) || 0;
    const attendedCount = parseInt(attendedRes.rows[0].count, 10) || 0;
    const waitlistedCount = parseInt(waitlistedRes.rows[0].count, 10) || 0;
    const attendanceRate = totalRegistrations > 0 ? Math.round((attendedCount / totalRegistrations) * 100) : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalRegistrations,
        attendedCount,
        waitlistedCount,
        attendanceRate,
        capacity: maxCapacity,
      },
    });
  } catch (error) {
    console.error('Error in getEventAttendanceStats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch attendance stats.' });
  }
};

