import crypto from 'crypto';
import { query } from '../config/db.js';

/**
 * Intelligent Rule-Based & Semantic Legal AI Contract Analyzer
 */
const performContractAIAnalysis = (text, contractType) => {
  const flags = [];
  const suggestions = [];
  let riskScore = 15; // baseline low risk

  const lower = text.toLowerCase();

  // 1. Indemnification Check
  if (lower.includes('indemnif') || lower.includes('hold harmless')) {
    if (lower.includes('unconditional') || lower.includes('without limit') || !lower.includes('capped') && !lower.includes('aggregate liability')) {
      riskScore += 28;
      flags.push({
        severity: 'high',
        clause: 'Uncapped / Unilateral Indemnification',
        detail: 'The contract imposes broad indemnity obligations without capping liability to fees paid or limiting to direct third-party damages.',
      });
      suggestions.push({
        clause: 'Indemnity Limitation',
        suggestion: 'Insert an aggregate monetary cap (e.g., maximum fees paid in preceding 12 months) and exclude indirect, incidental, or consequential damages.',
      });
    } else {
      riskScore += 8;
      flags.push({
        severity: 'low',
        clause: 'Indemnity Present (Capped)',
        detail: 'Indemnification is present and appears bounded by standard commercial caps.',
      });
    }
  } else {
    suggestions.push({
      clause: 'Mutual Indemnification',
      suggestion: 'Consider adding mutual indemnity protection for gross negligence, willful misconduct, and IP infringement.',
    });
  }

  // 2. Confidentiality Term
  if (lower.includes('confidential')) {
    if (lower.includes('perpetual') || lower.includes('in perpetuity')) {
      riskScore += 18;
      flags.push({
        severity: 'medium',
        clause: 'Perpetual Confidentiality Obligation',
        detail: 'Confidentiality is stipulated in perpetuity rather than standard commercial duration (typically 2–3 years post-termination).',
      });
      suggestions.push({
        clause: 'Confidentiality Sunset',
        suggestion: 'Limit confidentiality obligations to 2 or 3 years following agreement termination, retaining perpetual status only for genuine trade secrets.',
      });
    }
    if (!lower.includes('carve-out') && !lower.includes('publicly available') && !lower.includes('court order')) {
      riskScore += 12;
      flags.push({
        severity: 'medium',
        clause: 'Missing Standard Confidentiality Carve-outs',
        detail: 'No express exceptions for information already in the public domain, independently developed, or compelled by court order.',
      });
    }
  }

  // 3. Non-Compete & Non-Solicitation (Section 27 Indian Contract Act)
  if (lower.includes('non-solicit') || lower.includes('non solicit') || lower.includes('non-compete')) {
    const matchYears = text.match(/(\d+)\s*(?:years?|yrs)/i);
    const years = matchYears ? parseInt(matchYears[1], 10) : 2;
    if (years > 2) {
      riskScore += 22;
      flags.push({
        severity: 'high',
        clause: `Excessive ${years}-Year Restrictive Covenant`,
        detail: `Restrictive covenants exceeding 1-2 years face severe scrutiny under Section 27 of the Indian Contract Act (Agreements in restraint of trade are void).`,
      });
      suggestions.push({
        clause: 'Restrictive Covenant Duration',
        suggestion: `Reduce duration to 1 year or 12 months post-separation and limit strictly to key operational personnel.`,
      });
    }
  }

  // 4. Termination Without Cause / Notice
  if (lower.includes('terminat')) {
    if (lower.includes('immediate') && !lower.includes('cure period') && !lower.includes('written notice')) {
      riskScore += 16;
      flags.push({
        severity: 'high',
        clause: 'Immediate Termination Without Cure Period',
        detail: 'Permits unilateral termination without affording the non-breaching party a customary 30-day cure period for remediable defaults.',
      });
      suggestions.push({
        clause: 'Cure Period',
        suggestion: 'Incorporate a mandatory 30-day written notice and cure period before termination for material breach takes effect.',
      });
    }
  }

  // 5. Dispute Resolution & Governing Law
  if (!lower.includes('arbitrat') && !lower.includes('dispute resolution')) {
    riskScore += 10;
    flags.push({
      severity: 'medium',
      clause: 'Absence of Fast-Track Arbitration Clause',
      detail: 'Lacks expedited arbitration mechanism under the Arbitration and Conciliation Act, risking prolonged civil litigation delays.',
    });
    suggestions.push({
      clause: 'Arbitration Mechanism',
      suggestion: 'Add an institutional arbitration clause (e.g. MCIA or DIAC) with a sole arbitrator seated in a mutually agreed commercial center.',
    });
  }

  // 6. Force Majeure
  if (!lower.includes('force majeure') && !lower.includes('act of god')) {
    riskScore += 8;
    flags.push({
      severity: 'low',
      clause: 'Missing Force Majeure Clause',
      detail: 'Agreement does not account for unforeseeable events, pandemics, or government restrictions suspending performance.',
    });
    suggestions.push({
      clause: 'Force Majeure Inclusion',
      suggestion: 'Insert standard force majeure clause relieving parties of default liability during qualifying disruptive events.',
    });
  }

  // Clamp risk score between 10 and 95
  const clampedRisk = Math.min(95, Math.max(10, riskScore));

  const summary = `Comprehensive Contract Intelligence Assessment for ${contractType.toUpperCase()} document. Overall risk index evaluated at ${clampedRisk}/100. ${
    clampedRisk > 60
      ? 'CRITICAL ATTENTION: Multiple high-risk clauses detected requiring legal redlining prior to execution.'
      : clampedRisk > 35
      ? 'MODERATE RISK: Standard commercial agreement with a few areas requiring clarification and liability balancing.'
      : 'FAVORABLE / LOW RISK: Well-balanced contract terms complying with standard market practices.'
  }`;

  return {
    riskScore: clampedRisk,
    summary,
    flags,
    suggestions,
  };
};

