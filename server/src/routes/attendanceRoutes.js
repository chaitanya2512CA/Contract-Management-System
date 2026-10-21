import express from 'express';
import { verifyAndMarkAttendance, getEventAttendanceStats } from '../controllers/attendanceController.js';
import { protect, requireAnyRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/verify', protect, requireAnyRole(['organizer', 'admin']), verifyAndMarkAttendance);
router.get('/stats/:eventId', protect, requireAnyRole(['organizer', 'admin']), getEventAttendanceStats);

export default router;
