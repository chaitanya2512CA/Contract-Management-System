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
    } catch (err) {
      console.warn('[Vercel Serverless] DB connection notice:', err.message);
    }
  }
  return app(req, res);
}
