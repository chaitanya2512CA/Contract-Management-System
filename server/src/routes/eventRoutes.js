import express from 'express';
import {
  getEvents,
  getEventById,
  getTrendingEvents,
  getRecommendedEvents,
  getCalendarEvents,
  createEvent,
  updateEvent,
  cancelEvent,
  getMyOrganizedEvents,
} from '../controllers/eventController.js';
import { protect, requireAnyRole } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getEvents);
router.get('/trending', getTrendingEvents);
router.get('/calendar', getCalendarEvents);

// Authenticated Student routes
router.get('/recommendations', protect, getRecommendedEvents);

// Organizer / Admin routes
router.get('/my-organized', protect, requireAnyRole(['organizer', 'admin']), getMyOrganizedEvents);
router.post('/', protect, requireAnyRole(['organizer', 'admin']), createEvent);
router.put('/:id', protect, requireAnyRole(['organizer', 'admin']), updateEvent);
router.put('/:id/cancel', protect, requireAnyRole(['organizer', 'admin']), cancelEvent);

// Single Event by ID
router.get('/:id', getEventById);

export default router;