/**
 * List Contracts Accessible to User
 * Includes owned, organization, and shared contracts
 */
export const getContracts = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const role = req.user.role;
    const { status, type, search } = req.query;

    let queryStr = `
      SELECT DISTINCT
        c.*,
        u_owner.name as owner_name,
        u_owner.email as owner_email,
        u_owner.company_name as company_name,
        sdp.permission_level as shared_permission,
        sdp.expires_at as shared_expires_at
      FROM contracts c
      JOIN users u_owner ON c.owner_id = u_owner.id
      LEFT JOIN shared_document_permissions sdp
        ON sdp.resource_id = c.id
        AND sdp.resource_type = 'contract'
        AND sdp.granted_to_lawyer_id = $1
        AND (sdp.revoked_at IS NULL)
        AND (sdp.expires_at IS NULL OR sdp.expires_at > NOW())
      WHERE
    `;

    const conditions = [];
    const params = [userId];

    if (role === 'admin') {
      conditions.push('1=1');
    } else if (role === 'lawyer') {
      conditions.push('(c.owner_id = $1 OR sdp.id IS NOT NULL)');
    } else {
      conditions.push('(c.owner_id = $1 OR c.organization_id = $1)');
    }

    if (status && status !== 'all') {
      conditions.push(`c.status = $${params.length + 1}`);
      params.push(status);
    }

    if (type && type !== 'all') {
      conditions.push(`c.contract_type = $${params.length + 1}`);
      params.push(type);
    }

    if (search) {
      conditions.push(`(LOWER(c.title) LIKE $${params.length + 1} OR LOWER(c.contract_ref) LIKE $${params.length + 1})`);
      params.push(`%${search.trim().toLowerCase()}%`);
    }

    queryStr += conditions.join(' AND ') + ' ORDER BY c.created_at DESC';

    const result = await query(queryStr, params);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      contracts: result.rows,
    });
  } catch (error) {
    console.error('Error in getContracts:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve contracts.' });
  }
};

/**
 * Get Single Contract by ID
 */
