import express from 'express';
import {
  issueCertificatesForEvent,
  getMyCertificates,
  verifyCertificate,
} from '../controllers/certificateController.js';
import { protect, requireAnyRole } from '../middleware/auth.js';

const router = express.Router();

// Issue certificates for event (Organizer / Admin)
router.post('/issue/:eventId', protect, requireAnyRole(['organizer', 'admin']), issueCertificatesForEvent);

// Student's certificates
router.get('/my', protect, getMyCertificates);

// Public certificate verification
router.get('/verify/:code', verifyCertificate);

export default router;
