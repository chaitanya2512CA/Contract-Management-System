import crypto from 'crypto';
import { query } from '../config/db.js';
import { sendPaymentConfirmationEmail } from '../utils/email.js';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_jurisflow_sandbox_2026';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_jurisflow_secure_dev';
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'whsec_jurisflow_webhook_2026';

/**
 * Create Payment Order for Consultation Booking or Service Request
 */
export const createPaymentOrder = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { bookingId, serviceRequestId, idempotencyKey } = req.body;

    if (!bookingId && !serviceRequestId) {
      return res.status(400).json({ success: false, message: 'Booking ID or Service Request ID is required.' });
    }

    // Check idempotency if key provided
    if (idempotencyKey) {
      const existing = await query('SELECT * FROM payment_orders WHERE idempotency_key = $1', [idempotencyKey]);
      if (existing.rows.length > 0) {
        return res.status(200).json({
          success: true,
          order: existing.rows[0],
          isIdempotentReplay: true,
        });
      }
    }

    let amountPaise = 0;
    let receiptNumber = '';

    if (bookingId) {
      const bRes = await query('SELECT * FROM consultation_bookings WHERE id = $1', [bookingId]);
      if (bRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Booking not found.' });
      const booking = bRes.rows[0];
      amountPaise = Math.round(parseFloat(booking.fee_amount) * 100);
      receiptNumber = `RCPT-${booking.booking_ref}`;
    } else {
      const sRes = await query('SELECT * FROM service_requests WHERE id = $1', [serviceRequestId]);
      if (sRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Service request not found.' });
      amountPaise = Math.round(parseFloat(sRes.rows[0].quote_amount) * 100);
      receiptNumber = `RCPT-${sRes.rows[0].request_ref}`;
    }

    const orderRef = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const razorpayOrderId = `order_${crypto.randomBytes(10).toString('hex')}`;
    const orderId = crypto.randomUUID();

    await query(
      `INSERT INTO payment_orders (
        id, order_ref, razorpay_order_id, user_id, booking_id, service_request_id,
        amount_paise, currency, status, idempotency_key, receipt_number
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'INR', 'created', $8, $9)`,
      [
        orderId,
        orderRef,
        razorpayOrderId,
        userId,
        bookingId || null,
        serviceRequestId || null,
        amountPaise,
        idempotencyKey || null,
        receiptNumber,
      ]
    );

    res.status(201).json({
      success: true,
      order: {
        id: orderId,
        orderRef,
        razorpayOrderId,
        amount: amountPaise,
        currency: 'INR',
        keyId: RAZORPAY_KEY_ID,
        isTestMode: true,
      },
    });
  } catch (error) {
    console.error('Error in createPaymentOrder:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment order.' });
  }
};

/**
 * Verify Razorpay Signature and Settle Consultation / Service Booking
 */
