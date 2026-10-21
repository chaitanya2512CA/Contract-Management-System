import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { query, mapUser, mapEvent, mapAuditLog } from '../config/db.js';

/**
 * Get Comprehensive Admin Dashboard Statistics & Analytics
 */
export const getAdminStats = async (req, res) => {
  try {
    const [
      studentsRes,
      organizersRes,
      adminsRes,
      totalEventsRes,
      pendingEventsRes,
      approvedEventsRes,
      cancelledEventsRes,
      registrationsRes,
      attendedRes,
    ] = await Promise.all([
      query("SELECT COUNT(*) FROM users WHERE role = 'student'"),
      query("SELECT COUNT(*) FROM users WHERE role = 'organizer'"),
      query("SELECT COUNT(*) FROM users WHERE role = 'admin'"),
      query("SELECT COUNT(*) FROM events"),
      query("SELECT COUNT(*) FROM events WHERE status = 'pending_approval'"),
      query("SELECT COUNT(*) FROM events WHERE status = 'approved'"),
      query("SELECT COUNT(*) FROM events WHERE status = 'cancelled'"),
      query("SELECT COUNT(*) FROM event_registrations WHERE status IN ('confirmed', 'attended')"),
      query("SELECT COUNT(*) FROM event_registrations WHERE status = 'attended'"),
    ]);

    const totalStudents = parseInt(studentsRes.rows[0].count, 10) || 0;
    const totalOrganizers = parseInt(organizersRes.rows[0].count, 10) || 0;
    const totalAdmins = parseInt(adminsRes.rows[0].count, 10) || 0;
    const totalEvents = parseInt(totalEventsRes.rows[0].count, 10) || 0;
    const pendingEvents = parseInt(pendingEventsRes.rows[0].count, 10) || 0;
    const approvedEvents = parseInt(approvedEventsRes.rows[0].count, 10) || 0;
    const cancelledEvents = parseInt(cancelledEventsRes.rows[0].count, 10) || 0;
    const totalRegistrations = parseInt(registrationsRes.rows[0].count, 10) || 0;
    const totalAttended = parseInt(attendedRes.rows[0].count, 10) || 0;

    // Aggregate events by category
    const categoryRes = await query(`
      SELECT category, COUNT(*)::int as count, COALESCE(SUM(registered_count), 0)::int as "totalRegistrations"
      FROM events
      WHERE status = 'approved'
      GROUP BY category
      ORDER BY count DESC
    `);
    const categoryStats = categoryRes.rows;

    // Monthly registrations for trends (last 6 months)
    const monthlyRes = await query(`
      SELECT created_at, status
      FROM event_registrations
      ORDER BY created_at ASC
    `);

    const monthsMap = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
      monthsMap[key] = { month: key, registrations: 0, attended: 0 };
    }

    for (const r of monthlyRes.rows) {
      if (r.created_at) {
        const d = new Date(r.created_at);
        const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
        if (!monthsMap[key]) {
          monthsMap[key] = { month: key, registrations: 0, attended: 0 };
        }
        monthsMap[key].registrations++;
        if (r.status === 'attended') {
          monthsMap[key].attended++;
        }
      }
    }
    const monthlyRegistrations = Object.values(monthsMap);

    // Recent activity audit logs
    const logsRes = await query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 8');
    const recentLogs = logsRes.rows.map(mapAuditLog);

    res.status(200).json({
      success: true,
      stats: {
        users: {
          students: totalStudents,
          organizers: totalOrganizers,
          admins: totalAdmins,
          total: totalStudents + totalOrganizers + totalAdmins,
        },
        events: {
          total: totalEvents,
          pending: pendingEvents,
          approved: approvedEvents,
          cancelled: cancelledEvents,
        },
        participation: {
          totalRegistrations,
          totalAttended,
          attendanceRate: totalRegistrations > 0 ? Math.round((totalAttended / totalRegistrations) * 100) : 0,
        },
        categoryStats,
        monthlyRegistrations,
        recentLogs,
      },
    });
  } catch (error) {
    console.error('Error in getAdminStats:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve admin analytics.' });
  }
};

/**
 * Get Pending Events for Approval Queue
 */
export const getPendingEvents = async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM events WHERE status = 'pending_approval' ORDER BY created_at DESC"
    );
    const events = result.rows.map(mapEvent);

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error('Error fetching pending events:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending events.' });
  }
};

/**
 * Approve Event
 */
