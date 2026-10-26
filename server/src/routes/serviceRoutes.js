import express from 'express';
import {
  getServices,
  createService,
  requestService,
  getServiceRequests,
} from '../controllers/serviceController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getServices);
router.post('/', protect, createService);
router.post('/:id/request', protect, requestService);
router.get('/requests/all', protect, getServiceRequests);

export default router;
