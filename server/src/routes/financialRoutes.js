import express from 'express';
import {
  getLawyerEarnings,
  requestPayout,
  getAdminPayouts,
  processPayout,
} from '../controllers/financialController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/earnings', requireRole('lawyer'), getLawyerEarnings);
router.post('/payouts', requireRole('lawyer'), requestPayout);
router.get('/admin/payouts', requireRole('admin'), getAdminPayouts);
router.put('/admin/payouts/:id', requireRole('admin'), processPayout);

export default router;
