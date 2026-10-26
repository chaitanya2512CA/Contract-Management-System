import express from 'express';
import {
  submitVerification,
  getVerificationStatus,
  getVerificationQueue,
  reviewVerification,
} from '../controllers/verificationController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, requireRole('lawyer'), submitVerification);
router.get('/status', protect, requireRole('lawyer'), getVerificationStatus);
router.get('/queue', protect, requireRole('admin'), getVerificationQueue);
router.put('/:id/review', protect, requireRole('admin'), reviewVerification);

export default router;
