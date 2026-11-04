import express from 'express';
import {
  registerStudent,
  registerOrganizer,
  loginStudent,
  loginOrganizer,
  loginAdmin,
  login,
  register,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Universal ContractIQ Authentication
router.post('/login', authLimiter, login);
router.post('/register', authLimiter, register);

// Legacy Collegiate Portals
router.post('/student/register', authLimiter, registerStudent);
router.post('/student/login', authLimiter, loginStudent);
router.post('/organizer/register', authLimiter, registerOrganizer);
router.post('/organizer/login', authLimiter, loginOrganizer);
router.post('/admin/login', authLimiter, loginAdmin);

router.post('/forgot-password', authLimiter, forgotPassword);

// Protected User Profile Endpoints
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

export default router;
