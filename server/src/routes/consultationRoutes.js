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

// Astrotalk Request-and-Accept Flow APIs (supports PUT, PATCH, POST)
router.post('/requests', createConsultationRequest);
router.get('/requests/incoming', getIncomingConsultationRequests);
router.get('/requests/:id', getConsultationRequestStatus);

router.put('/requests/:id/respond', respondToConsultationRequest);
router.patch('/requests/:id/respond', respondToConsultationRequest);
router.post('/requests/:id/respond', respondToConsultationRequest);

router.put('/requests/:id/accept', respondToConsultationRequest);
router.patch('/requests/:id/accept', respondToConsultationRequest);
router.post('/requests/:id/accept', respondToConsultationRequest);

router.put('/requests/:id/cancel', cancelConsultationRequest);
router.patch('/requests/:id/cancel', cancelConsultationRequest);
router.post('/requests/:id/cancel', cancelConsultationRequest);

// Astrotalk Instant Consultation APIs
router.post('/instant-start', startInstantConsultation);
router.post('/:id/session-end', endConsultationSession);

router.post('/', createConsultation);
router.get('/', getConsultations);
router.get('/:id', getConsultationById);

router.put('/:id/accept', acceptConsultation);
router.patch('/:id/accept', acceptConsultation);
router.post('/:id/accept', acceptConsultation);

router.put('/:id/respond', respondToConsultationRequest);
router.patch('/:id/respond', respondToConsultationRequest);
router.post('/:id/respond', respondToConsultationRequest);

router.put('/:id/reject', rejectConsultation);
router.patch('/:id/reject', rejectConsultation);
router.post('/:id/reject', rejectConsultation);

router.get('/:id/room', joinConsultationRoom);
router.put('/:id/complete', completeConsultation);

// In-app Consultation Chat Messages
router.get('/:id/messages', getMessagesByBooking);
router.post('/:id/messages', sendMessage);

export default router;
