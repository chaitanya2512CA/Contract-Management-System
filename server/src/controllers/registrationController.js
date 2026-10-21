import { Registration } from '../models/Registration.js';
import { Event } from '../models/Event.js';
import { Team } from '../models/Team.js';
import { Notification } from '../models/Notification.js';
import { generateTicketCode, generateQRCodeDataUrl } from '../utils/qrHelper.js';
import { findScheduleConflict } from '../utils/conflictDetector.js';
import { Parser } from 'json2csv';

/**
 * Register for an Event (Individual)
 */
export const registerForEvent = async (req, res) => {
  try {
    const student = req.user;
    const { eventId } = req.params;
    const { bypassConflict } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (event.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'This event is not currently accepting registrations.',
      });
    }

    // Check registration deadline
    const now = new Date();
    if (new Date(event.registrationDeadline) < now) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline for this event has passed.',
      });
    }

    // Check if already registered
    const existingRegistration = await Registration.findOne({
      event: event._id,
      user: student._id,
    });

    if (existingRegistration && existingRegistration.status !== 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `You are already ${existingRegistration.status} for this event. Ticket Code: ${existingRegistration.ticketCode}`,
        registration: existingRegistration,
      });
    }

    // Check for schedule conflict with other registered events
    if (!bypassConflict) {
      const activeRegistrations = await Registration.find({
        user: student._id,
        status: 'registered',
      }).populate('event');

      const existingEvents = activeRegistrations.map((r) => r.event).filter(Boolean);
      const conflictCheck = findScheduleConflict(event, existingEvents);

      if (conflictCheck.hasConflict) {
        return res.status(409).json({
          success: false,
          hasConflict: true,
          conflictingEvent: conflictCheck.conflictingEvent,
          message: `Schedule conflict detected! This event overlaps with your registration for "${conflictCheck.conflictingEvent.title}". Do you wish to proceed anyway?`,
        });
      }
    }

    // Check capacity: if full, place on waitlist
    const isFull = event.registeredCount >= event.maxCapacity;
    const registrationStatus = isFull ? 'waitlisted' : 'registered';

    const ticketCode = generateTicketCode();
    const qrPayload = {
      ticketCode,
      eventId: event._id,
      userId: student._id,
      studentName: student.name,
      studentEmail: student.email,
      eventTitle: event.title,
      eventDate: event.eventDate,
      issuedAt: new Date().toISOString(),
    };

    const qrCodeData = await generateQRCodeDataUrl(qrPayload);

    let registration;
    if (existingRegistration && existingRegistration.status === 'cancelled') {
      // Re-activate registration
      existingRegistration.status = registrationStatus;
      existingRegistration.ticketCode = ticketCode;
      existingRegistration.qrCodeData = qrCodeData;
      existingRegistration.registeredAt = new Date();
      registration = await existingRegistration.save();
    } else {
      registration = await Registration.create({
        event: event._id,
        user: student._id,
        ticketCode,
        registrationType: 'individual',
        status: registrationStatus,
        qrCodeData,
        registeredAt: new Date(),
      });
    }

    // Update event counter
    if (registrationStatus === 'registered') {
      event.registeredCount += 1;
    } else {
      event.waitlistCount = (event.waitlistCount || 0) + 1;
    }
    await event.save();

    // Create confirmation notification
    await Notification.create({
      recipient: student._id,
      title: registrationStatus === 'registered' ? 'Registration Confirmed!' : 'Added to Waitlist',
      message:
        registrationStatus === 'registered'
          ? `You have successfully secured a seat for ${event.title}. Your Ticket Code is ${ticketCode}.`
          : `You are on the waitlist for ${event.title}. You will be notified automatically if a seat becomes available.`,
      type: 'registration',
      link: '/my-events',
    });

    res.status(201).json({
      success: true,
      message:
        registrationStatus === 'registered'
          ? 'Event registration successful!'
          : 'Event is at maximum capacity. You have been placed on the priority waitlist.',
      registration,
    });
  } catch (error) {
    console.error('Error in registerForEvent:', error);
    res.status(500).json({ success: false, message: 'Failed to process event registration.' });
  }
};

