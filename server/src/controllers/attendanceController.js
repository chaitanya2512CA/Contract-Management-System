import { Registration } from '../models/Registration.js';
import { Attendance } from '../models/Attendance.js';
import { Event } from '../models/Event.js';
import { Notification } from '../models/Notification.js';

/**
 * Verify Ticket Code and Mark Attendance
 * Used by mobile-friendly QR scanner and manual entry
 */
export const verifyAndMarkAttendance = async (req, res) => {
  try {
    const organizer = req.user;
    const { ticketCode, eventId } = req.body;

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

    const registration = await Registration.findOne({ ticketCode: cleanCode })
      .populate('user', 'name email studentId department phone avatar')
      .populate('event', 'title eventDate organizer venue');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: `No active registration found matching ticket code "${cleanCode}".`,
      });
    }

    // Check if organizer is authorized for this event
    if (
      organizer.role !== 'admin' &&
      String(registration.event.organizer) !== String(organizer._id) &&
      eventId &&
      String(registration.event._id) !== String(eventId)
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to mark attendance for this event.',
      });
    }

    // If already marked
    if (registration.status === 'attended') {
      const existingAttendance = await Attendance.findOne({ registration: registration._id });
      return res.status(200).json({
        success: true,
        alreadyMarked: true,
        message: `Attendance was already verified for ${registration.user.name} on ${new Date(registration.attendedAt).toLocaleTimeString()}`,
        attendee: {
          name: registration.user.name,
          email: registration.user.email,
          studentId: registration.user.studentId,
          department: registration.user.department,
          ticketCode: registration.ticketCode,
          eventTitle: registration.event.title,
          attendedAt: registration.attendedAt,
        },
      });
    }

    if (registration.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This registration has been cancelled by the student.',
      });
    }

    // Mark as attended
    registration.status = 'attended';
    registration.attendedAt = new Date();
    await registration.save();

    // Create attendance log
    await Attendance.create({
      event: registration.event._id,
      registration: registration._id,
      user: registration.user._id,
      markedBy: organizer._id,
      verificationMethod: req.body.method || 'qr_scan',
      markedAt: new Date(),
    });

    // Notify attendee
    await Notification.create({
      recipient: registration.user._id,
      title: 'Attendance Verified! 🎉',
      message: `Your attendance for "${registration.event.title}" has been successfully verified. You are now eligible for your participation certificate.`,
      type: 'event_update',
      link: '/certificates',
    });

    res.status(200).json({
      success: true,
      alreadyMarked: false,
      message: `Attendance marked successfully for ${registration.user.name}!`,
      attendee: {
        name: registration.user.name,
        email: registration.user.email,
        studentId: registration.user.studentId,
        department: registration.user.department,
        ticketCode: registration.ticketCode,
        eventTitle: registration.event.title,
        attendedAt: registration.attendedAt,
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
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    const totalRegistrations = await Registration.countDocuments({
      event: eventId,
      status: { $in: ['registered', 'attended'] },
    });

    const attendedCount = await Registration.countDocuments({
      event: eventId,
      status: 'attended',
    });

    const waitlistedCount = await Registration.countDocuments({
      event: eventId,
      status: 'waitlisted',
    });

    const attendanceRate = totalRegistrations > 0 ? Math.round((attendedCount / totalRegistrations) * 100) : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalRegistrations,
        attendedCount,
        waitlistedCount,
        attendanceRate,
        capacity: event.maxCapacity,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch attendance stats.' });
  }
};
