import express from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  handleRazorpayWebhook,
  testCheckout,
  submitUpiPayment,
  getPendingUpiPayments,
  getAllUpiPayments,
  verifyUpiPayment,
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Direct UPI Payment Endpoints (No Razorpay / 3rd Party Gateway Required)
router.post('/upi-submit', submitUpiPayment);
router.get('/pending', protect, getPendingUpiPayments);
router.get('/upi-list', protect, getAllUpiPayments);
router.patch('/:id/verify', protect, verifyUpiPayment);

// Legacy Razorpay / Sandbox Endpoints
router.post('/orders', protect, createPaymentOrder);
router.post('/verify', protect, verifyPayment);
router.post('/webhook', express.raw({ type: 'application/json' }), handleRazorpayWebhook);
router.post('/test-checkout', protect, testCheckout);

export default router;