/**
 * Register as a Team for Hackathons or Group Competitions
 */
export const registerTeam = async (req, res) => {
  try {
    const student = req.user;
    const { eventId } = req.params;
    const { teamName } = req.body;

    if (!teamName || teamName.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide a team name.' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (!event.isTeamEvent) {
      return res.status(400).json({ success: false, message: 'This event does not accept team registrations.' });
    }

    // Check existing registration
    const existingRegistration = await Registration.findOne({
      event: event._id,
      user: student._id,
      status: { $ne: 'cancelled' },
    });
    if (existingRegistration) {
      return res.status(400).json({ success: false, message: 'You are already registered for this event.' });
    }

    // Generate join code for team members e.g. "TEAM-8942"
    const joinCode = `TEAM-${Math.floor(1000 + Math.random() * 9000)}`;

    const team = await Team.create({
      teamName: teamName.trim(),
      event: event._id,
      leader: student._id,
      members: [student._id],
      joinCode,
    });

    const isFull = event.registeredCount >= event.maxCapacity;
    const status = isFull ? 'waitlisted' : 'registered';
    const ticketCode = generateTicketCode();

    const qrPayload = {
      ticketCode,
      eventId: event._id,
      userId: student._id,
      studentName: student.name,
      teamName: team.teamName,
      joinCode: team.joinCode,
    };
    const qrCodeData = await generateQRCodeDataUrl(qrPayload);

    const registration = await Registration.create({
      event: event._id,
      user: student._id,
      ticketCode,
      registrationType: 'team',
      team: team._id,
      teamName: team.teamName,
      status,
      qrCodeData,
    });

    if (status === 'registered') {
      event.registeredCount += 1;
    } else {
      event.waitlistCount = (event.waitlistCount || 0) + 1;
    }
    await event.save();

    res.status(201).json({
      success: true,
      message: `Team "${team.teamName}" created! Share invite code "${joinCode}" with teammates.`,
      team,
      registration,
    });
  } catch (error) {
    console.error('Error in registerTeam:', error);
    res.status(500).json({ success: false, message: 'Failed to create team registration.' });
  }
};

/**
 * Join Existing Team
 */
