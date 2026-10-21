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

// Event Management (Students submit for moderation; Organizers & Admins publish)
router.get('/my-organized', protect, getMyOrganizedEvents);
router.post('/', protect, createEvent);
router.put('/:id', protect, updateEvent);
router.put('/:id/cancel', protect, cancelEvent);

// Single Event by ID
router.get('/:id', getEventById);

export default router;
