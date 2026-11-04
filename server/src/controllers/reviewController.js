import crypto from 'crypto';
import { query } from '../config/db.js';

/**
 * Submit Client Review for Completed Consultation
 */
export const submitReview = async (req, res) => {
  try {
    const clientId = req.user.id || req.user._id;
    const { bookingId, rating, reviewText, tags = [] } = req.body;

    if (!bookingId || !rating) {
      return res.status(400).json({ success: false, message: 'Booking ID and numeric rating (1-5) are required.' });
    }

    const numericRating = Math.min(5, Math.max(1, parseInt(rating, 10)));

    // Verify booking belongs to client and is completed
    const bRes = await query('SELECT * FROM consultation_bookings WHERE id = $1', [bookingId]);
    if (bRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Consultation booking not found.' });
    }

    const booking = bRes.rows[0];
    if (booking.client_id !== clientId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized: Only the client can review this consultation.' });
    }

    // Check if review already exists
    const existing = await query('SELECT id FROM client_reviews WHERE booking_id = $1', [bookingId]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'You have already submitted a review for this consultation.' });
    }

    const reviewId = crypto.randomUUID();
    await query(
      `INSERT INTO client_reviews (id, booking_id, client_id, lawyer_id, rating, review_text, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        reviewId,
        bookingId,
        clientId,
        booking.lawyer_id,
        numericRating,
        reviewText || '',
        JSON.stringify(tags),
      ]
    );

    // Recalculate lawyer rating average and review count
    const aggRes = await query(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM client_reviews WHERE lawyer_id = $1`,
      [booking.lawyer_id]
    );

    const newAvg = parseFloat(aggRes.rows[0].avg_rating).toFixed(2);
    const newCount = parseInt(aggRes.rows[0].count, 10);

    await query(
      `UPDATE lawyer_profiles SET
        rating_avg = $1,
        rating_count = $2,
        updated_at = NOW()
      WHERE id = $3`,
      [newAvg, newCount, booking.lawyer_id]
    );

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully. Thank you for your feedback!',
      rating: numericRating,
    });
  } catch (error) {
    console.error('Error in submitReview:', error);
    res.status(500).json({ success: false, message: 'Failed to submit review.' });
  }
};

/**
 * Get Public Reviews for an Advocate
 */
export const getLawyerReviews = async (req, res) => {
  try {
    const { lawyerId } = req.params;

    const reviewsRes = await query(
      `SELECT
        cr.*,
        u.name as client_name,
        u.avatar as client_avatar
      FROM client_reviews cr
      JOIN users u ON cr.client_id = u.id
      WHERE cr.lawyer_id = $1
      ORDER BY cr.created_at DESC`,
      [lawyerId]
    );

    res.status(200).json({
      success: true,
      reviews: reviewsRes.rows,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve reviews.' });
  }
};
