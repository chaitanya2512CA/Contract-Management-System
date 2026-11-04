import crypto from 'crypto';
import { query } from '../config/db.js';

/**
 * Submit Bar Council Verification Application
 */
export const submitVerification = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const {
      barRegistrationNumber,
      barCouncilState,
      enrollmentYear,
      idProofUrl,
      barCertificateUrl,
    } = req.body;

    if (!barRegistrationNumber || !barCouncilState || !enrollmentYear) {
      return res.status(400).json({
        success: false,
        message: 'Bar registration number, council state, and enrollment year are required.',
      });
    }

    const lawyerRes = await query('SELECT id FROM lawyer_profiles WHERE user_id = $1', [userId]);
    if (lawyerRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Lawyer profile not found.' });
    }
    const lawyerId = lawyerRes.rows[0].id;

    const verificationId = crypto.randomUUID();
    await query(
      `INSERT INTO lawyer_verifications (
        id, lawyer_id, user_id, bar_registration_number, bar_council_state,
        enrollment_year, id_proof_url, bar_certificate_url, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')`,
      [
        verificationId,
        lawyerId,
        userId,
        barRegistrationNumber.trim(),
        barCouncilState.trim(),
        parseInt(enrollmentYear, 10),
        idProofUrl || '',
        barCertificateUrl || '',
      ]
    );

    // Update lawyer profile status
    await query(
      `UPDATE lawyer_profiles SET
        bar_council_number = $1,
        bar_state = $2,
        verification_status = 'pending'
      WHERE id = $3`,
      [barRegistrationNumber.trim(), barCouncilState.trim(), lawyerId]
    );

    res.status(201).json({
      success: true,
      message: 'Bar Council verification application submitted successfully. Institutional review takes 24-48 hours.',
    });
  } catch (error) {
    console.error('Error in submitVerification:', error);
    res.status(500).json({ success: false, message: 'Failed to submit verification application.' });
  }
};

/**
 * Get Verification Status for current lawyer
 */
export const getVerificationStatus = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const verRes = await query(
      `SELECT lv.*, lp.is_verified, lp.verification_status as profile_status
       FROM lawyer_verifications lv
       JOIN lawyer_profiles lp ON lv.lawyer_id = lp.id
       WHERE lv.user_id = $1
       ORDER BY lv.created_at DESC LIMIT 1`,
      [userId]
    );

    res.status(200).json({
      success: true,
      verification: verRes.rows[0] || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve verification status.' });
  }
};

/**
 * Admin: Get Verification Queue
 */
export const getVerificationQueue = async (req, res) => {
  try {
    const queueRes = await query(
      `SELECT
        lv.*,
        lp.full_name,
        lp.primary_specialty,
        lp.experience_years,
        lp.city,
        lp.state,
        u.email,
        u.phone
      FROM lawyer_verifications lv
      JOIN lawyer_profiles lp ON lv.lawyer_id = lp.id
      JOIN users u ON lv.user_id = u.id
      ORDER BY
        CASE WHEN lv.status = 'pending' THEN 1 ELSE 2 END,
        lv.created_at DESC`
    );

    res.status(200).json({
      success: true,
      queue: queueRes.rows,
    });
  } catch (error) {
    console.error('Error in getVerificationQueue:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve verification queue.' });
  }
};

/**
 * Admin: Review Verification Application (Approve / Reject)
 */
export const reviewVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body; // status: 'approved' | 'rejected' | 'more_info_needed'
    const adminId = req.user.id || req.user._id;

    if (!['approved', 'rejected', 'more_info_needed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid verification decision.' });
    }

    const appRes = await query('SELECT * FROM lawyer_verifications WHERE id = $1', [id]);
    if (appRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Verification application not found.' });
    }

    const app = appRes.rows[0];

    await query(
      `UPDATE lawyer_verifications SET
        status = $1,
        admin_notes = $2,
        reviewed_by = $3,
        reviewed_at = NOW()
      WHERE id = $4`,
      [status, adminNotes || '', adminId, id]
    );

    // Update lawyer profile
    const isApproved = status === 'approved';
    await query(
      `UPDATE lawyer_profiles SET
        is_verified = $1,
        verification_status = $2,
        updated_at = NOW()
      WHERE id = $3`,
      [isApproved, isApproved ? 'verified' : (status === 'rejected' ? 'rejected' : 'pending'), app.lawyer_id]
    );

    // Audit log
    await query(
      `INSERT INTO audit_logs (id, user_id, admin_email, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, 'LAWYER_VERIFICATION', $5, $6)`,
      [
        crypto.randomUUID(),
        adminId,
        req.user.email,
        `VERIFICATION_${status.toUpperCase()}`,
        app.lawyer_id,
        `Admin decision: ${status}. Notes: ${adminNotes || 'None'}`,
      ]
    );

    // Notification to lawyer
    await query(
      `INSERT INTO notifications (id, recipient_id, title, message, type, link)
       VALUES ($1, $2, $3, $4, 'verification', '/lawyer/profile')`,
      [
        crypto.randomUUID(),
        app.user_id,
        isApproved ? 'Advocate Profile Verified!' : 'Verification Application Update',
        isApproved
          ? 'Congratulations! Your Bar Council enrollment has been verified. The verified advocate badge is now active on your profile.'
          : `Your verification application status is: ${status}. Notes: ${adminNotes || 'Please check requirements.'}`,
      ]
    );

    res.status(200).json({
      success: true,
      message: `Verification application marked as ${status}.`,
    });
  } catch (error) {
    console.error('Error in reviewVerification:', error);
    res.status(500).json({ success: false, message: 'Failed to process verification review.' });
  }
};
