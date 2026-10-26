import crypto from 'crypto';
import { query } from '../config/db.js';

/**
 * Get Cases (Client, Lawyer, or Admin)
 */
export const getCases = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const role = req.user.role;
    const { status, practiceArea, search } = req.query;

    let queryStr = `
      SELECT
        lc.*,
        u_client.name as client_name,
        u_client.email as client_email,
        u_client.avatar as client_avatar,
        lp.full_name as lawyer_name,
        lp.primary_specialty as lawyer_specialty,
        c.title as related_contract_title
      FROM legal_cases lc
      JOIN users u_client ON lc.client_id = u_client.id
      JOIN lawyer_profiles lp ON lc.assigned_lawyer_id = lp.id
      LEFT JOIN contracts c ON lc.related_contract_id = c.id
    `;

    const conditions = [];
    const params = [];

    if (role === 'client' || role === 'business') {
      conditions.push(`lc.client_id = $${params.length + 1}`);
      params.push(userId);
    } else if (role === 'lawyer') {
      conditions.push(`lp.user_id = $${params.length + 1}`);
      params.push(userId);
    }

    if (status && status !== 'all') {
      conditions.push(`lc.status = $${params.length + 1}`);
      params.push(status);
    }

    if (practiceArea && practiceArea !== 'all') {
      conditions.push(`lc.practice_area = $${params.length + 1}`);
      params.push(practiceArea);
    }

    if (search) {
      conditions.push(`(LOWER(lc.title) LIKE $${params.length + 1} OR LOWER(lc.case_ref) LIKE $${params.length + 1} OR LOWER(lc.case_number) LIKE $${params.length + 1})`);
      params.push(`%${search.trim().toLowerCase()}%`);
    }

    if (conditions.length > 0) {
      queryStr += ` WHERE ${conditions.join(' AND ')}`;
    }

    queryStr += ` ORDER BY lc.updated_at DESC`;

    const result = await query(queryStr, params);

    // If client, sanitize private lawyer notes
    const sanitized = result.rows.map((c) => {
      if (role === 'client' || role === 'business') {
        const copy = { ...c };
        delete copy.private_lawyer_notes;
        return copy;
      }
      return c;
    });

    res.status(200).json({
      success: true,
      cases: sanitized,
    });
  } catch (error) {
    console.error('Error in getCases:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve cases.' });
  }
};

/**
 * Get Case by ID
 */
export const getCaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;
    const role = req.user.role;

    const caseRes = await query(
      `SELECT
        lc.*,
        u_client.name as client_name,
        u_client.email as client_email,
        u_client.phone as client_phone,
        u_client.avatar as client_avatar,
        lp.full_name as lawyer_name,
        lp.headline as lawyer_headline,
        lp.primary_specialty as lawyer_specialty,
        lp.user_id as lawyer_user_id,
        c.title as related_contract_title,
        c.contract_ref as related_contract_ref
      FROM legal_cases lc
      JOIN users u_client ON lc.client_id = u_client.id
      JOIN lawyer_profiles lp ON lc.assigned_lawyer_id = lp.id
      LEFT JOIN contracts c ON lc.related_contract_id = c.id
      WHERE lc.id = $1 OR lc.case_ref = $1`,
      [id]
    );

    if (caseRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Legal case not found.' });
    }

    const legalCase = caseRes.rows[0];

    // Authorization
    if (
      role !== 'admin' &&
      legalCase.client_id !== userId &&
      legalCase.lawyer_user_id !== userId
    ) {
      return res.status(403).json({ success: false, message: 'Access denied to this case file.' });
    }

    // Documents
    const docsRes = await query(
      `SELECT cd.*, u.name as uploader_name FROM case_documents cd
       JOIN users u ON cd.uploaded_by = u.id
       WHERE cd.case_id = $1 ORDER BY cd.created_at DESC`,
      [legalCase.id]
    );

    // Sanitize lawyer private notes if client
    if (role === 'client' || role === 'business') {
      delete legalCase.private_lawyer_notes;
    }

    res.status(200).json({
      success: true,
      case: {
        ...legalCase,
        documents: docsRes.rows,
      },
    });
  } catch (error) {
    console.error('Error in getCaseById:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve case details.' });
  }
};

