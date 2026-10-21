import express from 'express';
import { createAnnouncement, getAnnouncements } from '../controllers/announcementController.js';
import { protect, requireAnyRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAnnouncements);
router.post('/', protect, requireAnyRole(['organizer', 'admin']), createAnnouncement);

export default router;