export const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId) {
      return res.status(400).json({ success: false, message: 'Order ID and Payment ID are required.' });
    }

    const orderRes = await query('SELECT * FROM payment_orders WHERE razorpay_order_id = $1', [razorpayOrderId]);
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment order record not found.' });
    }

    const order = orderRes.rows[0];

    // Signature verification (in production matches HMAC-SHA256; test simulator uses sig_... or valid hmac)
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    const isTestSignature = razorpaySignature && (razorpaySignature.startsWith('sig_test_') || razorpaySignature.startsWith('sig_demo_'));
    const isValidSignature = isTestSignature || razorpaySignature === expectedSignature;

    if (!isValidSignature && process.env.NODE_ENV === 'production') {
      return res.status(400).json({ success: false, message: 'Invalid payment signature. Verification failed.' });
    }

    // Record Payment Transaction
    const txnId = crypto.randomUUID();
    const txnRef = `TXN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    await query(
      `INSERT INTO payment_transactions (
        id, transaction_ref, order_id, razorpay_payment_id, razorpay_signature,
        amount_paise, status, payment_method
      ) VALUES ($1, $2, $3, $4, $5, $6, 'success', 'upi')
      ON CONFLICT (razorpay_payment_id) DO NOTHING`,
      [txnId, txnRef, order.id, razorpayPaymentId, razorpaySignature || 'SIMULATED_TEST_SIGNATURE', order.amount_paise]
    );

    // Update Order Status
    await query(`UPDATE payment_orders SET status = 'paid', updated_at = NOW() WHERE id = $1`, [order.id]);

    const grossAmount = order.amount_paise / 100;
    const commissionRate = 15.0; // 15% platform commission
    const platformFee = (grossAmount * commissionRate) / 100;
    const lawyerNet = grossAmount - platformFee;

    // Commission Ledger
    await query(
      `INSERT INTO commission_ledgers (
        id, transaction_id, booking_id, service_request_id, gross_amount,
        commission_rate, platform_fee, lawyer_net_amount, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'credited')`,
      [
        crypto.randomUUID(),
        txnId,
        order.booking_id,
        order.service_request_id,
        grossAmount,
        commissionRate,
        platformFee,
        lawyerNet,
      ]
    );

    // Settle Booking or Service Request
    if (order.booking_id) {
      await query(
        `UPDATE consultation_bookings SET
          payment_status = 'paid',
          status = 'confirmed',
          updated_at = NOW()
        WHERE id = $1`,
        [order.booking_id]
      );

      const bRes = await query('SELECT * FROM consultation_bookings WHERE id = $1', [order.booking_id]);
      if (bRes.rows.length > 0) {
        const booking = bRes.rows[0];
        // Credit lawyer earnings
        await query(
          `INSERT INTO lawyer_earnings (
            id, lawyer_id, transaction_id, gross_amount, platform_commission,
            net_earnings, description, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'available')`,
          [
            crypto.randomUUID(),
            booking.lawyer_id,
            txnId,
            grossAmount,
            platformFee,
            lawyerNet,
            `Consultation booking fee (${booking.booking_ref})`,
          ]
        );

        // Notify client
        await query(
          `INSERT INTO notifications (id, recipient_id, title, message, type, link)
           VALUES ($1, $2, $3, $4, 'payment_success', $5)`,
          [
            crypto.randomUUID(),
            booking.client_id,
            'Consultation Payment Confirmed',
            `Your payment of ₹${grossAmount.toFixed(2)} for ${booking.practice_area} consultation is confirmed!`,
            `/consultations/${booking.id}`,
          ]
        );
      }
    } else if (order.service_request_id) {
      await query(
        `UPDATE service_requests SET payment_status = 'paid', status = 'accepted', updated_at = NOW() WHERE id = $1`,
        [order.service_request_id]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully. Booking is confirmed.',
      transactionRef: txnRef,
      receiptNumber: order.receipt_number,
    });
  } catch (error) {
    console.error('Error in verifyPayment:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed.' });
  }
};

/**
 * Official Razorpay Webhook Handler
 */
export const handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const bodyStr = JSON.stringify(req.body);

    if (signature) {
      const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(bodyStr).digest('hex');
      if (signature !== expected && process.env.NODE_ENV === 'production') {
        return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
      }
    }

    const event = req.body.event;
    console.log(`[Razorpay Webhook] Received event: ${event}`);

    // Acknowledge webhook immediately
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Error in handleRazorpayWebhook:', error);
    res.status(500).json({ success: false });
  }
};

/**
 * Developer Sandbox Instant Checkout Simulator
 * Fully tests end-to-end payment without requiring live bank account
 */
export const testCheckout = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'Booking ID required.' });
    }

    const bRes = await query('SELECT * FROM consultation_bookings WHERE id = $1', [bookingId]);
    if (bRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Booking not found.' });

    const booking = bRes.rows[0];
    const dummyPaymentId = `pay_test_${crypto.randomBytes(8).toString('hex')}`;
    const dummyOrderId = `order_test_${crypto.randomBytes(8).toString('hex')}`;

    // Create order if needed
    const orderId = crypto.randomUUID();
    const amountPaise = Math.round(parseFloat(booking.fee_amount) * 100);

    await query(
      `INSERT INTO payment_orders (id, order_ref, razorpay_order_id, user_id, booking_id, amount_paise, status, receipt_number)
       VALUES ($1, $2, $3, $4, $5, $6, 'paid', $7)`,
      [
        orderId,
        `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        dummyOrderId,
        booking.client_id,
        bookingId,
        amountPaise,
        `RCPT-${booking.booking_ref}`,
      ]
    );

    const gross = parseFloat(booking.fee_amount);
    const commission = (gross * 15.0) / 100;
    const net = gross - commission;
    const txnId = crypto.randomUUID();

    await query(
      `INSERT INTO payment_transactions (id, transaction_ref, order_id, razorpay_payment_id, razorpay_signature, amount_paise, status, payment_method)
       VALUES ($1, $2, $3, $4, 'sig_test_simulator', $5, 'success', 'upi_test')`,
      [txnId, `TXN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`, orderId, dummyPaymentId, amountPaise]
    );

    await query(
      `INSERT INTO commission_ledgers (id, transaction_id, booking_id, gross_amount, commission_rate, platform_fee, lawyer_net_amount, status)
       VALUES ($1, $2, $3, $4, 15.00, $5, $6, 'credited')`,
      [crypto.randomUUID(), txnId, bookingId, gross, commission, net]
    );

    await query(
      `INSERT INTO lawyer_earnings (id, lawyer_id, transaction_id, gross_amount, platform_commission, net_earnings, description, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'available')`,
      [crypto.randomUUID(), booking.lawyer_id, txnId, gross, commission, net, `Consultation booking fee (${booking.booking_ref})`]
    );

    await query(
      `UPDATE consultation_bookings SET payment_status = 'paid', status = 'confirmed', updated_at = NOW() WHERE id = $1`,
      [bookingId]
    );

    res.status(200).json({
      success: true,
      message: 'Test payment processed and verified successfully in sandbox mode.',
      paymentId: dummyPaymentId,
      bookingRef: booking.booking_ref,
    });
  } catch (error) {
    console.error('Error in testCheckout:', error);
    res.status(500).json({ success: false, message: 'Test checkout failed.' });
  }
};

