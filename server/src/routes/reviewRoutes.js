import express from 'express';
import { submitReview, getLawyerReviews } from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/lawyer/:lawyerId', getLawyerReviews);
router.post('/', protect, submitReview);

export default router;
