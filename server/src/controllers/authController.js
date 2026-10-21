import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query, mapUser } from '../config/db.js';

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
  const token = signToken(user.id || user._id, user.role);

  res.status(statusCode).json({
    success: true,
    message,
    token,
    user,
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

    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate
    const existing = await query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const id = crypto.randomUUID();

    const insertRes = await query(
      `INSERT INTO users (id, name, email, password_hash, role, student_id, department, graduation_year, phone, interests, is_active)
       VALUES ($1, $2, $3, $4, 'student', $5, $6, $7, $8, $9, true)
       RETURNING *`,
      [
        id,
        name.trim(),
        cleanEmail,
        passwordHash,
        studentId || '',
        department || 'General Engineering',
        graduationYear ? Number(graduationYear) : new Date().getFullYear() + 2,
        phone || '',
        JSON.stringify(Array.isArray(interests) && interests.length > 0 ? interests : ['Technology', 'Hackathons']),
      ]
    );

    const user = mapUser(insertRes.rows[0]);
    sendAuthResponse(user, 201, res, 'Student account registered successfully.');
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }
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

    const cleanEmail = email.trim().toLowerCase();
    const existing = await query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const id = crypto.randomUUID();

    const insertRes = await query(
      `INSERT INTO users (id, name, email, password_hash, role, employee_id, department, organization_name, phone, is_active)
       VALUES ($1, $2, $3, $4, 'organizer', $5, $6, $7, $8, true)
       RETURNING *`,
      [id, name.trim(), cleanEmail, passwordHash, employeeId || '', department || 'Student Affairs', organizationName, phone || '']
    );

    const user = mapUser(insertRes.rows[0]);
    sendAuthResponse(user, 201, res, 'Organizer account registered successfully.');
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
    }
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

    const cleanEmail = email.trim().toLowerCase();
    const userRes = await query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail]);

    if (userRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.',
      });
    }

    const row = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, row.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.',
      });
    }

    if (row.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: `This portal is for students only. Your account has the role "${row.role}". Please use the ${row.role} portal.`,
      });
    }

    if (row.is_active === false) {
      return res.status(403).json({
        success: false,
        message: 'Your student account is suspended. Please contact campus administration.',
      });
    }

    // Update last_login
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [row.id]);

    const user = mapUser(row);
    sendAuthResponse(user, 200, res, 'Welcome back to CampusPulse!');
  } catch (error) {
    console.error('Error in loginStudent:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during login.' });
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

    const cleanEmail = email.trim().toLowerCase();
    const userRes = await query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail]);

    if (userRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.',
      });
    }

    const row = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, row.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.',
      });
    }

    if (row.role !== 'organizer' && row.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only registered Event Organizers and Administrators can access this portal.',
      });
    }

    if (row.is_active === false) {
      return res.status(403).json({
        success: false,
        message: 'Your organizer account is deactivated.',
      });
    }

    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [row.id]);

    const user = mapUser(row);
    sendAuthResponse(user, 200, res, 'Organizer portal authentication successful.');
  } catch (error) {
    console.error('Error in loginOrganizer:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during login.' });
  }
};

/**
 * Dedicated Administrator Login Portal Endpoint (/admin/login)
 * Strictly enforces admin role and records audit trail
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

    const cleanEmail = email.trim().toLowerCase();
    const userRes = await query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail]);

    if (userRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrative credentials or unauthorized account.',
      });
    }

    const row = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, row.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrative credentials or unauthorized account.',
      });
    }

    // STRICT CHECK: Student or Organizer CANNOT log in through the admin portal!
    if (row.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not possess institutional administrator privileges.',
      });
    }

    if (row.is_active === false) {
      return res.status(403).json({
        success: false,
        message: 'Administrator account suspended. Contact campus chief IT officer.',
      });
    }

    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [row.id]);

    // Record audit log
    try {
      await query(
        `INSERT INTO audit_logs (id, user_id, admin_email, action, target_type, target_id, details, ip_address)
         VALUES ($1, $2, $3, 'ADMIN_LOGIN', 'USER', $4, 'Administrator portal sign in', $5)`,
        [crypto.randomUUID(), row.id, cleanEmail, row.id, req.ip || '127.0.0.1']
      );
    } catch (e) {
      // Non-blocking audit record
    }

    const user = mapUser(row);
    sendAuthResponse(user, 200, res, 'Administrator portal authentication successful.');
  } catch (error) {
    console.error('Error in loginAdmin:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during admin login.' });
  }
};

/**
 * Get Current Authenticated User Profile
 */
export const getMe = async (req, res) => {
  try {
    const userRes = await query('SELECT * FROM users WHERE id = $1', [req.user.id || req.user._id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = mapUser(userRes.rows[0]);
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
  }
};

/**
 * Update Profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, bio, department, graduationYear, interests, organizationName } = req.body;
    const userId = req.user.id || req.user._id;

    const updateRes = await query(
      `UPDATE users
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           bio = COALESCE($3, bio),
           department = COALESCE($4, department),
           graduation_year = COALESCE($5, graduation_year),
           interests = COALESCE($6, interests),
           organization_name = COALESCE($7, organization_name),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        name ? name.trim() : null,
        phone ? phone.trim() : null,
        bio !== undefined ? bio : null,
        department || null,
        graduationYear ? Number(graduationYear) : null,
        interests ? JSON.stringify(interests) : null,
        organizationName || null,
        userId,
      ]
    );

    const user = mapUser(updateRes.rows[0]);
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
    const userId = req.user.id || req.user._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new password.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const userRes = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, userRes.rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, userId]);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error changing password.' });
  }
};

/**
 * Forgot Password
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your registered email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userRes = await query('SELECT name FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No registered student account found with this email address. Please register for an account.',
      });
    }

    res.status(200).json({
      success: true,
      message: `Account found for ${userRes.rows[0].name}. In this campus demo environment, automated email dispatch is not enabled. Please sign in using the configured demo credentials (student@college.edu / Student@12345) or contact campus administration at admin@college.edu.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error processing password reset request.' });
  }
};
