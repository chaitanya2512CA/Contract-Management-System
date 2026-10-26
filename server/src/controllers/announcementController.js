import crypto from 'crypto';
import { query } from '../config/db.js';
import { validateText } from '../utils/validation.js';

export const createAnnouncement = async (req, res) => {
  try {
    const author = req.user;
    const { title, content, message, priority, eventId } = req.body;
    const bodyText = content || message;

    const titleCheck = validateText(title, 'Announcement title', 3, 200, true);
    if (!titleCheck.isValid) {
      return res.status(400).json({ success: false, message: titleCheck.message });
    }

    const msgCheck = validateText(bodyText, 'Announcement message', 3, 2000, true);
    if (!msgCheck.isValid) {
      return res.status(400).json({ success: false, message: msgCheck.message });
    }

    const validPriorities = ['normal', 'important', 'urgent'];
    const chosenPriority = priority && validPriorities.includes(priority) ? priority : 'normal';

    let eventTitle = '';
    if (eventId) {
      const eventRes = await query('SELECT * FROM events WHERE id = $1', [eventId]);
      if (eventRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Event not found.' });
      const event = eventRes.rows[0];

      const authorId = author.id || author._id;
      if (author.role !== 'admin' && String(event.creator_id) !== String(authorId)) {
        return res.status(403).json({ success: false, message: 'Unauthorized for this event.' });
      }
      eventTitle = event.title;
    }

    const newId = crypto.randomUUID();
    const insertRes = await query(
      `INSERT INTO announcements (id, event_id, author_id, title, message, priority, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [
        newId,
        eventId || null,
        author.id || author._id,
        titleCheck.value,
        msgCheck.value,
        chosenPriority,
      ]
    );
    const row = insertRes.rows[0];

    const announcement = {
      _id: row.id,
      id: row.id,
      title: row.title,
      content: row.message,
      message: row.message,
      priority: row.priority,
      eventId: row.event_id,
      event: row.event_id,
      eventTitle,
      author: {
        _id: author.id || author._id,
        id: author.id || author._id,
        name: author.name,
        role: author.role,
        avatar: author.avatar || '',
      },
      authorName: author.name,
      authorRole: author.role,
      createdAt: row.created_at,
    };

    // If tied to an event, notify all registered participants
    if (eventId) {
      const regRes = await query(
        "SELECT user_id FROM event_registrations WHERE event_id = $1 AND status IN ('confirmed', 'waitlisted')",
        [eventId]
      );
      for (const reg of regRes.rows) {
        await query(
          `INSERT INTO notifications (id, recipient_id, title, message, type, link, is_read, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, false, NOW())`,
          [
            crypto.randomUUID(),
            reg.user_id,
            `Announcement: ${eventTitle}`,
            title,
            'announcement',
            `/events/${eventId}`,
          ]
        ).catch(() => {});
      }
    }

    res.status(201).json({
      success: true,
      message: 'Announcement broadcasted successfully.',
      announcement,
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ success: false, message: 'Failed to create announcement.' });
  }
};

export const getAnnouncements = async (req, res) => {
  try {
    const { eventId, priority } = req.query;
    const conditions = [];
    const params = [];

    if (eventId) {
      params.push(eventId);
      conditions.push(`a.event_id = $${params.length}`);
    }

    if (priority) {
      params.push(priority);
      conditions.push(`a.priority = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT a.*, 
             u.id as user_id, u.name as user_name, u.role as user_role, u.avatar as user_avatar,
             e.title as event_title
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN events e ON a.event_id = e.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT 20
    `;

    const result = await query(sql, params);
    const announcements = result.rows.map((row) => ({
      _id: row.id,
      id: row.id,
      title: row.title,
      content: row.message,
      message: row.message,
      priority: row.priority,
      eventId: row.event_id,
      event: row.event_id,
      eventTitle: row.event_title || '',
      author: {
        _id: row.user_id,
        id: row.user_id,
        name: row.user_name,
        role: row.user_role,
        avatar: row.user_avatar || '',
      },
      authorName: row.user_name,
      authorRole: row.user_role,
      createdAt: row.created_at,
    }));

    res.status(200).json({
      success: true,
      count: announcements.length,
      announcements,
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch announcements.' });
  }
};