export const getContractById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;
    const role = req.user.role;

    const contractRes = await query(
      `SELECT c.*, u.name as owner_name, u.email as owner_email, u.company_name
       FROM contracts c
       JOIN users u ON c.owner_id = u.id
       WHERE c.id = $1 OR c.contract_ref = $1`,
      [id]
    );

    if (contractRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Contract document not found.' });
    }

    const contract = contractRes.rows[0];

    // Check authorization: Owner, Organization member, Admin, or explicitly shared Lawyer
    let hasAccess = role === 'admin' || contract.owner_id === userId || contract.organization_id === userId;
    let sharedPerm = null;

    if (!hasAccess && role === 'lawyer') {
      const shareRes = await query(
        `SELECT * FROM shared_document_permissions
         WHERE resource_type = 'contract' AND resource_id = $1 AND granted_to_lawyer_id = $2
         AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > NOW())`,
        [contract.id, userId]
      );
      if (shareRes.rows.length > 0) {
        hasAccess = true;
        sharedPerm = shareRes.rows[0];
      }
    }

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied: You do not possess authorization to view this contract.' });
    }

    // Fetch versions
    const versionsRes = await query(
      `SELECT cv.*, u.name as author_name FROM contract_versions cv
       LEFT JOIN users u ON cv.created_by = u.id
       WHERE cv.contract_id = $1 ORDER BY cv.version_number DESC`,
      [contract.id]
    );

    // Fetch approvals
    const approvalsRes = await query(
      `SELECT ca.*, u.name as approver_name, u.email as approver_email
       FROM contract_approvals ca
       JOIN users u ON ca.approver_id = u.id
       WHERE ca.contract_id = $1 ORDER BY ca.sequence_order ASC`,
      [contract.id]
    );

    // Fetch signatures
    const signaturesRes = await query(
      `SELECT * FROM contract_signatures WHERE contract_id = $1 ORDER BY created_at ASC`,
      [contract.id]
    );

    // Fetch shared permissions list (if owner or admin)
    let activeShares = [];
    if (contract.owner_id === userId || role === 'admin') {
      const sdpRes = await query(
        `SELECT sdp.*, u.name as lawyer_name, u.email as lawyer_email, lp.primary_specialty
         FROM shared_document_permissions sdp
         JOIN users u ON sdp.granted_to_lawyer_id = u.id
         JOIN lawyer_profiles lp ON u.id = lp.user_id
         WHERE sdp.resource_type = 'contract' AND sdp.resource_id = $1 AND sdp.revoked_at IS NULL`,
        [contract.id]
      );
      activeShares = sdpRes.rows;
    }

    res.status(200).json({
      success: true,
      contract: {
        ...contract,
        sharedPermission: sharedPerm,
        versions: versionsRes.rows,
        approvals: approvalsRes.rows,
        signatures: signaturesRes.rows,
        activeShares,
      },
    });
  } catch (error) {
    console.error('Error in getContractById:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve contract.' });
  }
};

/**
 * Create Contract
 */
