import dotenv from 'dotenv';
dotenv.config();

import app from '../server/src/app.js';
import { connectDB, query } from '../server/src/config/db.js';
import { ensureDemoAccounts } from '../server/src/config/seed.js';

let isInitialized = false;
let initPromise = null;

async function initializeApp() {
  await connectDB();
  try {
    const userCheck = await query('SELECT 1 FROM users LIMIT 1');
    if (!userCheck || !userCheck.rows || userCheck.rows.length === 0) {
      await ensureDemoAccounts();
    }
  } catch (_) {
    // If table check fails, try seed once
    try {
      await ensureDemoAccounts();
    } catch (seedErr) {
      console.warn('[Vercel Serverless] Seed notice:', seedErr.message);
    }
  }
  isInitialized = true;
  console.log('[Vercel Serverless] Database connected and ready.');
}

export default async function handler(req, res) {
  if (!isInitialized) {
    if (!initPromise) {
      initPromise = initializeApp().catch((err) => {
        initPromise = null;
        console.error('[Vercel Serverless] Database initialization error:', {
          message: err.message,
          code: err.code,
        });
        throw err;
      });
    }
    try {
      await initPromise;
    } catch (_) {
      // Allow app to handle error through handleAuthError
    }
  }
  return app(req, res);
}