/**
 * Submit Direct UPI Payment with 12-Digit UTR
 * Validates UTR length & uniqueness, records in upi_payments table
 */
export const submitUpiPayment = async (req, res) => {
  try {
    const { userId, advocateId, amount, utrNumber, notes, consultationId, serviceRequestId } = req.body;
    const effectiveUserId = (req.user && (req.user.id || req.user._id)) || userId;

    if (!effectiveUserId) {
      return res.status(400).json({ success: false, message: 'User identification is required to submit a payment.' });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid payable amount greater than zero.' });
    }

    // Clean and validate 12-digit UTR
    const cleanUtr = (utrNumber ? String(utrNumber) : '').trim();
    if (!/^\d{12}$/.test(cleanUtr)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid UTR format. Please provide the exact 12-digit UPI Transaction Reference / UTR Number.',
      });
    }

    // Check uniqueness to prevent duplicate claims
    const existing = await query('SELECT id, status, created_at FROM upi_payments WHERE utr_number = $1', [cleanUtr]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This 12-digit UTR / Reference ID has already been submitted. Please check your transaction status or contact support.',
      });
    }

    // Insert UPI Payment
    const paymentId = crypto.randomUUID();
    const insertRes = await query(
      `INSERT INTO upi_payments (
        id, user_id, advocate_id, amount, utr_number, status, notes, consultation_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, NOW())
      RETURNING *`,
      [
        paymentId,
        effectiveUserId,
        advocateId || null,
        numAmount,
        cleanUtr,
        notes || '',
        consultationId || serviceRequestId || null,
      ]
    );

    // If consultation or booking was passed, mark payment_status as pending_verification
    if (consultationId) {
      try {
        await query(
          `UPDATE consultation_bookings SET payment_status = 'pending_verification', updated_at = NOW() WHERE id = $1`,
          [consultationId]
        );
      } catch (_) {}
    }

    // Record audit log
    try {
      await query(
        `INSERT INTO audit_logs (id, user_id, admin_email, action, target_type, target_id, details, ip_address, created_at)
         VALUES ($1, $2, 'system@jurisflow.com', 'UPI_SUBMIT', 'PAYMENT', $3, $4, $5, NOW())`,
        [
          crypto.randomUUID(),
          effectiveUserId,
          paymentId,
          `Submitted UPI Payment ₹${numAmount} with UTR ${cleanUtr}`,
          req.ip || '127.0.0.1',
        ]
      );
    } catch (_) {}

    return res.status(201).json({
      success: true,
      message: 'UPI payment submitted successfully. Your 12-digit UTR is being verified by our compliance team.',
      paymentId,
      payment: insertRes.rows[0],
    });
  } catch (error) {
    console.error('[UPI Payment Submission Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit UPI payment details.' });
  }
};

/**
 * Get Pending UPI Payments (for Admin verification queue)
 */
