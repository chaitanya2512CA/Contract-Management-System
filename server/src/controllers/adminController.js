import { User } from '../models/User.js';
import { Event } from '../models/Event.js';
import { Registration } from '../models/Registration.js';
import { Attendance } from '../models/Attendance.js';
import { AuditLog } from '../models/AuditLog.js';
import { Notification } from '../models/Notification.js';

/**
 * Get Comprehensive Admin Dashboard Statistics & Analytics
 */
export const getAdminStats = async (req, res) => {
  try {
    const [
      totalStudents,
      totalOrganizers,
      totalAdmins,
      totalEvents,
      pendingEvents,
      approvedEvents,
      cancelledEvents,
      totalRegistrations,
      totalAttended,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'organizer' }),
      User.countDocuments({ role: 'admin' }),
      Event.countDocuments(),
      Event.countDocuments({ status: 'pending_approval' }),
      Event.countDocuments({ status: 'approved' }),
      Event.countDocuments({ status: 'cancelled' }),
      Registration.countDocuments({ status: { $in: ['registered', 'attended'] } }),
      Registration.countDocuments({ status: 'attended' }),
    ]);

    // Aggregate events by category
    const categoryStats = await Event.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$category', count: { $sum: 1 }, totalRegistrations: { $sum: '$registeredCount' } } },
      { $project: { category: '$_id', count: 1, totalRegistrations: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]);

    // Aggregate monthly registrations for trends
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyRegistrations = await Registration.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%b %Y', date: '$createdAt' } },
          count: { $sum: 1 },
          attended: {
            $sum: { $cond: [{ $eq: ['$status', 'attended'] }, 1, 0] },
          },
        },
      },
      { $project: { month: '$_id', registrations: '$count', attended: 1, _id: 0 } },
    ]);

    // Recent activity audit logs
    const recentLogs = await AuditLog.find().sort({ createdAt: -1 }).limit(8);

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
    const events = await Event.find({ status: 'pending_approval' })
      .populate('organizer', 'name email department organizationName phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
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

    const event = await Event.findById(eventId).populate('organizer');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    event.status = 'approved';
    event.approvedBy = admin._id;
    event.approvedAt = new Date();
    event.rejectionReason = '';
    await event.save();

    // Notify organizer
    await Notification.create({
      recipient: event.organizer._id,
      title: 'Event Approved! 🚀',
      message: `Your event "${event.title}" has been reviewed and officially approved by campus administration. It is now live for registrations.`,
      type: 'event_approval',
      link: `/events/${event._id}`,
    });

    // Create Audit Log
    await AuditLog.create({
      admin: admin._id,
      adminName: admin.name,
      adminEmail: admin.email,
      action: 'APPROVE_EVENT',
      targetType: 'Event',
      targetId: event._id.toString(),
      targetName: event.title,
      details: `Approved by ${admin.name} (${admin.adminId || admin.email})`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.status(200).json({
      success: true,
      message: `Event "${event.title}" has been approved and published.`,
      event,
    });
  } catch (error) {
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

    const event = await Event.findById(eventId).populate('organizer');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    event.status = 'rejected';
    event.rejectionReason = reason || 'Does not meet campus event guidelines.';
    await event.save();

    // Notify organizer
    await Notification.create({
      recipient: event.organizer._id,
      title: 'Event Review Update',
      message: `Your proposed event "${event.title}" was not approved. Feedback: ${event.rejectionReason}`,
      type: 'event_approval',
      link: '/organizer/dashboard',
    });

    // Create Audit Log
    await AuditLog.create({
      admin: admin._id,
      adminName: admin.name,
      adminEmail: admin.email,
      action: 'REJECT_EVENT',
      targetType: 'Event',
      targetId: event._id.toString(),
      targetName: event.title,
      details: `Rejected. Reason: ${event.rejectionReason}`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.status(200).json({
      success: true,
      message: 'Event rejected with feedback delivered to organizer.',
      event,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error rejecting event.' });
  }
};

/**
 * Get All Users with Filtering and Pagination
 */
export const getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role && role !== 'all') {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      users,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
    });
  } catch (error) {
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

    if (String(admin._id) === String(userId)) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own administrative account.' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.isActive = !user.isActive;
    await user.save();

    await AuditLog.create({
      admin: admin._id,
      adminName: admin.name,
      adminEmail: admin.email,
      action: user.isActive ? 'REACTIVATE_USER' : 'DEACTIVATE_USER',
      targetType: 'User',
      targetId: user._id.toString(),
      targetName: `${user.name} (${user.email})`,
      details: `Account status updated to: ${user.isActive ? 'Active' : 'Deactivated'}`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.status(200).json({
      success: true,
      message: `User account has been ${user.isActive ? 'reactivated' : 'deactivated'}.`,
      user,
    });
  } catch (error) {
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

    if (String(admin._id) === String(userId) && role !== 'admin') {
      return res.status(400).json({ success: false, message: 'You cannot demote your own administrative role.' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const previousRole = user.role;
    user.role = role;
    await user.save();

    await AuditLog.create({
      admin: admin._id,
      adminName: admin.name,
      adminEmail: admin.email,
      action: 'UPDATE_USER_ROLE',
      targetType: 'User',
      targetId: user._id.toString(),
      targetName: `${user.name} (${user.email})`,
      details: `Role changed from ${previousRole} to ${role}`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}.`,
      user,
    });
  } catch (error) {
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

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const newAdmin = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'admin',
      adminId: adminId || `ADM-2026-${Math.floor(100 + Math.random() * 900)}`,
      department: department || 'Campus Administration',
      phone: phone || '',
    });

    await AuditLog.create({
      admin: currentAdmin._id,
      adminName: currentAdmin.name,
      adminEmail: currentAdmin.email,
      action: 'CREATE_ADMIN',
      targetType: 'User',
      targetId: newAdmin._id.toString(),
      targetName: `${newAdmin.name} (${newAdmin.email})`,
      details: `Provisioned by ${currentAdmin.name}`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.status(201).json({
      success: true,
      message: 'New administrator account provisioned successfully.',
      admin: {
        _id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        adminId: newAdmin.adminId,
        role: newAdmin.role,
        department: newAdmin.department,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create administrator account.' });
  }
};

/**
 * Get Audit Logs
 */
export const getAuditLogs = async (req, res) => {
  try {
    const { action, targetType, page = 1, limit = 25 } = req.query;
    const query = {};

    if (action && action !== 'all') query.action = action;
    if (targetType && targetType !== 'all') query.targetType = targetType;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 25;
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      AuditLog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      logs,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve audit logs.' });
  }
};
