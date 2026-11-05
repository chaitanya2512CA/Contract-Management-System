import dotenv from 'dotenv';
dotenv.config();

import app from '../server/src/app.js';
import { connectDB, query } from '../server/src/config/db.js';
import { ensureDemoAccounts } from '../server/src/config/seed.js';

let isInitialized = false;
let initPromise = null;

async function initializeApp() {
  await connectDB();

  // Execute progressive column and table migrations for persistent authentication
  try {
    await query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(150);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(150);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS bar_registration_number VARCHAR(100) DEFAULT '';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS bar_council_number VARCHAR(100) DEFAULT '';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS state VARCHAR(100) DEFAULT 'Delhi';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS experience_years INT DEFAULT 3;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_specialty VARCHAR(100) DEFAULT 'Contract Lawyer';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW();

      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name VARCHAR(150);
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name VARCHAR(150);
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bar_registration_number VARCHAR(100) DEFAULT '';
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bar_council_number VARCHAR(100) DEFAULT '';
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS state VARCHAR(100) DEFAULT 'Delhi';
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_years INT DEFAULT 3;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primary_specialty VARCHAR(100) DEFAULT 'Contract Lawyer';
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW();

      ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS bar_registration_number VARCHAR(100) DEFAULT '';
      ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS bar_council_number VARCHAR(100) DEFAULT '';
      ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS name VARCHAR(150);
      ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255);
      ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS state VARCHAR(100) DEFAULT 'Delhi';
      ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS experience_years INT DEFAULT 3;

      CREATE TABLE IF NOT EXISTS advocates (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36),
        full_name VARCHAR(150),
        name VARCHAR(150),
        email VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255),
        role VARCHAR(30) DEFAULT 'advocate',
        primary_specialty VARCHAR(100) DEFAULT 'Contract Lawyer',
        bar_registration_number VARCHAR(100) DEFAULT '',
        bar_council_number VARCHAR(100) DEFAULT '',
        state VARCHAR(100) DEFAULT 'Delhi',
        experience_years INT DEFAULT 3,
        phone VARCHAR(30) DEFAULT '',
        city VARCHAR(100) DEFAULT 'New Delhi',
        bio TEXT DEFAULT '',
        is_verified BOOLEAN DEFAULT true,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('[Vercel Serverless] Ensured schema columns and tables exist in database.');
  } catch (migErr) {
    console.warn('[Vercel Serverless] Migration notice:', migErr.message);
  }

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
    await ensureDemoAccounts();
    console.log('[Vercel Serverless] Ensured JurisFlow system and demo accounts exist.');
  } catch (seedErr) {
    console.warn('[Vercel Serverless] Seed notice:', seedErr.message);
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
