import express from 'express';
import {
  getLawyers,
  getLawyerById,
  updateLawyerProfile,
  updateAvailability,
} from '../controllers/lawyerController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getLawyers);
router.get('/:id', getLawyerById);
router.put('/me/profile', protect, requireRole('lawyer'), updateLawyerProfile);
router.put('/me/availability', protect, requireRole('lawyer'), updateAvailability);

export default router;
