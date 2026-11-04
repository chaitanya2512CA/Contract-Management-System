import crypto from 'crypto';
import { query } from '../config/db.js';

/**
 * Lawyer: Get Earnings & Financial Ledger
 */
export const getLawyerEarnings = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const lpRes = await query('SELECT * FROM lawyer_profiles WHERE user_id = $1', [userId]);
    if (lpRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Advocate profile not found.' });
    }

    const lawyer = lpRes.rows[0];

    // Ledger items
    const ledgerRes = await query(
      `SELECT * FROM lawyer_earnings WHERE lawyer_id = $1 ORDER BY created_at DESC`,
      [lawyer.id]
    );

    // Sum totals
    const totalsRes = await query(
      `SELECT
        COALESCE(SUM(gross_amount), 0) as total_gross,
        COALESCE(SUM(platform_commission), 0) as total_commission,
        COALESCE(SUM(CASE WHEN status = 'available' THEN net_earnings ELSE 0 END), 0) as available_balance,
        COALESCE(SUM(CASE WHEN status = 'withdrawn' THEN net_earnings ELSE 0 END), 0) as total_withdrawn,
        COALESCE(SUM(net_earnings), 0) as total_net
      FROM lawyer_earnings
      WHERE lawyer_id = $1`,
      [lawyer.id]
    );

    // Payout requests
    const payoutsRes = await query(
      `SELECT * FROM payouts WHERE lawyer_id = $1 ORDER BY created_at DESC`,
      [lawyer.id]
    );

    res.status(200).json({
      success: true,
      summary: totalsRes.rows[0],
      bankDetails: {
        accountNumber: lawyer.bank_account_number,
        ifsc: lawyer.bank_ifsc,
        holderName: lawyer.bank_holder_name,
      },
      ledger: ledgerRes.rows,
      payouts: payoutsRes.rows,
    });
  } catch (error) {
    console.error('Error in getLawyerEarnings:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve earnings ledger.' });
  }
};

/**
 * Lawyer: Request Payout of Available Balance
 */
export const requestPayout = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { amount } = req.body;

    const lpRes = await query('SELECT * FROM lawyer_profiles WHERE user_id = $1', [userId]);
    if (lpRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Advocate profile not found.' });
    const lawyer = lpRes.rows[0];

    if (!lawyer.bank_account_number || !lawyer.bank_ifsc) {
      return res.status(400).json({
        success: false,
        message: 'Please configure your bank account number and IFSC code before requesting a payout.',
      });
    }

    // Check available balance
    const balRes = await query(
      `SELECT COALESCE(SUM(net_earnings), 0) as available
       FROM lawyer_earnings WHERE lawyer_id = $1 AND status = 'available'`,
      [lawyer.id]
    );

    const available = parseFloat(balRes.rows[0].available);
    const requested = parseFloat(amount);

    if (isNaN(requested) || requested <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payout amount.' });
    }

    if (requested > available) {
      return res.status(400).json({
        success: false,
        message: `Requested payout (₹${requested.toFixed(2)}) exceeds available earnings balance (₹${available.toFixed(2)}).`,
      });
    }

    const payoutId = crypto.randomUUID();
    const payoutRef = `PAY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    await query(
      `INSERT INTO payouts (id, payout_ref, lawyer_id, requested_amount, status)
       VALUES ($1, $2, $3, $4, 'requested')`,
      [payoutId, payoutRef, lawyer.id, requested]
    );

    // Update earnings ledger status to pending
    await query(
      `UPDATE lawyer_earnings SET status = 'withdrawn'
       WHERE lawyer_id = $1 AND status = 'available'`,
      [lawyer.id]
    );

    res.status(201).json({
      success: true,
      message: 'Payout request registered. Settlement typically completes within 1-2 banking business days.',
      payoutRef,
    });
  } catch (error) {
    console.error('Error in requestPayout:', error);
    res.status(500).json({ success: false, message: 'Failed to submit payout request.' });
  }
};

/**
 * Admin: Get All Payout Requests
 */
export const getAdminPayouts = async (req, res) => {
  try {
    const payoutsRes = await query(
      `SELECT
        p.*,
        lp.full_name as lawyer_name,
        lp.bank_account_number,
        lp.bank_ifsc,
        lp.bank_holder_name,
        u.email as lawyer_email,
        u.phone as lawyer_phone
      FROM payouts p
      JOIN lawyer_profiles lp ON p.lawyer_id = lp.id
      JOIN users u ON lp.user_id = u.id
      ORDER BY
        CASE WHEN p.status = 'requested' THEN 1 ELSE 2 END,
        p.created_at DESC`
    );

    res.status(200).json({
      success: true,
      payouts: payoutsRes.rows,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve payouts.' });
  }
};

/**
 * Admin: Process Payout
 */
export const processPayout = async (req, res) => {
  try {
    const { id } = req.params;
    const { status = 'completed', bankReference = '', rejectionReason = '' } = req.body;
    const adminId = req.user.id || req.user._id;

    const pRes = await query('SELECT * FROM payouts WHERE id = $1', [id]);
    if (pRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Payout not found.' });

    await query(
      `UPDATE payouts SET
        status = $1,
        bank_reference = $2,
        rejection_reason = $3,
        processed_by = $4,
        processed_at = NOW(),
        updated_at = NOW()
      WHERE id = $5`,
      [status, bankReference, rejectionReason, adminId, id]
    );

    // Audit log
    await query(
      `INSERT INTO audit_logs (id, user_id, admin_email, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, 'PAYOUT', $5, $6)`,
      [
        crypto.randomUUID(),
        adminId,
        req.user.email,
        `PAYOUT_${status.toUpperCase()}`,
        id,
        `Payout status set to ${status}. Ref: ${bankReference || 'None'}`,
      ]
    );

    res.status(200).json({
      success: true,
      message: `Payout marked as ${status}.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to process payout.' });
  }
};
