import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Route imports
import authRoutes from './routes/authRoutes.js';
import lawyerRoutes from './routes/lawyerRoutes.js';
import verificationRoutes from './routes/verificationRoutes.js';
import consultationRoutes from './routes/consultationRoutes.js';
import contractRoutes from './routes/contractRoutes.js';
import caseRoutes from './routes/caseRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import financialRoutes from './routes/financialRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';

// Legacy routes preserved
import eventRoutes from './routes/eventRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

dotenv.config();

const app = express();

// Security and utility middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow local development, same origin, and vercel preview domains
      callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

import { getSafeDatabaseInfo } from './config/db.js';
import { createFreshTransporter } from './utils/email.js';

// Health check endpoint with real-time database diagnostics
app.get(['/api/health', '/health'], async (req, res) => {
  try {
    const dbInfo = await getSafeDatabaseInfo();
    const status = dbInfo.connected ? 'healthy' : 'degraded';
    res.status(200).json({
      status,
      timestamp: new Date().toISOString(),
      service: 'JurisFlow — Your Legal World, Organized in One Flow.',
      database: dbInfo,
    });
  } catch (err) {
    res.status(200).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      service: 'JurisFlow — Your Legal World, Organized in One Flow.',
      error: err.message,
    });
  }
});

// Live Email Transporter Diagnostic Endpoint
app.get(['/api/test-email', '/test-email'], async (req, res) => {
  const targetEmail = (req.query.to || 'jjurisflow03@gmail.com').toString().trim();
  const reqPort = req.query.port ? parseInt(req.query.port, 10) : undefined;

  const rawUser = process.env.EMAIL_USER || '';
  let cleanUser = rawUser.trim();
  if (/@gamil\.com$/i.test(cleanUser)) {
    cleanUser = cleanUser.replace(/@gamil\.com$/i, '@gmail.com');
  }
  const rawPass = process.env.EMAIL_PASS || '';
  const cleanPass = rawPass.trim().replace(/\s+/g, '');

  const diagnostic = {
    timestamp: new Date().toISOString(),
    recipient: targetEmail,
    env: {
      EMAIL_USER_RAW_LENGTH: rawUser.length,
      EMAIL_USER_PREFIX: cleanUser ? `${cleanUser.substring(0, 3)}***@${cleanUser.split('@')[1] || ''}` : '<MISSING>',
      EMAIL_PASS_CONFIGURED: cleanPass.length > 0,
      EMAIL_PASS_LENGTH: cleanPass.length,
      EMAIL_PORT_ENV: process.env.EMAIL_PORT || null,
      TESTED_PORT: reqPort || (process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 465),
      TESTED_SECURE: (reqPort || (process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 465)) === 465,
    },
    verify: null,
    send: null,
  };

  if (!cleanUser || !cleanPass) {
    return res.status(400).json({
      success: false,
      step: 'env_validation',
      message: 'EMAIL_USER or EMAIL_PASS environment variable is missing on this Vercel instance.',
      diagnostic,
    });
  }

  const transporter = createFreshTransporter({ port: reqPort });
  if (!transporter) {
    return res.status(500).json({
      success: false,
      step: 'transporter_initialization',
      message: 'Failed to create Nodemailer transporter.',
      diagnostic,
    });
  }

  // 1. Run transporter.verify()
  try {
    const verifyRes = await transporter.verify();
    diagnostic.verify = {
      success: true,
      result: verifyRes,
    };
    console.log('[DIAGNOSTIC / SMTP Verify SUCCESS]:', verifyRes);
  } catch (verifyErr) {
    console.error('[DIAGNOSTIC / SMTP Verify FAILED]:', {
      message: verifyErr.message,
      code: verifyErr.code,
      response: verifyErr.response,
      command: verifyErr.command,
    });
    diagnostic.verify = {
      success: false,
      message: verifyErr.message,
      code: verifyErr.code || null,
      response: verifyErr.response || null,
      command: verifyErr.command || null,
    };
    return res.status(500).json({
      success: false,
      step: 'transporter_verify',
      error: verifyErr.message,
      diagnostic,
    });
  }

  // 2. Attempt sendMail()
  try {
    const info = await transporter.sendMail({
      from: `"JurisFlow Diagnostics" <${cleanUser}>`,
      to: targetEmail,
      subject: `JurisFlow Serverless Diagnostic — ${new Date().toLocaleTimeString()}`,
      text: `Hello,\n\nThis is a verified live diagnostic email from JurisFlow serverless on Vercel.\n\nTimestamp: ${new Date().toISOString()}\nRecipient: ${targetEmail}\nPort: ${transporter.options.port} (secure: ${transporter.options.secure})\n\n© ${new Date().getFullYear()} JurisFlow.`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #080808; color: #f5e6c4; padding: 25px; border-radius: 14px; border: 1px solid #d4af37;">
          <h2 style="color: #ffffff; margin-top: 0;">⚖️ JurisFlow Serverless Delivery Verified</h2>
          <p style="color: #a39e93; font-size: 14px;">This diagnostic email confirms live transactional SMTP delivery from Vercel to <strong style="color: #d4af37;">${targetEmail}</strong>.</p>
          <div style="background: #121212; padding: 12px 16px; border-radius: 8px; border: 1px solid #262118; margin: 15px 0; font-family: monospace; font-size: 12px;">
            <div><strong>Sender:</strong> ${cleanUser}</div>
            <div><strong>Recipient:</strong> ${targetEmail}</div>
            <div><strong>Timestamp:</strong> ${new Date().toISOString()}</div>
            <div><strong>Port:</strong> ${transporter.options.port} (secure: ${transporter.options.secure})</div>
          </div>
          <p style="font-size: 11px; color: #666158;">JurisFlow — Your Legal World, Organized in One Flow.</p>
        </div>
      `,
    });

    diagnostic.send = {
      success: true,
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
    };
    console.log('[DIAGNOSTIC / SMTP Send SUCCESS]:', info.messageId, info.response);

    return res.status(200).json({
      success: true,
      step: 'completed',
      message: `Diagnostic email successfully sent to ${targetEmail}`,
      diagnostic,
    });
  } catch (sendErr) {
    console.error('[DIAGNOSTIC / SMTP Send FAILED]:', {
      message: sendErr.message,
      code: sendErr.code,
      response: sendErr.response,
      command: sendErr.command,
    });
    diagnostic.send = {
      success: false,
      message: sendErr.message,
      code: sendErr.code || null,
      response: sendErr.response || null,
      command: sendErr.command || null,
    };
    return res.status(500).json({
      success: false,
      step: 'transporter_sendMail',
      error: sendErr.message,
      diagnostic,
    });
  }
});

// Mount application API routes (supporting both /api/* and stripped /* paths)
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/lawyers', '/lawyers'], lawyerRoutes);
app.use(['/api/lawyer-verification', '/lawyer-verification'], verificationRoutes);
app.use(['/api/consultations', '/consultations'], consultationRoutes);
app.use(['/api/contracts', '/contracts'], contractRoutes);
app.use(['/api/cases', '/cases'], caseRoutes);
app.use(['/api/services', '/services'], serviceRoutes);
app.use(['/api/payments', '/payments', '/api/payment-orders'], paymentRoutes);
app.use(['/api/financials', '/financials', '/api/earnings', '/earnings'], financialRoutes);
app.use(['/api/reviews', '/reviews'], reviewRoutes);

// Preserved Legacy Routes
app.use(['/api/events', '/events'], eventRoutes);
app.use(['/api/registrations', '/registrations'], registrationRoutes);
app.use(['/api/attendance', '/attendance'], attendanceRoutes);
app.use(['/api/certificates', '/certificates'], certificateRoutes);
app.use(['/api/admin', '/admin'], adminRoutes);
app.use(['/api/announcements', '/announcements'], announcementRoutes);
app.use(['/api/notifications', '/notifications'], notificationRoutes);

// 404 Handler for undefined API routes
app.use(['/api/*', '/api'], (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

export default app;
