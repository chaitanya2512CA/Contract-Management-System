import { Event } from '../models/Event.js';
import { Registration } from '../models/Registration.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { getAIRecommendedEvents } from '../utils/aiRecommender.js';

/**
 * Get Public / Approved Events with Filtering & Search
 */
export const getEvents = async (req, res) => {
  try {
    const {
      search,
      category,
      venueType,
      isPaid,
      startDate,
      endDate,
      status = 'approved',
      page = 1,
      limit = 12,
      sortBy = 'eventDate',
      sortOrder = 'asc',
    } = req.query;

    const query = {};

    // Filter by status (public view only sees approved unless organizer/admin query)
    if (status && status !== 'all') {
      query.status = status;
    }

    // Search query on title, description, or tags
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
        { venue: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by Category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Filter by Venue Type
    if (venueType && venueType !== 'all') {
      query.venueType = venueType;
    }

    // Filter by Paid / Free
    if (isPaid !== undefined && isPaid !== 'all') {
      query.isPaid = isPaid === 'true';
    }

    // Date range filter
    if (startDate || endDate) {
      query.eventDate = {};
      if (startDate) query.eventDate.$gte = new Date(startDate);
      if (endDate) query.eventDate.$lte = new Date(endDate);
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [events, total] = await Promise.all([
      Event.find(query)
        .populate('organizer', 'name email organizationName avatar')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Event.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: events.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      events,
    });
  } catch (error) {
    console.error('Error in getEvents:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve events.' });
  }
};

/**
 * Get Single Event by ID
 */
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email organizationName avatar department phone')
      .populate('approvedBy', 'name email');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    // Increment views asynchronously
    event.views = (event.views || 0) + 1;
    await event.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch event details.' });
  }
};

/**
 * Get Trending Events
 */
export const getTrendingEvents = async (req, res) => {
  try {
    const events = await Event.find({ status: 'approved' })
      .populate('organizer', 'name organizationName')
      .sort({ registeredCount: -1, views: -1 })
      .limit(6);

    res.status(200).json({
      success: true,
      events,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch trending events.' });
  }
};

/**
 * Get AI Recommended Events for Authenticated Student
 */
export const getRecommendedEvents = async (req, res) => {
  try {
    const user = req.user;
    const now = new Date();

    // Fetch upcoming approved events
    const upcomingEvents = await Event.find({
      status: 'approved',
      eventDate: { $gte: now },
    }).populate('organizer', 'name organizationName');

    const recommended = getAIRecommendedEvents(user, upcomingEvents);

    res.status(200).json({
      success: true,
      recommendations: recommended.slice(0, 8),
    });
  } catch (error) {
    console.error('Error in getRecommendedEvents:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate recommendations.' });
  }
};

/**
 * Get Calendar Events for schedule view
 */
export const getCalendarEvents = async (req, res) => {
  try {
    const { month, year } = req.query;
    const query = { status: 'approved' };

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      query.eventDate = { $gte: start, $lte: end };
    }

    const events = await Event.find(query)
      .select('title category eventDate startTime endTime venue venueType bannerImage registeredCount maxCapacity')
      .sort({ eventDate: 1 });

    res.status(200).json({
      success: true,
      events,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch calendar events.' });
  }
};

/**
 * Create Event (Organizer or Admin)
 */
export const createEvent = async (req, res) => {
  try {
    const user = req.user;
    const {
      title,
      description,
      category,
      bannerImage,
      eventDate,
      startTime,
      endTime,
      venue,
      venueType,
      meetingUrl,
      maxCapacity,
      registrationDeadline,
      isPaid,
      ticketPrice,
      eligibility,
      prerequisites,
      isTeamEvent,
      teamMinSize,
      teamMaxSize,
      tags,
    } = req.body;

    if (!title || !description || !category || !eventDate || !startTime || !endTime || !venue || !maxCapacity || !registrationDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required event parameters.',
      });
    }

    // Auto-approve if created by admin, otherwise require moderation approval
    const isAdmin = user.role === 'admin';
    const status = isAdmin ? 'approved' : 'pending_approval';

    const newEvent = await Event.create({
      title,
      description,
      category,
      bannerImage: bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1200',
      eventDate: new Date(eventDate),
      startTime,
      endTime,
      venue,
      venueType: venueType || 'offline',
      meetingUrl: meetingUrl || '',
      organizer: user._id,
      organizerName: user.name,
      organizerContact: user.email,
      maxCapacity: Number(maxCapacity),
      registrationDeadline: new Date(registrationDeadline),
      isPaid: Boolean(isPaid),
      ticketPrice: isPaid ? Number(ticketPrice) : 0,
      eligibility: eligibility || 'Open to all college students',
      prerequisites: prerequisites || 'None',
      isTeamEvent: Boolean(isTeamEvent),
      teamMinSize: isTeamEvent ? Number(teamMinSize || 1) : 1,
      teamMaxSize: isTeamEvent ? Number(teamMaxSize || 4) : 4,
      status,
      approvedBy: isAdmin ? user._id : null,
      approvedAt: isAdmin ? new Date() : null,
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t) => t.trim()) : []),
    });

    if (isAdmin) {
      await AuditLog.create({
        admin: user._id,
        adminName: user.name,
        adminEmail: user.email,
        action: 'CREATE_EVENT',
        targetType: 'Event',
        targetId: newEvent._id.toString(),
        targetName: newEvent.title,
        details: 'Administrator created and auto-approved college event.',
      });
    }

    res.status(201).json({
      success: true,
      message: isAdmin
        ? 'Event created and published successfully!'
        : 'Event created and submitted for administrator approval.',
      event: newEvent,
    });
  } catch (error) {
    console.error('Error in createEvent:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create event.' });
  }
};

