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

// Health check endpoint with real-time database diagnostics
app.get(['/api/health', '/health'], async (req, res) => {
  try {
    const dbInfo = await getSafeDatabaseInfo();
    const status = dbInfo.connected ? 'healthy' : 'degraded';
    res.status(200).json({
      status,
      timestamp: new Date().toISOString(),
      service: 'ContractIQ — AI Contract Lifecycle Management & Lawyer Marketplace API',
      database: dbInfo,
    });
  } catch (err) {
    res.status(200).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      service: 'ContractIQ — AI Contract Lifecycle Management & Lawyer Marketplace API',
      error: err.message,
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
