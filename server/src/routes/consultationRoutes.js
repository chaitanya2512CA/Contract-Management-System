import express from 'express';
import {
  createConsultation,
  getConsultations,
  getConsultationById,
  acceptConsultation,
  rejectConsultation,
  joinConsultationRoom,
  completeConsultation,
  startInstantConsultation,
  endConsultationSession,
  createConsultationRequest,
  getConsultationRequestStatus,
  getIncomingConsultationRequests,
  respondToConsultationRequest,
  cancelConsultationRequest,
} from '../controllers/consultationController.js';
import {
  getMessagesByBooking,
  sendMessage,
} from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Astrotalk Request-and-Accept Flow APIs
router.post('/requests', createConsultationRequest);
router.get('/requests/incoming', getIncomingConsultationRequests);
router.get('/requests/:id', getConsultationRequestStatus);
router.put('/requests/:id/respond', respondToConsultationRequest);
router.put('/requests/:id/cancel', cancelConsultationRequest);

// Astrotalk Instant Consultation APIs
router.post('/instant-start', startInstantConsultation);
router.post('/:id/session-end', endConsultationSession);

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
