import crypto from 'crypto';
import { query } from '../config/db.js';

/**
 * List Legal Services
 */
export const getServices = async (req, res) => {
  try {
    const { category, lawyerId, search } = req.query;

    let queryStr = `
      SELECT
        ls.*,
        lp.full_name as lawyer_name,
        lp.headline as lawyer_headline,
        lp.rating_avg as lawyer_rating,
        lp.is_verified as lawyer_verified,
        u.avatar as lawyer_avatar
      FROM legal_services ls
      JOIN lawyer_profiles lp ON ls.lawyer_id = lp.id
      JOIN users u ON lp.user_id = u.id
      WHERE ls.is_active = true
    `;

    const params = [];
    if (category && category !== 'all') {
      params.push(category);
      queryStr += ` AND ls.category = $${params.length}`;
    }

    if (lawyerId) {
      params.push(lawyerId);
      queryStr += ` AND ls.lawyer_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.trim().toLowerCase()}%`);
      queryStr += ` AND (LOWER(ls.title) LIKE $${params.length} OR LOWER(ls.description) LIKE $${params.length})`;
    }

    queryStr += ` ORDER BY ls.price_amount ASC`;

    const result = await query(queryStr, params);

    res.status(200).json({
      success: true,
      services: result.rows,
    });
  } catch (error) {
    console.error('Error in getServices:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve legal services.' });
  }
};

/**
 * Lawyer: Create Legal Service
 */
export const createService = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { title, category, description, deliverables = [], priceAmount, estimatedTurnaroundDays = 3 } = req.body;

    if (!title || !category || !description || !priceAmount) {
      return res.status(400).json({ success: false, message: 'Title, category, description, and price are required.' });
    }

    const lawyerRes = await query('SELECT id FROM lawyer_profiles WHERE user_id = $1', [userId]);
    if (lawyerRes.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Only registered advocates can list legal services.' });
    }
    const lawyerId = lawyerRes.rows[0].id;

    const serviceId = crypto.randomUUID();
    await query(
      `INSERT INTO legal_services (
        id, lawyer_id, title, category, description, deliverables, price_amount, estimated_turnaround_days
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        serviceId,
        lawyerId,
        title.trim(),
        category.trim(),
        description.trim(),
        JSON.stringify(deliverables),
        parseFloat(priceAmount),
        parseInt(estimatedTurnaroundDays, 10),
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Legal service listed successfully.',
      serviceId,
    });
  } catch (error) {
    console.error('Error in createService:', error);
    res.status(500).json({ success: false, message: 'Failed to list legal service.' });
  }
};

/**
 * Client: Request Legal Service
 */
export const requestService = async (req, res) => {
  try {
    const clientId = req.user.id || req.user._id;
    const { id } = req.params; // service_id
    const { requirements, supportingDocuments = [] } = req.body;

    if (!requirements) {
      return res.status(400).json({ success: false, message: 'Service requirements description is required.' });
    }

    const serviceRes = await query('SELECT * FROM legal_services WHERE id = $1', [id]);
    if (serviceRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Legal service offering not found.' });
    }

    const service = serviceRes.rows[0];
    const requestId = crypto.randomUUID();
    const requestRef = `SRV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    await query(
      `INSERT INTO service_requests (
        id, request_ref, service_id, client_id, lawyer_id, requirements,
        supporting_documents, quote_amount, status, payment_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'submitted', 'pending')`,
      [
        requestId,
        requestRef,
        service.id,
        clientId,
        service.lawyer_id,
        requirements.trim(),
        JSON.stringify(supportingDocuments),
        service.price_amount,
      ]
    );

    // Notify lawyer
    const lpRes = await query('SELECT user_id FROM lawyer_profiles WHERE id = $1', [service.lawyer_id]);
    if (lpRes.rows.length > 0) {
      await query(
        `INSERT INTO notifications (id, recipient_id, title, message, type, link)
         VALUES ($1, $2, $3, $4, 'service_request', '/lawyer/services')`,
        [
          crypto.randomUUID(),
          lpRes.rows[0].user_id,
          'New Legal Service Order Request',
          `Client ${req.user.name} requested service: "${service.title}".`,
        ]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Service order requested. Complete payment to initiate drafting.',
      requestId,
      requestRef,
    });
  } catch (error) {
    console.error('Error in requestService:', error);
    res.status(500).json({ success: false, message: 'Failed to request legal service.' });
  }
};

/**
 * Get Service Requests (Client or Lawyer)
 */
export const getServiceRequests = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const role = req.user.role;

    let queryStr = `
      SELECT
        sr.*,
        ls.title as service_title,
        ls.category as service_category,
        u_client.name as client_name,
        u_client.email as client_email,
        lp.full_name as lawyer_name
      FROM service_requests sr
      JOIN legal_services ls ON sr.service_id = ls.id
      JOIN users u_client ON sr.client_id = u_client.id
      JOIN lawyer_profiles lp ON sr.lawyer_id = lp.id
    `;

    const params = [];
    if (role === 'client' || role === 'business') {
      params.push(userId);
      queryStr += ` WHERE sr.client_id = $1`;
    } else if (role === 'lawyer') {
      params.push(userId);
      queryStr += ` WHERE lp.user_id = $1`;
    }

    queryStr += ` ORDER BY sr.created_at DESC`;

    const result = await query(queryStr, params);

    res.status(200).json({
      success: true,
      requests: result.rows,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve service requests.' });
  }
};
