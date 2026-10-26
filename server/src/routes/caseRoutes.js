import express from 'express';
import {
  getCases,
  getCaseById,
  createCase,
  updateCase,
  addCaseDocument,
} from '../controllers/caseController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getCases);
router.post('/', createCase);
router.get('/:id', getCaseById);
router.put('/:id', updateCase);
router.post('/:id/documents', addCaseDocument);

export default router;
