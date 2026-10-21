import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';

// Helper to sign JWT token
const signToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'super_secret_college_event_hub_jwt_key_2026_secured',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

// Send response with token and sanitized user
const sendAuthResponse = (user, statusCode, res, message = 'Authenticated successfully') => {
  const token = signToken(user._id, user.role);

  const sanitizedUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    studentId: user.studentId,
    employeeId: user.employeeId,
    adminId: user.adminId,
    avatar: user.avatar,
    bio: user.bio,
    interests: user.interests,
    organizationName: user.organizationName,
    isActive: user.isActive,
    graduationYear: user.graduationYear,
    phone: user.phone,
  };

  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: sanitizedUser,
  });
};

/**
 * Student Registration
 */
export const registerStudent = async (req, res) => {
  try {
    const { name, email, password, studentId, department, graduationYear, phone, interests } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'student', // Force student role
      studentId: studentId || '',
      department: department || 'General Engineering',
      graduationYear: graduationYear ? Number(graduationYear) : new Date().getFullYear() + 2,
      phone: phone || '',
      interests: Array.isArray(interests) && interests.length > 0 ? interests : ['Technology', 'Hackathons'],
    });

    sendAuthResponse(user, 201, res, 'Student account registered successfully.');
  } catch (error) {
    console.error('Error in registerStudent:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during registration.' });
  }
};

/**
 * Organizer Registration
 */
export const registerOrganizer = async (req, res) => {
  try {
    const { name, email, password, employeeId, department, organizationName, phone } = req.body;

    if (!name || !email || !password || !organizationName) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and organization name are required.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'organizer', // Force organizer role
      employeeId: employeeId || '',
      department: department || 'Student Affairs',
      organizationName,
      phone: phone || '',
    });

    sendAuthResponse(user, 201, res, 'Organizer account registered successfully.');
  } catch (error) {
    console.error('Error in registerOrganizer:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during registration.' });
  }
};

/**
 * Student Login Portal Endpoint (/student/login)
 */
export const loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.',
      });
    }

    if (user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: `This portal is for students only. Your account has the role "${user.role}". Please use the ${user.role} portal.`,
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your student account is suspended. Please contact the campus admin.',
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendAuthResponse(user, 200, res, 'Welcome back to CampusPulse!');
  } catch (error) {
    console.error('Error in loginStudent:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

/**
 * Organizer Login Portal Endpoint (/organizer/login)
 */
export const loginOrganizer = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.',
      });
    }

    // Must be organizer or admin
    if (user.role !== 'organizer' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only registered Event Organizers and Administrators can access this portal.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your organizer account is deactivated.',
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendAuthResponse(user, 200, res, 'Organizer portal authentication successful.');
  } catch (error) {
    console.error('Error in loginOrganizer:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

/**
 * Dedicated Administrator Login Portal Endpoint (/admin/login)
 * Strictly enforces admin role and logs audit events
 */
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Administrator email and password are required.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    // Safe error message to avoid account harvesting
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrative credentials or unauthorized account.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrative credentials or unauthorized account.',
      });
    }

    // STRICT CHECK: Student or Organizer CANNOT log in through the admin portal!
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not possess institutional administrator privileges.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Administrator account has been locked or deactivated.',
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Record audit log for successful admin authentication
    await AuditLog.create({
      admin: user._id,
      adminName: user.name,
      adminEmail: user.email,
      action: 'ADMIN_LOGIN',
      targetType: 'System',
      targetName: 'Admin Control Center',
      details: 'Administrator logged into the centralized campus management panel.',
      ipAddress: req.ip || '127.0.0.1',
    });

    sendAuthResponse(user, 200, res, 'Administrator authentication verified. Access granted.');
  } catch (error) {
    console.error('Error in loginAdmin:', error);
    res.status(500).json({ success: false, message: 'Server error during admin authentication.' });
  }
};

/**
 * Get Current Authenticated Profile
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
  }
};

/**
 * Update Profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, bio, department, graduationYear, interests, avatar, organizationName } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (bio !== undefined) user.bio = bio;
    if (department) user.department = department;
    if (graduationYear) user.graduationYear = Number(graduationYear);
    if (Array.isArray(interests)) user.interests = interests;
    if (avatar) user.avatar = avatar;
    if (organizationName && user.role !== 'student') user.organizationName = organizationName;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Profile update failed.' });
  }
};

/**
 * Change Password
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new password.',
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password.',
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error changing password.' });
  }
};

/**
 * Forgot Password (Development Simulation)
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your registered email.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Safe response
      return res.status(200).json({
        success: true,
        message: 'If an account exists with that email, reset instructions have been sent.',
      });
    }

    // In local development, return a simulation message
    res.status(200).json({
      success: true,
      message: 'A password reset link has been dispatched to your email address (simulated for campus demo).',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error processing password reset.' });
  }
};