/**
 * Create Legal Case
 */
export const createCase = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const {
      title,
      practiceArea,
      lawyerId, // lawyer_profiles id
      clientId, // if created by lawyer, specifies client; otherwise defaults to req.user.id
      priority = 'medium',
      courtName = '',
      caseNumber = '',
      nextHearingDate,
      summary = '',
      relatedContractId,
    } = req.body;

    if (!title || !practiceArea) {
      return res.status(400).json({ success: false, message: 'Case title and practice area are required.' });
    }

    let assignedLawyerId = lawyerId;
    let targetClientId = clientId || userId;

    if (req.user.role === 'lawyer') {
      const lpRes = await query('SELECT id FROM lawyer_profiles WHERE user_id = $1', [userId]);
      if (lpRes.rows.length > 0) assignedLawyerId = lpRes.rows[0].id;
    }

    const caseRef = `CASE-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const caseId = crypto.randomUUID();

    const initialChronology = [
      { date: new Date().toISOString().split('T')[0], event: 'Case file initialized on ContractIQ platform.' },
    ];

    await query(
      `INSERT INTO legal_cases (
        id, case_ref, title, practice_area, client_id, assigned_lawyer_id,
        status, priority, court_name, case_number, next_hearing_date, summary,
        chronology, related_contract_id
      ) VALUES ($1, $2, $3, $4, $5, $6, 'enquiry', $7, $8, $9, $10, $11, $12, $13)`,
      [
        caseId,
        caseRef,
        title.trim(),
        practiceArea,
        targetClientId,
        assignedLawyerId,
        priority,
        courtName,
        caseNumber,
        nextHearingDate || null,
        summary,
        JSON.stringify(initialChronology),
        relatedContractId || null,
      ]
    );

    const created = await query('SELECT * FROM legal_cases WHERE id = $1', [caseId]);

    res.status(201).json({
      success: true,
      message: 'Case file created successfully.',
      case: created.rows[0],
    });
  } catch (error) {
    console.error('Error in createCase:', error);
    res.status(500).json({ success: false, message: 'Failed to create case file.' });
  }
};

/**
 * Update Case Status, Hearings, and Chronology
 */
export const updateCase = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      priority,
      courtName,
      caseNumber,
      nextHearingDate,
      summary,
      chronology,
      privateLawyerNotes,
      clientNotes,
    } = req.body;

    await query(
      `UPDATE legal_cases SET
        status = COALESCE($1, status),
        priority = COALESCE($2, priority),
        court_name = COALESCE($3, court_name),
        case_number = COALESCE($4, case_number),
        next_hearing_date = COALESCE($5, next_hearing_date),
        summary = COALESCE($6, summary),
        chronology = COALESCE($7, chronology),
        private_lawyer_notes = COALESCE($8, private_lawyer_notes),
        client_notes = COALESCE($9, client_notes),
        updated_at = NOW()
      WHERE id = $10`,
      [
        status,
        priority,
        courtName,
        caseNumber,
        nextHearingDate || null,
        summary,
        chronology ? JSON.stringify(chronology) : null,
        privateLawyerNotes,
        clientNotes,
        id,
      ]
    );

    res.status(200).json({
      success: true,
      message: 'Case updated successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update case.' });
  }
};

/**
 * Add Document to Case
 */
export const addCaseDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;
    const { docCategory = 'other', title, fileUrl, fileSize = 0, mimeType = 'application/pdf' } = req.body;

    if (!title || !fileUrl) {
      return res.status(400).json({ success: false, message: 'Document title and file URL are required.' });
    }

    const docId = crypto.randomUUID();
    await query(
      `INSERT INTO case_documents (id, case_id, uploaded_by, doc_category, title, file_url, file_size, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [docId, id, userId, docCategory, title.trim(), fileUrl, fileSize, mimeType]
    );

    res.status(201).json({
      success: true,
      message: 'Case document uploaded successfully.',
      documentId: docId,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to upload case document.' });
  }
};