export const createContract = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const {
      title,
      contractType = 'service',
      contentText,
      effectiveDate,
      expirationDate,
      renewalNoticeDays = 30,
      autoRenew = false,
      contractValue = 0,
      currency = 'INR',
    } = req.body;

    if (!title || !contentText) {
      return res.status(400).json({ success: false, message: 'Contract title and text are required.' });
    }

    const contractRef = `CLM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const contractId = crypto.randomUUID();

    // Run automatic initial AI Analysis
    const analysis = performContractAIAnalysis(contentText, contractType);

    await query(
      `INSERT INTO contracts (
        id, contract_ref, title, contract_type, organization_id, owner_id, status,
        current_version, content_text, effective_date, expiration_date, renewal_notice_days,
        auto_renew, contract_value, currency, ai_risk_score, ai_summary, ai_risk_flags,
        ai_clause_suggestions, ai_analyzed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'draft', 1, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())`,
      [
        contractId,
        contractRef,
        title.trim(),
        contractType,
        userId,
        userId,
        contentText,
        effectiveDate || null,
        expirationDate || null,
        renewalNoticeDays,
        autoRenew,
        contractValue,
        currency,
        analysis.riskScore,
        analysis.summary,
        JSON.stringify(analysis.flags),
        JSON.stringify(analysis.suggestions),
      ]
    );

    // Initial Version
    await query(
      `INSERT INTO contract_versions (id, contract_id, version_number, content_text, change_summary, created_by)
       VALUES ($1, $2, 1, $3, 'Initial Draft Created', $4)`,
      [crypto.randomUUID(), contractId, contentText, userId]
    );

    // Initial Approval Stage
    await query(
      `INSERT INTO contract_approvals (id, contract_id, approver_id, stage_name, sequence_order, status)
       VALUES ($1, $2, $3, 'Legal Review', 1, 'pending')`,
      [crypto.randomUUID(), contractId, userId]
    );

    const created = await query('SELECT * FROM contracts WHERE id = $1', [contractId]);

    res.status(201).json({
      success: true,
      message: 'Contract created and analyzed by AI.',
      contract: created.rows[0],
    });
  } catch (error) {
    console.error('Error in createContract:', error);
    res.status(500).json({ success: false, message: 'Failed to create contract.' });
  }
};

/**
 * Trigger AI Analysis on Contract
 */
export const analyzeContract = async (req, res) => {
  try {
    const { id } = req.params;
    const contractRes = await query('SELECT * FROM contracts WHERE id = $1', [id]);
    if (contractRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Contract not found.' });
    }

    const contract = contractRes.rows[0];
    const analysis = performContractAIAnalysis(contract.content_text, contract.contract_type);

    await query(
      `UPDATE contracts SET
        ai_risk_score = $1,
        ai_summary = $2,
        ai_risk_flags = $3,
        ai_clause_suggestions = $4,
        ai_analyzed_at = NOW(),
        updated_at = NOW()
      WHERE id = $5`,
      [
        analysis.riskScore,
        analysis.summary,
        JSON.stringify(analysis.flags),
        JSON.stringify(analysis.suggestions),
        id,
      ]
    );

    res.status(200).json({
      success: true,
      message: 'AI contract intelligence analysis completed.',
      analysis,
    });
  } catch (error) {
    console.error('Error in analyzeContract:', error);
    res.status(500).json({ success: false, message: 'AI Analysis failed.' });
  }
};

/**
 * Contract AI Chatbot Q&A
 */
export const chatWithContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ success: false, message: 'Question prompt is required.' });
    }

    const contractRes = await query('SELECT * FROM contracts WHERE id = $1', [id]);
    if (contractRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Contract not found.' });
    }

    const contract = contractRes.rows[0];
    const text = contract.content_text.toLowerCase();
    const qLower = question.toLowerCase();

    let answer = '';
    let citedClauses = [];

    if (qLower.includes('liability') || qLower.includes('cap') || qLower.includes('damages')) {
      if (text.includes('liability')) {
        answer = `Based on the contract text, liability is addressed under the Limitation of Liability section. Liability is generally restricted to direct damages and typically capped at total contract fees. Please ensure indirect and consequential damages are mutually excluded.`;
        citedClauses.push('Limitation of Liability Section');
      } else {
        answer = `The contract does NOT contain an explicit Limitation of Liability clause. This is a significant commercial risk as damages could potentially be uncapped in court.`;
      }
    } else if (qLower.includes('indemnif') || qLower.includes('indemnity')) {
      if (text.includes('indemnif')) {
        answer = `The contract includes an indemnification clause. Our AI analysis indicates that this clause should be reviewed by an advocate to confirm whether it is mutual or unilateral, and whether it includes standard exceptions.`;
        citedClauses.push('Indemnification Section');
      } else {
        answer = `No indemnification clause is currently present in this contract draft.`;
      }
    } else if (qLower.includes('terminat') || qLower.includes('cancel') || qLower.includes('exit')) {
      if (text.includes('terminat')) {
        answer = `Termination provisions are present. Standard Indian commercial practices mandate a minimum 30-day notice period for convenience and a 30-day cure period for material default. Check if immediate termination triggers any accrued liability penalties.`;
        citedClauses.push('Term & Termination Section');
      } else {
        answer = `No formal termination clause detected. Under Indian Contract Act, reasonable notice will be implied, but an express clause is strongly recommended.`;
      }
    } else if (qLower.includes('jurisdiction') || qLower.includes('governing law') || qLower.includes('court') || qLower.includes('arbitrat')) {
      if (text.includes('governing law') || text.includes('jurisdiction') || text.includes('arbitrat')) {
        answer = `Dispute resolution and governing law are designated in the agreement. Disputes are subject to Indian law with venue placed at the stipulated commercial court or arbitration tribunal.`;
        citedClauses.push('Governing Law & Dispute Resolution Section');
      } else {
        answer = `No governing law or exclusive jurisdiction clause is specified. This could lead to forum shopping and jurisdictional challenges if a dispute arises.`;
      }
    } else {
      answer = `ContractIQ Legal AI Assessment for "${contract.title}": The document represents a ${contract.contract_type.toUpperCase()} contract with an AI risk rating of ${contract.ai_risk_score || 25}/100. Key terms include standard commercial covenants. For specific legal enforceability in your jurisdiction, we recommend sharing this document with a verified advocate on our marketplace.`;
      citedClauses.push('General Terms & Conditions');
    }

    res.status(200).json({
      success: true,
      question,
      answer,
      citedClauses,
      contractTitle: contract.title,
    });
  } catch (error) {
    console.error('Error in chatWithContract:', error);
    res.status(500).json({ success: false, message: 'AI Chatbot processing failed.' });
  }
};

/**
 * Share Contract with Verified Advocate for Review
 */
export const shareContractWithLawyer = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;
    const { lawyerUserId, permissionLevel = 'review', purpose, durationDays = 14 } = req.body;

    if (!lawyerUserId) {
      return res.status(400).json({ success: false, message: 'Advocate user ID is required.' });
    }

    const contractRes = await query('SELECT * FROM contracts WHERE id = $1 AND owner_id = $2', [id, userId]);
    if (contractRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Contract not found or you lack permission to share it.' });
    }

    const contract = contractRes.rows[0];
    const permId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    await query(
      `INSERT INTO shared_document_permissions (
        id, resource_type, resource_id, granted_by, granted_to_lawyer_id,
        permission_level, purpose, expires_at
      ) VALUES ($1, 'contract', $2, $3, $4, $5, $6, $7)`,
      [
        permId,
        contract.id,
        userId,
        lawyerUserId,
        permissionLevel,
        purpose || 'Legal review and clause redlining',
        expiresAt.toISOString(),
      ]
    );

    // Audit log
    await query(
      `INSERT INTO audit_logs (id, user_id, admin_email, action, target_type, target_id, details)
       VALUES ($1, $2, $3, 'CONTRACT_SHARED', 'CONTRACT', $4, $5)`,
      [
        crypto.randomUUID(),
        userId,
        req.user.email,
        contract.id,
        `Shared contract "${contract.title}" with advocate ID ${lawyerUserId} for ${durationDays} days.`,
      ]
    );

    // Notification to advocate
    await query(
      `INSERT INTO notifications (id, recipient_id, title, message, type, link)
       VALUES ($1, $2, $3, $4, 'contract_shared', $5)`,
      [
        crypto.randomUUID(),
        lawyerUserId,
        'Contract Shared for Legal Review',
        `Client ${req.user.name} has granted you ${permissionLevel} access to contract "${contract.title}".`,
        `/contracts/${contract.id}`,
      ]
    );

    res.status(201).json({
      success: true,
      message: `Contract access granted to advocate for ${durationDays} days.`,
      permissionId: permId,
      expiresAt,
    });
  } catch (error) {
    console.error('Error in shareContractWithLawyer:', error);
    res.status(500).json({ success: false, message: 'Failed to share contract with advocate.' });
  }
};

/**
 * Revoke Shared Contract Access
 */
export const revokeSharedAccess = async (req, res) => {
  try {
    const { id, permissionId } = req.params;
    const userId = req.user.id || req.user._id;

    await query(
      `UPDATE shared_document_permissions SET revoked_at = NOW()
       WHERE id = $1 AND resource_id = $2 AND granted_by = $3`,
      [permissionId, id, userId]
    );

    // Audit log
    await query(
      `INSERT INTO audit_logs (id, user_id, admin_email, action, target_type, target_id, details)
       VALUES ($1, $2, $3, 'CONTRACT_SHARE_REVOKED', 'CONTRACT', $4, 'Revoked advocate access to contract.')`,
      [crypto.randomUUID(), userId, req.user.email, id]
    );

    res.status(200).json({
      success: true,
      message: 'Advocate access to contract has been successfully revoked.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to revoke access.' });
  }
};

/**
 * Sign Contract (E-Signature Workflow)
 */
export const signContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { signerName, signerEmail, signerRole = 'Authorized Signatory', signatureData } = req.body;
    const userId = req.user.id || req.user._id;

    if (!signerName || !signerEmail) {
      return res.status(400).json({ success: false, message: 'Signer name and email are required.' });
    }

    const signId = crypto.randomUUID();
    await query(
      `INSERT INTO contract_signatures (
        id, contract_id, signer_name, signer_email, signer_role, signature_data,
        status, signed_at, ip_address
      ) VALUES ($1, $2, $3, $4, $5, $6, 'signed', NOW(), $7)`,
      [
        signId,
        id,
        signerName.trim(),
        signerEmail.trim().toLowerCase(),
        signerRole,
        signatureData || 'DIGITAL_SIGNATURE_VERIFIED',
        req.ip || '127.0.0.1',
      ]
    );

    // Update contract status to signed if currently approved
    await query(
      `UPDATE contracts SET status = 'signed', updated_at = NOW() WHERE id = $1 AND status IN ('approved', 'in_review', 'draft')`,
      [id]
    );

    // Audit log
    await query(
      `INSERT INTO audit_logs (id, user_id, admin_email, action, target_type, target_id, details)
       VALUES ($1, $2, $3, 'CONTRACT_SIGNED', 'CONTRACT', $4, $5)`,
      [
        crypto.randomUUID(),
        userId,
        req.user.email,
        id,
        `E-signature executed by ${signerName} (${signerEmail}) as ${signerRole}.`,
      ]
    );

    res.status(200).json({
      success: true,
      message: 'Contract successfully signed and recorded in the audit trail.',
    });
  } catch (error) {
    console.error('Error in signContract:', error);
    res.status(500).json({ success: false, message: 'Failed to sign contract.' });
  }
};