/**
 * Update Event (Organizer or Admin)
 */
export const updateEvent = async (req, res) => {
  try {
    const user = req.user;
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    // Ensure user is the organizer or an admin
    if (user.role !== 'admin' && String(event.organizer) !== String(user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this event.',
      });
    }

    const updatableFields = [
      'title',
      'description',
      'category',
      'bannerImage',
      'eventDate',
      'startTime',
      'endTime',
      'venue',
      'venueType',
      'meetingUrl',
      'maxCapacity',
      'registrationDeadline',
      'isPaid',
      'ticketPrice',
      'eligibility',
      'prerequisites',
      'isTeamEvent',
      'teamMinSize',
      'teamMaxSize',
      'tags',
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'eventDate' || field === 'registrationDeadline') {
          event[field] = new Date(req.body[field]);
        } else if (field === 'tags' && typeof req.body[field] === 'string') {
          event.tags = req.body[field].split(',').map((t) => t.trim());
        } else {
          event[field] = req.body[field];
        }
      }
    });

    await event.save();

    // Notify registered participants of update
    const registrations = await Registration.find({ event: event._id, status: 'registered' });
    if (registrations.length > 0) {
      const notifications = registrations.map((reg) => ({
        recipient: reg.user,
        title: `Event Updated: ${event.title}`,
        message: `The schedule or details for ${event.title} have been updated by the organizers.`,
        type: 'event_update',
        link: `/events/${event._id}`,
      }));
      await Notification.insertMany(notifications).catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: 'Event updated successfully.',
      event,
    });
  } catch (error) {
    console.error('Error in updateEvent:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update event.' });
  }
};

/**
 * Cancel Event
 */
export const cancelEvent = async (req, res) => {
  try {
    const user = req.user;
    const { reason } = req.body;
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (user.role !== 'admin' && String(event.organizer) !== String(user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this event.',
      });
    }

    event.status = 'cancelled';
    event.rejectionReason = reason || 'Cancelled by organizer';
    await event.save();

    // Notify all registered participants
    const registrations = await Registration.find({ event: event._id });
    if (registrations.length > 0) {
      const notifications = registrations.map((reg) => ({
        recipient: reg.user,
        title: `Important: ${event.title} has been cancelled`,
        message: `Reason: ${reason || 'Event cancelled by the organizing team.'}`,
        type: 'cancellation',
        link: `/events/${event._id}`,
      }));
      await Notification.insertMany(notifications).catch(() => {});
    }

    if (user.role === 'admin') {
      await AuditLog.create({
        admin: user._id,
        adminName: user.name,
        adminEmail: user.email,
        action: 'CANCEL_EVENT',
        targetType: 'Event',
        targetId: event._id.toString(),
        targetName: event.title,
        details: `Administrator cancelled event. Reason: ${reason || 'None provided'}`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Event has been cancelled and attendees notified.',
      event,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cancel event.' });
  }
};

/**
 * Get Events Created By Logged In Organizer
 */
export const getMyOrganizedEvents = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch organizer events.' });
  }
};