export const approveEvent = async (req, res) => {
  try {
    const admin = req.user;
    const { eventId } = req.params;

    const findRes = await query('SELECT * FROM events WHERE id = $1', [eventId]);
    if (findRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }
    const currentEvent = findRes.rows[0];

    const updateRes = await query(
      `UPDATE events 
       SET status = 'approved', rejection_reason = '', updated_at = NOW() 
       WHERE id = $1 
       RETURNING *`,
      [eventId]
    );
    const updatedEvent = mapEvent(updateRes.rows[0]);

    // Send notification to creator
    if (currentEvent.creator_id) {
      await query(
        `INSERT INTO notifications (id, recipient_id, title, message, type, link, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, false, NOW())`,
        [
          crypto.randomUUID(),
          currentEvent.creator_id,
          'Event Approved! 🚀',
          `Your event "${currentEvent.title}" has been reviewed and officially approved by campus administration. It is now live for registrations.`,
          'event_approval',
          `/events/${currentEvent.id}`,
        ]
      ).catch(() => {});
    }

    // Create Audit Log
    await query(
      `INSERT INTO audit_logs (id, user_id, admin_email, action, target_type, target_id, details, ip_address, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        crypto.randomUUID(),
        admin.id || admin._id,
        admin.email,
        'APPROVE_EVENT',
        'Event',
        eventId,
        `Approved by ${admin.name} (${admin.adminId || admin.email})`,
        req.ip || '127.0.0.1',
      ]
    );

    res.status(200).json({
      success: true,
      message: `Event "${updatedEvent.title}" has been approved and published.`,
      event: updatedEvent,
    });
  } catch (error) {
    console.error('Error approving event:', error);
    res.status(500).json({ success: false, message: 'Error approving event.' });
  }
};

/**
 * Reject Event
 */
export const rejectEvent = async (req, res) => {
  try {
    const admin = req.user;
    const { eventId } = req.params;
    const { reason } = req.body;

    const findRes = await query('SELECT * FROM events WHERE id = $1', [eventId]);
    if (findRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }
    const currentEvent = findRes.rows[0];
    const rejectionReason = reason || 'Does not meet campus event guidelines.';

    const updateRes = await query(
      `UPDATE events 
       SET status = 'rejected', rejection_reason = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [rejectionReason, eventId]
    );
    const updatedEvent = mapEvent(updateRes.rows[0]);

    // Send notification to creator
    if (currentEvent.creator_id) {
      await query(
        `INSERT INTO notifications (id, recipient_id, title, message, type, link, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, false, NOW())`,
        [
          crypto.randomUUID(),
          currentEvent.creator_id,
          'Event Review Update',
          `Your proposed event "${currentEvent.title}" was not approved. Feedback: ${rejectionReason}`,
          'event_approval',
          '/events',
        ]
      ).catch(() => {});
    }

    // Create Audit Log
    await query(
      `INSERT INTO audit_logs (id, user_id, admin_email, action, target_type, target_id, details, ip_address, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        crypto.randomUUID(),
        admin.id || admin._id,
        admin.email,
        'REJECT_EVENT',
        'Event',
        eventId,
        `Rejected. Reason: ${rejectionReason}`,
        req.ip || '127.0.0.1',
      ]
    );

    res.status(200).json({
      success: true,
      message: 'Event rejected with feedback delivered to organizer.',
      event: updatedEvent,
    });
  } catch (error) {
    console.error('Error rejecting event:', error);
    res.status(500).json({ success: false, message: 'Error rejecting event.' });
  }
};

/**
 * Get All Users with Filtering and Pagination
 */
export const getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];

    if (role && role !== 'all') {
      params.push(role);
      conditions.push(`role = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      const pIdx = params.length;
      conditions.push(`(name ILIKE $${pIdx} OR email ILIKE $${pIdx} OR department ILIKE $${pIdx} OR student_id ILIKE $${pIdx} OR employee_id ILIKE $${pIdx})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*) FROM users ${whereClause}`, params);
    const total = parseInt(countRes.rows[0].count, 10) || 0;

    params.push(limitNum);
    const limitParamIdx = params.length;
    params.push(offset);
    const offsetParamIdx = params.length;

    const dataRes = await query(
      `SELECT * FROM users ${whereClause} ORDER BY created_at DESC LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx}`,
      params
    );
    const users = dataRes.rows.map(mapUser);

    res.status(200).json({
      success: true,
      users,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
    });
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve users.' });
  }
};

/**
 * Toggle User Active Status (Deactivate / Reactivate)
 */
export const toggleUserStatus = async (req, res) => {
  try {
    const admin = req.user;
    const { userId } = req.params;

    if (String(admin.id || admin._id) === String(userId)) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own administrative account.' });
    }

    const userRes = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const user = userRes.rows[0];
    const newStatus = !user.is_active;

    const updateRes = await query(
      'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [newStatus, userId]
    );
    const updatedUser = mapUser(updateRes.rows[0]);

    await query(
      `INSERT INTO audit_logs (id, user_id, admin_email, action, target_type, target_id, details, ip_address, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        crypto.randomUUID(),
        admin.id || admin._id,
        admin.email,
        newStatus ? 'REACTIVATE_USER' : 'DEACTIVATE_USER',
        'User',
        userId,
        `Account status updated to: ${newStatus ? 'Active' : 'Deactivated'}`,
        req.ip || '127.0.0.1',
      ]
    );

    res.status(200).json({
      success: true,
      message: `User account has been ${newStatus ? 'reactivated' : 'deactivated'}.`,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error in toggleUserStatus:', error);
    res.status(500).json({ success: false, message: 'Failed to update user status.' });
  }
};

/**
 * Update User Role (e.g. promote student to organizer or admin)
 */
export const updateUserRole = async (req, res) => {
  try {
    const admin = req.user;
    const { userId } = req.params;
    const { role } = req.body;

    if (!['student', 'organizer', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified.' });
    }

    if (String(admin.id || admin._id) === String(userId) && role !== 'admin') {
      return res.status(400).json({ success: false, message: 'You cannot demote your own administrative role.' });
    }

    const userRes = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const previousRole = userRes.rows[0].role;

    const updateRes = await query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [role, userId]
    );
    const updatedUser = mapUser(updateRes.rows[0]);

    await query(
      `INSERT INTO audit_logs (id, user_id, admin_email, action, target_type, target_id, details, ip_address, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        crypto.randomUUID(),
        admin.id || admin._id,
        admin.email,
        'UPDATE_USER_ROLE',
        'User',
        userId,
        `Role changed from ${previousRole} to ${role}`,
        req.ip || '127.0.0.1',
      ]
    );

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}.`,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error in updateUserRole:', error);
    res.status(500).json({ success: false, message: 'Failed to update user role.' });
  }
};

/**
 * Provision New Administrator Account (Only Existing Admin Can Create)
 */
export const createAdminAccount = async (req, res) => {
  try {
    const currentAdmin = req.user;
    const { name, email, password, adminId, department, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existingRes = await query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (existingRes.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const newId = crypto.randomUUID();
    const assignedAdminId = adminId || `ADM-2026-${Math.floor(100 + Math.random() * 900)}`;

    const insertRes = await query(
      `INSERT INTO users (id, name, email, password_hash, role, admin_id, department, phone, is_active, created_at, updated_at)
       VALUES ($1, $2, LOWER($3), $4, 'admin', $5, $6, $7, true, NOW(), NOW())
       RETURNING *`,
      [
        newId,
        name.trim(),
        email.trim(),
        passwordHash,
        assignedAdminId,
        department || 'Campus Administration',
        phone || '',
      ]
    );
    const newAdmin = mapUser(insertRes.rows[0]);

    await query(
      `INSERT INTO audit_logs (id, user_id, admin_email, action, target_type, target_id, details, ip_address, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        crypto.randomUUID(),
        currentAdmin.id || currentAdmin._id,
        currentAdmin.email,
        'CREATE_ADMIN',
        'User',
        newAdmin.id,
        `Provisioned by ${currentAdmin.name}`,
        req.ip || '127.0.0.1',
      ]
    );

    res.status(201).json({
      success: true,
      message: 'New administrator account provisioned successfully.',
      admin: {
        _id: newAdmin.id,
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        adminId: newAdmin.adminId,
        role: newAdmin.role,
        department: newAdmin.department,
      },
    });
  } catch (error) {
    console.error('Error creating admin account:', error);
    res.status(500).json({ success: false, message: 'Failed to create administrator account.' });
  }
};

/**
 * Get Audit Logs
 */
export const getAuditLogs = async (req, res) => {
  try {
    const { action, targetType, page = 1, limit = 25 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 25;
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];

    if (action && action !== 'all') {
      params.push(action);
      conditions.push(`action = $${params.length}`);
    }

    if (targetType && targetType !== 'all') {
      params.push(targetType);
      conditions.push(`target_type = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*) FROM audit_logs ${whereClause}`, params);
    const total = parseInt(countRes.rows[0].count, 10) || 0;

    params.push(limitNum);
    const limitParamIdx = params.length;
    params.push(offset);
    const offsetParamIdx = params.length;

    const dataRes = await query(
      `SELECT * FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx}`,
      params
    );
    const logs = dataRes.rows.map(mapAuditLog);

    res.status(200).json({
      success: true,
      logs,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
    });
  } catch (error) {
    console.error('Error in getAuditLogs:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve audit logs.' });
  }
};

