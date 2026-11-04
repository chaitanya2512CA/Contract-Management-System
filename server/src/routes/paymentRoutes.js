import express from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  handleRazorpayWebhook,
  testCheckout,
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/orders', protect, createPaymentOrder);
router.post('/verify', protect, verifyPayment);
router.post('/webhook', express.raw({ type: 'application/json' }), handleRazorpayWebhook);
router.post('/test-checkout', protect, testCheckout);

export default router;
