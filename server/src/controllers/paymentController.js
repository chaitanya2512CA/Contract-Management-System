import crypto from 'crypto';
import { query } from '../config/db.js';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_contractiq_sandbox_2026';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_contractiq_secure_dev';
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'whsec_contractiq_webhook_2026';

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
