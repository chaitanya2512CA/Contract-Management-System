import { query, mapNotification } from '../config/db.js';

export const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const [notifRes, unreadRes] = await Promise.all([
      query(
        'SELECT * FROM notifications WHERE recipient_id = $1 ORDER BY created_at DESC LIMIT 30',
        [userId]
      ),
      query(
        'SELECT COUNT(*) FROM notifications WHERE recipient_id = $1 AND is_read = false',
        [userId]
      ),
    ]);

    const notifications = notifRes.rows.map(mapNotification);
    const unreadCount = parseInt(unreadRes.rows[0].count, 10) || 0;

    res.status(200).json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { id } = req.params;

    const result = await query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND recipient_id = $2 RETURNING *',
      [id, userId]
    );

    const notification = result.rows.length > 0 ? mapNotification(result.rows[0]) : null;

    res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    await query(
      'UPDATE notifications SET is_read = true WHERE recipient_id = $1 AND is_read = false',
      [userId]
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notifications as read.' });
  }
};

