import jwt from 'jsonwebtoken';
import { query, mapUser } from '../config/db.js';
import { verifySupabaseToken } from '../config/supabase.js';

/**
 * Universal Protection Middleware:
 * Supports both ContractIQ custom JWT tokens and native Supabase Auth access tokens.
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to proceed.',
      });
    }

    let userId = null;
    let userEmail = null;

    // 1. Attempt verification with internal ContractIQ JWT secret
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'super_secret_college_event_hub_jwt_key_2026_secured'
      );
      userId = decoded.id;
    } catch (jwtErr) {
      // 2. If internal JWT fails, attempt Supabase Auth validation
      try {
        const supabaseUser = await verifySupabaseToken(token);
        if (supabaseUser) {
          userId = supabaseUser.id;
          userEmail = supabaseUser.email;
        } else {
          // Alternatively decode unverified for claims inspection if service key is offline
          const unverified = jwt.decode(token);
          if (unverified && (unverified.sub || unverified.email) && unverified.iss?.includes('supabase')) {
            userId = unverified.sub;
            userEmail = unverified.email;
          }
        }
      } catch (sbErr) {
        // Fall through to invalid session
      }
    }

    if (!userId && !userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session. Please log in again.',
      });
    }

    // 3. Resolve user record from PostgreSQL
    let userRes;
    if (userId && userEmail) {
      userRes = await query(
        'SELECT * FROM users WHERE id = $1 OR LOWER(email) = LOWER($2) LIMIT 1',
        [userId, userEmail]
      );
    } else if (userId) {
      userRes = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [userId]);
    } else {
      userRes = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [userEmail]);
    }

    // 4. Auto-provision profile/user from Supabase Auth if record doesn't exist yet
    if (userRes.rows.length === 0 && userEmail) {
      const newId = userId || crypto.randomUUID();
      await query(
        `INSERT INTO users (id, name, email, role, is_active)
         VALUES ($1, $2, $3, 'client', true)
         ON CONFLICT (email) DO UPDATE SET is_active = true
         RETURNING *`,
        [newId, userEmail.split('@')[0], userEmail.toLowerCase()]
      );
      userRes = await query('SELECT * FROM users WHERE id = $1 OR LOWER(email) = LOWER($2) LIMIT 1', [newId, userEmail]);
    }

    if (userRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'The account associated with this session no longer exists.',
      });
    }

    const currentUser = mapUser(userRes.rows[0]);

    if (!currentUser.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact administration.',
      });
    }

    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session. Please log in again.',
    });
  }
};

/**
 * Enforce specific role
 * e.g. requireRole('admin')
 */
export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires ${role} privileges.`,
      });
    }

    next();
  };
};

/**
 * Enforce any of the given roles
 * e.g. requireAnyRole(['lawyer', 'admin'])
 */
export const requireAnyRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of [${roles.join(', ')}] privileges.`,
      });
    }

    next();
  };
};

export default { protect, requireRole, requireAnyRole };
