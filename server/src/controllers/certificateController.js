import crypto from 'crypto';
import { query } from '../config/db.js';
import { generateCertificateCode } from '../utils/qrHelper.js';

/**
 * Issue Certificates for All Attended Participants in an Event (Organizer/Admin)
 */
export const issueCertificatesForEvent = async (req, res) => {
  try {
    const issuer = req.user;
    const { eventId } = req.params;

    const eventRes = await query('SELECT * FROM events WHERE id = $1', [eventId]);
    if (eventRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }
    const event = eventRes.rows[0];

    const issuerId = issuer.id || issuer._id;
    if (issuer.role !== 'admin' && String(event.creator_id) !== String(issuerId)) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    // Find all attended registrations that have not received certificates yet
    const regRes = await query(
      `SELECT r.*, u.name as user_name, u.student_id as user_student_id, u.email as user_email
       FROM event_registrations r
       JOIN users u ON r.user_id = u.id
       WHERE r.event_id = $1 
         AND r.status = 'attended'
         AND NOT EXISTS (
           SELECT 1 FROM certificates c WHERE c.student_id = r.user_id AND c.event_id = r.event_id
         )`,
      [eventId]
    );

    if (regRes.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No pending attended participants without certificates found.',
        count: 0,
      });
    }

    let issuedCount = 0;
    for (const reg of regRes.rows) {
      const code = generateCertificateCode();
      const certId = crypto.randomUUID();
      const verificationUrl = `/verify/${code}`;

      await query(
        `INSERT INTO certificates (id, certificate_code, student_id, event_id, student_name, student_roll, event_title, issue_date, issued_by, verification_url, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9, NOW())`,
        [
          certId,
          code,
          reg.user_id,
          event.id,
          reg.user_name,
          reg.user_student_id || '',
          event.title,
          issuerId,
          verificationUrl,
        ]
      );

      // Notify recipient
      await query(
        `INSERT INTO notifications (id, recipient_id, title, message, type, link, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, false, NOW())`,
        [
          crypto.randomUUID(),
          reg.user_id,
          'Certificate of Participation Issued! 🎓',
          `Your verified certificate for "${event.title}" is ready. Certificate ID: ${code}.`,
          'certificate',
          '/certificates',
        ]
      ).catch(() => {});

      issuedCount++;
    }

    res.status(200).json({
      success: true,
      message: `Successfully generated and dispatched ${issuedCount} verified certificates.`,
      issuedCount,
    });
  } catch (error) {
    console.error('Error in issueCertificatesForEvent:', error);
    res.status(500).json({ success: false, message: 'Failed to generate certificates.' });
  }
};

/**
 * Get Authenticated Student's Certificates
 */
export const getMyCertificates = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const certsRes = await query(
      `SELECT c.*, 
              e.title as event_title, e.category as event_category, e.banner_image as event_banner, e.event_date, e.venue as event_venue
       FROM certificates c
       LEFT JOIN events e ON c.event_id = e.id
       WHERE c.student_id = $1
       ORDER BY c.created_at DESC`,
      [userId]
    );

    const certificates = certsRes.rows.map((row) => ({
      _id: row.id,
      id: row.id,
      certificateCode: row.certificate_code,
      studentId: row.student_id,
      studentName: row.student_name,
      studentRoll: row.student_roll,
      eventTitle: row.event_title,
      event: {
        _id: row.event_id,
        id: row.event_id,
        title: row.event_title,
        category: row.event_category,
        bannerImage: row.event_banner,
        eventDate: row.event_date ? (row.event_date.toISOString ? row.event_date.toISOString().split('T')[0] : row.event_date) : '',
        venue: row.event_venue,
      },
      issueDate: row.issue_date,
      verificationUrl: row.verification_url,
      createdAt: row.created_at,
    }));

    res.status(200).json({
      success: true,
      count: certificates.length,
      certificates,
    });
  } catch (error) {
    console.error('Error in getMyCertificates:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve certificates.' });
  }
};

/**
 * Public Verification Endpoint for Certificates
 */
export const verifyCertificate = async (req, res) => {
  try {
    const { code } = req.params;
    const cleanCode = (code || '').toUpperCase().trim();

    const certRes = await query(
      `SELECT c.*, 
              e.title as event_title, e.category as event_category, e.event_date, e.venue as event_venue,
              u.name as issuer_name, u.email as issuer_email, u.organization_name
       FROM certificates c
       LEFT JOIN events e ON c.event_id = e.id
       LEFT JOIN users u ON c.issued_by = u.id
       WHERE UPPER(c.certificate_code) = UPPER($1)`,
      [cleanCode]
    );

    if (certRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invalid Certificate Code. No verification record exists in the campus repository.',
      });
    }

    const cert = certRes.rows[0];

    res.status(200).json({
      success: true,
      certificate: {
        certificateCode: cert.certificate_code,
        studentName: cert.student_name,
        studentRoll: cert.student_roll,
        eventTitle: cert.event_title,
        eventDate: cert.event_date ? (cert.event_date.toISOString ? cert.event_date.toISOString().split('T')[0] : cert.event_date) : '',
        category: cert.event_category || 'Campus Event',
        issueDate: cert.issue_date,
        issuerOrganization: cert.organization_name || 'College Event Council',
        status: 'valid',
      },
    });
  } catch (error) {
    console.error('Error in verifyCertificate:', error);
    res.status(500).json({ success: false, message: 'Certificate verification failed.' });
  }
};

