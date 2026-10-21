import { Announcement } from '../models/Announcement.js';
import { Event } from '../models/Event.js';
import { Registration } from '../models/Registration.js';
import { Notification } from '../models/Notification.js';

export const createAnnouncement = async (req, res) => {
  try {
    const author = req.user;
    const { title, content, priority, targetAudience, eventId, isPinned } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required.' });
    }

    let eventTitle = '';
    if (eventId) {
      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
      if (author.role !== 'admin' && String(event.organizer) !== String(author._id)) {
        return res.status(403).json({ success: false, message: 'Unauthorized for this event.' });
      }
      eventTitle = event.title;
    }

    const announcement = await Announcement.create({
      title,
      content,
      author: author._id,
      authorName: author.name,
      authorRole: author.role,
      event: eventId || null,
      eventTitle,
      priority: priority || 'normal',
      targetAudience: targetAudience || 'all',
      isPinned: Boolean(isPinned),
    });

    // If tied to an event, notify all registered participants
    if (eventId) {
      const registrations = await Registration.find({ event: eventId, status: { $in: ['registered', 'waitlisted'] } });
      const notifications = registrations.map((r) => ({
        recipient: r.user,
        title: `Announcement: ${eventTitle}`,
        message: title,
        type: 'announcement',
        link: `/events/${eventId}`,
      }));
      if (notifications.length > 0) {
        await Notification.insertMany(notifications).catch(() => {});
      }
    }

    res.status(201).json({
      success: true,
      message: 'Announcement broadcasted successfully.',
      announcement,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create announcement.' });
  }
};

export const getAnnouncements = async (req, res) => {
  try {
    const { eventId, priority } = req.query;
    const query = {};

    if (eventId) {
      query.event = eventId;
    } else {
      // Return college-wide or all
      query.$or = [{ event: null }, { event: { $exists: true } }];
    }

    if (priority) {
      query.priority = priority;
    }

    const announcements = await Announcement.find(query)
      .populate('author', 'name role avatar')
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      count: announcements.length,
      announcements,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch announcements.' });
  }
};
