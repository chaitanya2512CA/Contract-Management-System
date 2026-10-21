import express from 'express';
import {
  registerForEvent,
  registerTeam,
  joinTeam,
  cancelRegistration,
  getMyRegistrations,
  getEventParticipants,
  exportParticipantsCSV,
} from '../controllers/registrationController.js';
import { protect, requireAnyRole } from '../middleware/auth.js';

const router = express.Router();

// Student Registration routes
router.post('/register/:eventId', protect, registerForEvent);
router.post('/team/:eventId', protect, registerTeam);
router.post('/join-team/:eventId', protect, joinTeam);
router.put('/:registrationId/cancel', protect, cancelRegistration);
router.get('/my', protect, getMyRegistrations);

// Organizer / Admin Roster & CSV Export
router.get('/event/:eventId', protect, requireAnyRole(['organizer', 'admin']), getEventParticipants);
router.get('/event/:eventId/export-csv', protect, requireAnyRole(['organizer', 'admin']), exportParticipantsCSV);

export default router;
