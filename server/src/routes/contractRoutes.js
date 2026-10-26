import express from 'express';
import {
  getContracts,
  getContractById,
  createContract,
  analyzeContract,
  chatWithContract,
  shareContractWithLawyer,
  revokeSharedAccess,
  signContract,
} from '../controllers/contractController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getContracts);
router.post('/', createContract);
router.get('/:id', getContractById);
router.post('/:id/analyze', analyzeContract);
router.post('/:id/chat', chatWithContract);
router.post('/:id/share', shareContractWithLawyer);
router.delete('/:id/share/:permissionId', revokeSharedAccess);
router.post('/:id/sign', signContract);

export default router;