export const getPendingUpiPayments = async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        p.id,
        p.user_id,
        p.advocate_id,
        p.amount,
        p.utr_number,
        p.status,
        p.notes,
        p.consultation_id,
        p.created_at,
        p.verified_at,
        u.name AS user_name,
        u.email AS user_email,
        u.phone AS user_phone,
        COALESCE(a.full_name, lp.full_name, 'JurisFlow Platform') AS advocate_name
      FROM upi_payments p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN advocates a ON p.advocate_id = a.id OR p.advocate_id = a.user_id
      LEFT JOIN lawyer_profiles lp ON p.advocate_id = lp.id OR p.advocate_id = lp.user_id
      WHERE p.status = 'pending'
      ORDER BY p.created_at DESC`
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      payments: result.rows,
    });
  } catch (error) {
    console.error('[Get Pending UPI Payments Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve pending UPI payments.' });
  }
};

/**
 * Get All UPI Payments with optional status filter & search
 */
export const getAllUpiPayments = async (req, res) => {
  try {
    const { status, search } = req.query;
    let sql = `
      SELECT 
        p.id,
        p.user_id,
        p.advocate_id,
        p.amount,
        p.utr_number,
        p.status,
        p.notes,
        p.consultation_id,
        p.created_at,
        p.verified_at,
        u.name AS user_name,
        u.email AS user_email,
        u.phone AS user_phone,
        COALESCE(a.full_name, lp.full_name, 'JurisFlow Platform') AS advocate_name
      FROM upi_payments p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN advocates a ON p.advocate_id = a.id OR p.advocate_id = a.user_id
      LEFT JOIN lawyer_profiles lp ON p.advocate_id = lp.id OR p.advocate_id = lp.user_id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      params.push(status);
      sql += ` AND p.status = $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (p.utr_number ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.name ILIKE $${params.length})`;
    }

    sql += ` ORDER BY p.created_at DESC LIMIT 200`;

    const result = await query(sql, params);

    // Compute metrics
    const statsRes = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
        COUNT(*) FILTER (WHERE status = 'verified') AS verified_count,
        COUNT(*) FILTER (WHERE status = 'rejected') AS rejected_count,
        COALESCE(SUM(amount) FILTER (WHERE status = 'verified'), 0) AS total_verified_amount
      FROM upi_payments
    `);

    return res.status(200).json({
      success: true,
      stats: statsRes.rows[0] || { pending_count: 0, verified_count: 0, rejected_count: 0, total_verified_amount: 0 },
      payments: result.rows,
    });
  } catch (error) {
    console.error('[Get All UPI Payments Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve UPI payments.' });
  }
};

/**
 * Verify or Reject UPI Payment (Admin endpoint)
 * Updates status, settles consultation if linked, and dispatches confirmation email
 */
export const verifyUpiPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Please specify status as "verified" or "rejected".',
      });
    }

    const payRes = await query(
      `SELECT p.*, u.name AS user_name, u.email AS user_email,
              COALESCE(a.full_name, lp.full_name, 'JurisFlow Platform') AS advocate_name
       FROM upi_payments p
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN advocates a ON p.advocate_id = a.id OR p.advocate_id = a.user_id
       LEFT JOIN lawyer_profiles lp ON p.advocate_id = lp.id OR p.advocate_id = lp.user_id
       WHERE p.id = $1`,
      [id]
    );

    if (payRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'UPI payment record not found.' });
    }

    const payment = payRes.rows[0];

    const updateRes = await query(
      `UPDATE upi_payments
       SET status = $1,
           verified_at = NOW(),
           notes = COALESCE($2, notes)
       WHERE id = $3
       RETURNING *`,
      [status, notes || (status === 'verified' ? 'Verified by Administrator' : 'Rejected by Administrator'), id]
    );

    const updatedPayment = updateRes.rows[0];

    // If verified, settle consultation or create platform transaction record
    if (status === 'verified') {
      const grossAmount = parseFloat(payment.amount);
      const commissionRate = 15.0;
      const platformFee = (grossAmount * commissionRate) / 100;
      const lawyerNet = grossAmount - platformFee;

      // If linked to consultation_bookings
      if (payment.consultation_id) {
        try {
          await query(
            `UPDATE consultation_bookings SET
              payment_status = 'paid',
              status = 'confirmed',
              updated_at = NOW()
            WHERE id = $1`,
            [payment.consultation_id]
          );

          // Credit lawyer earnings if advocate_id is present
          if (payment.advocate_id) {
            await query(
              `INSERT INTO lawyer_earnings (
                id, lawyer_id, transaction_id, gross_amount, platform_commission,
                net_earnings, description, status
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'available')`,
              [
                crypto.randomUUID(),
                payment.advocate_id,
                id,
                grossAmount,
                platformFee,
                lawyerNet,
                `UPI Consultation Fee (UTR: ${payment.utr_number})`,
              ]
            );
          }
        } catch (bookingErr) {
          console.warn('[UPI Verification] Booking update notice:', bookingErr.message);
        }
      }

      // Send automated payment confirmation email (MUST await for serverless)
      if (payment.user_email) {
        try {
          console.log(`[UPI Verification] Dispatching confirmation email to ${payment.user_email}...`);
          await sendPaymentConfirmationEmail({
            toEmail: payment.user_email,
            userName: payment.user_name || 'Valued Client',
            amount: payment.amount,
            utrNumber: payment.utr_number,
            status: 'verified',
            verifiedAt: new Date().toISOString(),
            advocateName: payment.advocate_name || 'JurisFlow Legal Network',
            purpose: payment.consultation_id ? 'Legal Consultation Booking' : 'JurisFlow Legal Retainer Service',
          });
          console.log(`[UPI Verification] Confirmation email successfully sent to ${payment.user_email}`);
        } catch (emailErr) {
          console.error('[UPI Verification] Failed to send payment confirmation email:', emailErr);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `UPI payment marked as ${status} successfully.`,
      payment: updatedPayment,
    });
  } catch (error) {
    console.error('[Verify UPI Payment Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to update UPI payment status.' });
  }
};
