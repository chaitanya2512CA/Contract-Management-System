import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.NEON_DATABASE_URL;

let isReady = false;
let activePool = null;

if (connectionString) {
  activePool = new Pool({
    connectionString,
    ssl: !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1')
      ? { rejectUnauthorized: false }
      : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

export const pool = {
  query: async (...args) => {
    if (!activePool) await connectDB();
    return activePool.query(...args);
  },
  connect: async (...args) => {
    if (!activePool) await connectDB();
    return activePool.connect(...args);
  },
  end: async (...args) => {
    if (activePool && activePool.end) return activePool.end(...args);
    return Promise.resolve();
  },
};

export const query = async (text, params) => {
  if (!activePool) {
    await connectDB();
  }
  return activePool.query(text, params);
};

export const getClient = async () => {
  if (!activePool) {
    await connectDB();
  }
  return activePool.connect();
};

export const isDatabaseConnected = () => {
  return isReady && !!activePool;
};

let isSchemaInitialized = false;

/**
 * Initialize schema tables and indexes in Neon PostgreSQL
 */
export const initSchema = async () => {
  if (isSchemaInitialized) return true;
  if (!activePool) {
    console.warn('[DB] Database pool not ready for schema initialization.');
    return false;
  }

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await activePool.query(sql);
      console.log('[DB] Neon PostgreSQL schema verified & initialized successfully.');
      isSchemaInitialized = true;
      isReady = true;
      return true;
    }
  } catch (err) {
    console.error('[DB] Failed to execute schema initialization:', err.message);
    throw err;
  }
  return false;
};

export const connectDB = async () => {
  if (isReady && activePool) return;

  if (connectionString) {
    try {
      console.log('[DB] Connecting to Neon PostgreSQL Cloud Database...');
      activePool = new Pool({
        connectionString,
        ssl: !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1')
          ? { rejectUnauthorized: false }
          : false,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
      const client = await activePool.connect();
      const res = await client.query('SELECT NOW() as current_time, current_database() as db_name');
      client.release();
      console.log(`[DB] Connected to Neon PostgreSQL [${res.rows[0].db_name}] at ${res.rows[0].current_time}`);
      await initSchema();
      isReady = true;
    } catch (err) {
      console.warn(`[DB] Neon PostgreSQL connection warning: ${err.message}`);
      if (process.env.NODE_ENV === 'production') {
        console.error('[DB] Please ensure DATABASE_URL is added to Vercel Project Settings.');
      }
    }
  } else {
    try {
      console.log('[DB] DATABASE_URL not set in local environment. Initializing local PostgreSQL engine via pg-mem...');
      const { newDb } = await import('pg-mem');
      const memDb = newDb();
      const { Pool: MemPool } = memDb.adapters.createPg();
      activePool = new MemPool();
      await initSchema();
      console.log('[DB] Local PostgreSQL engine active with full schema support.');
      isReady = true;
    } catch (err) {
      console.error('[DB] Error initializing local PostgreSQL engine:', err.message);
    }
  }
};

export const closeDB = async () => {
  if (activePool && activePool.end) {
    await activePool.end();
  }
  isReady = false;
};


/* ================= ROW MAPPERS (CamelCase for React Compatibility) ================= */

export const mapUser = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    studentId: row.student_id || '',
    employeeId: row.employee_id || '',
    adminId: row.admin_id || '',
    department: row.department || 'General',
    graduationYear: row.graduation_year || 2026,
    phone: row.phone || '',
    avatar: row.avatar || '',
    bio: row.bio || '',
    interests: Array.isArray(row.interests) ? row.interests : (typeof row.interests === 'string' ? JSON.parse(row.interests) : []),
    organizationName: row.organization_name || '',
    isActive: row.is_active !== false,
    lastLogin: row.last_login,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const mapEvent = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    bannerImage: row.banner_image,
    eventDate: row.event_date ? (row.event_date.toISOString ? row.event_date.toISOString().split('T')[0] : row.event_date) : '',
    startTime: row.start_time,
    endTime: row.end_time,
    venue: row.venue,
    venueType: row.venue_type,
    meetingUrl: row.meeting_url || '',
    creatorId: row.creator_id,
    organizer: {
      name: row.organizer_name,
      email: row.organizer_email,
      department: row.department,
    },
    organizerName: row.organizer_name,
    organizerEmail: row.organizer_email,
    department: row.department,
    maxCapacity: Number(row.max_capacity) || 100,
    registeredCount: Number(row.registered_count) || 0,
    registrationDeadline: row.registration_deadline,
    isPaid: !!row.is_paid,
    ticketPrice: Number(row.ticket_price) || 0,
    status: row.status,
    tags: Array.isArray(row.tags) ? row.tags : (typeof row.tags === 'string' ? JSON.parse(row.tags) : []),
    eligibility: row.eligibility || 'Open to all enrolled university students',
    prerequisites: row.prerequisites || 'None',
    rejectionReason: row.rejection_reason || '',
    isTeamEvent: !!row.is_team_event,
    teamSize: {
      min: row.team_size_min || 1,
      max: row.team_size_max || 4,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const mapRegistration = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    eventId: row.event_id,
    event: row.event_title ? {
      _id: row.event_id,
      id: row.event_id,
      title: row.event_title,
      category: row.event_category,
      eventDate: row.event_date ? (row.event_date.toISOString ? row.event_date.toISOString().split('T')[0] : row.event_date) : '',
      startTime: row.event_start_time,
      endTime: row.event_end_time,
      venue: row.event_venue,
      bannerImage: row.event_banner,
      status: row.event_status,
    } : row.event_id,
    userId: row.user_id,
    user: row.user_name ? {
      _id: row.user_id,
      id: row.user_id,
      name: row.user_name,
      email: row.user_email,
      studentId: row.user_student_id,
      department: row.user_department,
    } : row.user_id,
    ticketCode: row.ticket_code,
    status: row.status,
    registrationDate: row.registration_date,
    qrCodeData: row.qr_code_data,
    teamId: row.team_id,
    teamName: row.team_name,
    createdAt: row.created_at,
  };
};

export const mapAttendance = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    eventId: row.event_id,
    registrationId: row.registration_id,
    studentId: row.student_id,
    ticketCode: row.ticket_code,
    checkedInAt: row.checked_in_at,
    verifiedBy: row.verified_by,
    scanMethod: row.scan_method,
  };
};

export const mapCertificate = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    certificateCode: row.certificate_code,
    studentId: row.student_id,
    eventId: row.event_id,
    studentName: row.student_name,
    studentRoll: row.student_roll,
    eventTitle: row.event_title,
    issueDate: row.issue_date,
    verificationUrl: row.verification_url,
    createdAt: row.created_at,
  };
};

export const mapAnnouncement = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    eventId: row.event_id,
    authorId: row.author_id,
    title: row.title,
    message: row.message,
    priority: row.priority || 'normal',
    createdAt: row.created_at,
  };
};

export const mapAuditLog = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    userId: row.user_id,
    adminEmail: row.admin_email,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    details: row.details,
    ipAddress: row.ip_address,
    createdAt: row.created_at,
  };
};

export const mapNotification = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    recipient: row.recipient_id,
    recipientId: row.recipient_id,
    title: row.title,
    message: row.message,
    type: row.type || 'general',
    link: row.link || '',
    isRead: !!row.is_read,
    createdAt: row.created_at,
  };
};