export const joinTeam = async (req, res) => {
  try {
    const student = req.user;
    const { eventId } = req.params;
    const { joinCode } = req.body;

    if (!joinCode) {
      return res.status(400).json({ success: false, message: 'Team join code is required.' });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    const team = await Team.findOne({ event: event._id, joinCode: joinCode.trim().toUpperCase() });
    if (!team) {
      return res.status(404).json({ success: false, message: 'Invalid team join code.' });
    }

    if (team.members.length >= (event.teamMaxSize || 4)) {
      return res.status(400).json({ success: false, message: 'This team has already reached maximum capacity.' });
    }

    if (team.members.some((m) => String(m) === String(student._id))) {
      return res.status(400).json({ success: false, message: 'You are already a member of this team.' });
    }

    team.members.push(student._id);
    if (team.members.length >= (event.teamMaxSize || 4)) {
      team.status = 'complete';
    }
    await team.save();

    const ticketCode = generateTicketCode();
    const qrPayload = {
      ticketCode,
      eventId: event._id,
      userId: student._id,
      studentName: student.name,
      teamName: team.teamName,
    };
    const qrCodeData = await generateQRCodeDataUrl(qrPayload);

    const registration = await Registration.create({
      event: event._id,
      user: student._id,
      ticketCode,
      registrationType: 'team',
      team: team._id,
      teamName: team.teamName,
      status: 'registered',
      qrCodeData,
    });

    event.registeredCount += 1;
    await event.save();

    res.status(200).json({
      success: true,
      message: `Successfully joined team ${team.teamName}!`,
      team,
      registration,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to join team.' });
  }
};

/**
 * Cancel Registration
 */
export const cancelRegistration = async (req, res) => {
  try {
    const student = req.user;
    const { registrationId } = req.params;

    const registration = await Registration.findOne({
      _id: registrationId,
      user: student._id,
    });

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration record not found.' });
    }

    if (registration.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Registration is already cancelled.' });
    }

    const previousStatus = registration.status;
    registration.status = 'cancelled';
    await registration.save();

    const event = await Event.findById(registration.event);
    if (event) {
      if (previousStatus === 'registered') {
        event.registeredCount = Math.max(0, event.registeredCount - 1);

        // Check if there is someone on the waitlist to promote!
        const nextInWaitlist = await Registration.findOne({
          event: event._id,
          status: 'waitlisted',
        }).sort({ createdAt: 1 });

        if (nextInWaitlist) {
          nextInWaitlist.status = 'registered';
          await nextInWaitlist.save();

          event.registeredCount += 1;
          event.waitlistCount = Math.max(0, (event.waitlistCount || 0) - 1);

          // Notify promoted student
          await Notification.create({
            recipient: nextInWaitlist.user,
            title: `Great news! Seat Confirmed for ${event.title}`,
            message: `A seat opened up and you have been promoted from the waitlist to confirmed registered! Ticket Code: ${nextInWaitlist.ticketCode}`,
            type: 'registration',
            link: '/my-events',
          });
        }
      } else if (previousStatus === 'waitlisted') {
        event.waitlistCount = Math.max(0, (event.waitlistCount || 0) - 1);
      }
      await event.save();
    }

    res.status(200).json({
      success: true,
      message: 'Registration cancelled successfully.',
      registration,
    });
  } catch (error) {
    console.error('Error in cancelRegistration:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel registration.' });
  }
};

/**
 * Get Authenticated Student's Registrations
 */
export const getMyRegistrations = async (req, res) => {
  try {
    const student = req.user;
    const { status } = req.query;

    const filter = { user: student._id };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const registrations = await Registration.find(filter)
      .populate({
        path: 'event',
        populate: { path: 'organizer', select: 'name organizationName email' },
      })
      .populate('team')
      .populate('certificate')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: registrations.length,
      registrations,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch registrations.' });
  }
};

/**
 * Get Event Participants Roster (Organizer / Admin)
 */
export const getEventParticipants = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { search, status } = req.query;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    // Auth check: Organizer of this event or Admin
    if (req.user.role !== 'admin' && String(event.organizer) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const filter = { event: event._id };
    if (status && status !== 'all') {
      filter.status = status;
    }

    let registrations = await Registration.find(filter)
      .populate('user', 'name email studentId department phone avatar')
      .populate('team', 'teamName joinCode')
      .sort({ createdAt: -1 });

    if (search) {
      const s = search.toLowerCase();
      registrations = registrations.filter(
        (r) =>
          r.user?.name?.toLowerCase().includes(s) ||
          r.user?.email?.toLowerCase().includes(s) ||
          r.user?.studentId?.toLowerCase().includes(s) ||
          r.ticketCode?.toLowerCase().includes(s)
      );
    }

    res.status(200).json({
      success: true,
      count: registrations.length,
      registrations,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch participant roster.' });
  }
};

/**
 * Export Participants to CSV
 */
export const exportParticipantsCSV = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    if (req.user.role !== 'admin' && String(event.organizer) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const registrations = await Registration.find({ event: event._id })
      .populate('user', 'name email studentId department phone')
      .populate('team', 'teamName');

    const fields = [
      { label: 'Ticket Code', value: 'ticketCode' },
      { label: 'Student Name', value: 'user.name' },
      { label: 'Student Email', value: 'user.email' },
      { label: 'Student ID', value: 'user.studentId' },
      { label: 'Department', value: 'user.department' },
      { label: 'Phone', value: 'user.phone' },
      { label: 'Status', value: 'status' },
      { label: 'Type', value: 'registrationType' },
      { label: 'Team Name', value: 'teamName' },
      { label: 'Registered Date', value: (row) => new Date(row.registeredAt).toLocaleString() },
      { label: 'Attended Date', value: (row) => (row.attendedAt ? new Date(row.attendedAt).toLocaleString() : 'N/A') },
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(registrations);

    res.header('Content-Type', 'text/csv');
    res.attachment(`${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_Participants.csv`);
    return res.send(csv);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ success: false, message: 'Failed to export CSV.' });
  }
};
