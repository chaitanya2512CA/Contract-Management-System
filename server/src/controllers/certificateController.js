import { Certificate } from '../models/Certificate.js';
import { Registration } from '../models/Registration.js';
import { Event } from '../models/Event.js';
import { Notification } from '../models/Notification.js';
import { generateCertificateCode } from '../utils/qrHelper.js';

/**
 * Issue Certificates for All Attended Participants in an Event (Organizer/Admin)
 */
export const issueCertificatesForEvent = async (req, res) => {
  try {
    const issuer = req.user;
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    if (issuer.role !== 'admin' && String(event.organizer) !== String(issuer._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    // Find all attended registrations that have not received certificates yet
    const attendedRegistrations = await Registration.find({
      event: eventId,
      status: 'attended',
      certificateIssued: { $ne: true },
    }).populate('user', 'name email');

    if (attendedRegistrations.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No pending attended participants without certificates found.',
        count: 0,
      });
    }

    let issuedCount = 0;
    for (const reg of attendedRegistrations) {
      const code = generateCertificateCode();

      const cert = await Certificate.create({
        certificateCode: code,
        event: event._id,
        user: reg.user._id,
        studentName: reg.user.name,
        eventTitle: event.title,
        eventDate: event.eventDate,
        category: event.category,
        issuedBy: issuer._id,
        issuerOrganization: event.organizerName || issuer.organizationName || 'College Event Council',
      });

      reg.certificateIssued = true;
      reg.certificate = cert._id;
      await reg.save();

      // Notify recipient
      await Notification.create({
        recipient: reg.user._id,
        title: 'Certificate of Participation Issued! 🎓',
        message: `Your verified certificate for "${event.title}" is ready. Certificate ID: ${code}.`,
        type: 'certificate',
        link: '/certificates',
      });

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
    const certificates = await Certificate.find({ user: req.user._id })
      .populate('event', 'title category bannerImage eventDate venue')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: certificates.length,
      certificates,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve certificates.' });
  }
};

/**
 * Public Verification Endpoint for Certificates
 */
export const verifyCertificate = async (req, res) => {
  try {
    const { code } = req.params;
    const cert = await Certificate.findOne({
      certificateCode: code.toUpperCase().trim(),
    })
      .populate('event', 'title category eventDate venue')
      .populate('issuedBy', 'name email organizationName');

    if (!cert) {
      return res.status(404).json({
        success: false,
        message: 'Invalid Certificate Code. No verification record exists in the campus repository.',
      });
    }

    res.status(200).json({
      success: true,
      certificate: {
        certificateCode: cert.certificateCode,
        studentName: cert.studentName,
        eventTitle: cert.eventTitle,
        eventDate: cert.eventDate,
        category: cert.category,
        issueDate: cert.issueDate,
        issuerOrganization: cert.issuerOrganization,
        status: cert.status,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Certificate verification failed.' });
  }
};
