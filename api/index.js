import dotenv from 'dotenv';
dotenv.config();

import app from '../server/src/app.js';
import { connectDB } from '../server/src/config/db.js';
import { ensureDemoAccounts } from '../server/src/config/seed.js';

let isInitialized = false;

export default async function handler(req, res) {
  if (!isInitialized) {
    try {
      await connectDB();
      await ensureDemoAccounts();
      isInitialized = true;
      console.log('[Vercel Serverless] Database connected and demo accounts synchronized.');
    } catch (err) {
      console.error('[Vercel Serverless] Database initialization error:', {
        message: err.message,
        code: err.code,
        host: process.env.POSTGRES_HOST || process.env.PGHOST || '(from DATABASE_URL)',
      });
    }
  }
  return app(req, res);
}
