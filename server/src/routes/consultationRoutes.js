import express from 'express';
import {
  createConsultation,
  getConsultations,
  getConsultationById,
  acceptConsultation,
  rejectConsultation,
  joinConsultationRoom,
  completeConsultation,
} from '../controllers/consultationController.js';
import {
  getMessagesByBooking,
  sendMessage,
} from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', createConsultation);
router.get('/', getConsultations);
router.get('/:id', getConsultationById);
router.put('/:id/accept', acceptConsultation);
router.put('/:id/reject', rejectConsultation);
router.get('/:id/room', joinConsultationRoom);
router.put('/:id/complete', completeConsultation);

// In-app Consultation Chat Messages
router.get('/:id/messages', getMessagesByBooking);
router.post('/:id/messages', sendMessage);

export default router;
