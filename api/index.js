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
      ALTER TABLE consultations DROP CONSTRAINT IF EXISTS consultations_status_check;
      ALTER TABLE consultations DROP CONSTRAINT IF EXISTS consultations_payment_status_check;
      ALTER TABLE consultations ALTER COLUMN status TYPE VARCHAR(50);
      ALTER TABLE consultations ALTER COLUMN payment_status TYPE VARCHAR(50);

      ALTER TABLE consultation_bookings DROP CONSTRAINT IF EXISTS consultation_bookings_status_check;
      ALTER TABLE consultation_bookings DROP CONSTRAINT IF EXISTS consultation_bookings_payment_status_check;
      ALTER TABLE consultation_bookings DROP CONSTRAINT IF EXISTS consultation_bookings_lawyer_id_fkey;
      ALTER TABLE consultation_bookings ALTER COLUMN status TYPE VARCHAR(50);
      ALTER TABLE consultation_bookings ALTER COLUMN payment_status TYPE VARCHAR(50);

      ALTER TABLE consultation_requests DROP CONSTRAINT IF EXISTS consultation_requests_status_check;
      ALTER TABLE consultation_requests DROP CONSTRAINT IF EXISTS consultation_requests_payment_status_check;
      ALTER TABLE consultation_requests ALTER COLUMN status TYPE VARCHAR(50);
      ALTER TABLE consultation_requests ALTER COLUMN payment_status TYPE VARCHAR(50);

      ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(150);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(150);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS bar_registration_number VARCHAR(100) DEFAULT '';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS bar_council_number VARCHAR(100) DEFAULT '';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS state VARCHAR(100) DEFAULT 'Delhi';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS experience_years INT DEFAULT 3;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_specialty VARCHAR(100) DEFAULT 'Contract Lawyer';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp VARCHAR(6);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_expires TIMESTAMP WITH TIME ZONE;

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

      CREATE TABLE IF NOT EXISTS upi_payments (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        advocate_id VARCHAR(36) DEFAULT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        utr_number VARCHAR(20) UNIQUE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
        notes TEXT DEFAULT '',
        consultation_id VARCHAR(36) DEFAULT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        verified_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_upi_payments_utr ON upi_payments(utr_number);
      CREATE INDEX IF NOT EXISTS idx_upi_payments_status ON upi_payments(status);
      CREATE INDEX IF NOT EXISTS idx_upi_payments_user ON upi_payments(user_id);

      ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(10, 2) DEFAULT 0.00;
      ALTER TABLE advocates ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(10, 2) DEFAULT 0.00;
      ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(10, 2) DEFAULT 0.00;
      ALTER TABLE consultation_bookings ADD COLUMN IF NOT EXISTS payout_status VARCHAR(30) DEFAULT 'held_in_escrow';
      ALTER TABLE consultation_bookings ADD COLUMN IF NOT EXISTS meeting_room_id VARCHAR(100) DEFAULT '';

      CREATE TABLE IF NOT EXISTS consultation_requests (
        id VARCHAR(36) PRIMARY KEY,
        client_id VARCHAR(36) NOT NULL,
        advocate_id VARCHAR(36) NOT NULL,
        channel VARCHAR(20) NOT NULL DEFAULT 'chat',
        mode VARCHAR(20) NOT NULL DEFAULT 'chat',
        duration_mins INT DEFAULT 15,
        duration_minutes INT DEFAULT 15,
        calculated_fee NUMERIC(10, 2) NOT NULL DEFAULT 499.00,
        rate_per_min NUMERIC(10, 2) DEFAULT 25.00,
        matter_description TEXT DEFAULT '',
        legal_issue_description TEXT DEFAULT '',
        status VARCHAR(30) DEFAULT 'pending_acceptance',
        payment_status VARCHAR(30) DEFAULT 'unpaid',
        payout_status VARCHAR(30) DEFAULT 'pending',
        booking_id VARCHAR(36) DEFAULT NULL,
        meeting_room_id VARCHAR(100) DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_cr_client ON consultation_requests(client_id);
      CREATE INDEX IF NOT EXISTS idx_cr_advocate ON consultation_requests(advocate_id);
      CREATE INDEX IF NOT EXISTS idx_cr_status ON consultation_requests(status);

      ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS channel VARCHAR(20) DEFAULT 'chat';
      ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS mode VARCHAR(20) DEFAULT 'chat';
      ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS duration_mins INT DEFAULT 15;
      ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 15;
      ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS calculated_fee NUMERIC(10, 2) DEFAULT 499.00;
      ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS matter_description TEXT DEFAULT '';
      ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS legal_issue_description TEXT DEFAULT '';
      ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) DEFAULT 'unpaid';
      ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS payout_status VARCHAR(30) DEFAULT 'pending';
      ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS booking_id VARCHAR(36) DEFAULT NULL;
      ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS meeting_room_id VARCHAR(100) DEFAULT '';

      CREATE TABLE IF NOT EXISTS consultation_session_logs (
        id VARCHAR(36) PRIMARY KEY,
        booking_id VARCHAR(36) NOT NULL,
        advocate_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        mode VARCHAR(20) DEFAULT 'chat',
        fee_charged NUMERIC(10, 2) DEFAULT 0,
        status VARCHAR(30) DEFAULT 'started',
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ended_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
        duration_seconds INT DEFAULT 0
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
