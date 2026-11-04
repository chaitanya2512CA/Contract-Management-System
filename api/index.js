import dotenv from 'dotenv';
dotenv.config();

import app from '../server/src/app.js';
import { connectDB, query } from '../server/src/config/db.js';
import { ensureDemoAccounts } from '../server/src/config/seed.js';

let isInitialized = false;
let initPromise = null;

async function initializeApp() {
  await connectDB();

  // Purge any legacy mock advocate test data so the database contains only genuine registered advocates
  try {
    await query(`
      DELETE FROM users WHERE email IN (
        'criminal.law@contractiq.com', 'criminal.law@jurisflow.com',
        'corporate.law@contractiq.com', 'corporate.law@jurisflow.com',
        'contract.law@contractiq.com', 'contract.law@jurisflow.com',
        'family.law@contractiq.com', 'family.law@jurisflow.com',
        'property.law@contractiq.com', 'property.law@jurisflow.com',
        'cyber.law@contractiq.com', 'cyber.law@jurisflow.com',
        'tax.law@contractiq.com', 'tax.law@jurisflow.com',
        'ip.law@contractiq.com', 'ip.law@jurisflow.com'
      ) OR email LIKE '%.law@contractiq.com' OR email LIKE '%.law@jurisflow.com';
      DELETE FROM lawyer_profiles WHERE full_name IN (
        'Adv. Vikramaditya Deshmukh',
        'Adv. Ananya Roy',
        'Adv. Siddharth Malhotra',
        'Adv. Meenakshi Sundaram',
        'Adv. Rajeshwar Verma',
        'Adv. Rohan Menon',
        'Adv. Harish Chawla',
        'Adv. Neha Kapoor'
      ) OR headline LIKE '%Senior Criminal Defense%' OR bar_council_number IN (
        'D/1842/2012', 'MAH/2941/2016', 'KAR/1109/2018', 'TN/3401/2010',
        'TS/2190/2014', 'PH/1908/2017', 'WB/982/2008', 'MAH/5623/2015'
      );
    `);
    console.log('[Vercel Serverless] Purged any legacy mock advocate records from database.');
  } catch (cleanErr) {
    console.warn('[Vercel Serverless] Purge mock advocates notice:', cleanErr.message);
  }

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
