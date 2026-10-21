import express from 'express';
import {
  getAdminStats,
  getPendingEvents,
  approveEvent,
  rejectEvent,
  getAllUsers,
  toggleUserStatus,
  updateUserRole,
  createAdminAccount,
  getAuditLogs,
} from '../controllers/adminController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Strict Server-Side Role Enforcement: ALL /api/admin routes require authenticated Administrator
router.use(protect);
router.use(requireRole('admin'));

// Stats & Analytics
router.get('/stats', getAdminStats);

// Event Approval & Moderation
router.get('/events/pending', getPendingEvents);
router.put('/events/:eventId/approve', approveEvent);
router.put('/events/:eventId/reject', rejectEvent);

// User & Role Management
router.get('/users', getAllUsers);
router.put('/users/:userId/toggle-status', toggleUserStatus);
router.put('/users/:userId/role', updateUserRole);
router.post('/users/create-admin', createAdminAccount);

// Audit Trail
router.get('/audit-logs', getAuditLogs);

export default router;
