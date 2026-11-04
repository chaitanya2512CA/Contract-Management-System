import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { query, isDatabaseConnected, initSchema } from './db.js';

dotenv.config();

/**
 * Idempotently seed and ensure JurisFlow system accounts, core settings, and CLM contracts.
 * Only genuine registered advocates from the database will appear in the directory.
 */
export const ensureDemoAccounts = async () => {
  const salt = await bcrypt.genSalt(10);
  const defaultPassword = 'Password@12345';
  const hashedDefault = await bcrypt.hash(defaultPassword, salt);

  // 1. Purge legacy mock advocate test data so that only genuine registered advocates appear
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
    `);
    await query(`
      DELETE FROM lawyer_profiles WHERE full_name IN (
        'Adv. Vikramaditya Deshmukh',
        'Adv. Ananya Roy',
        'Adv. Siddharth Malhotra',
        'Adv. Meenakshi Sundaram',
        'Adv. Rajeshwar Verma',
        'Adv. Rohan Menon',
        'Adv. Harish Chawla',
        'Adv. Neha Kapoor'
      );
    `);
    console.log('[Seed] Purged any legacy mock advocate records.');
  } catch (cleanErr) {
    console.warn('[Seed] Note on cleaning mock advocate records:', cleanErr.message);
  }

  // Helper to get or insert user
  const ensureUser = async ({ id, name, email, password, role, phone, company, city, state, avatar, bio }) => {
    const existing = await query('SELECT id, password_hash FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return existing.rows[0].id;
    }
    const userId = id || crypto.randomUUID();
    const hash = password ? await bcrypt.hash(password, salt) : hashedDefault;
    await query(
      `INSERT INTO users (id, name, email, password_hash, role, phone, company_name, city, state, avatar, bio, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)`,
      [
        userId,
        name,
        email.toLowerCase(),
        hash,
        role,
        phone || '+91 98765 43210',
        company || '',
        city || 'New Delhi',
        state || 'Delhi',
        avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
        bio || ''
      ]
    );

    try {
      await query(
        `INSERT INTO profiles (id, email, full_name, role, phone, company_name, city, state, bio, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
         ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role`,
        [userId, email.toLowerCase(), name, role, phone || '+91 98765 43210', company || '', city || 'New Delhi', state || 'Delhi', bio || '']
      );
    } catch (_) {}

    return userId;
  };

  // 1. Super Admin Accounts
  const adminId = await ensureUser({
    name: 'Chief Legal Officer (Admin)',
    email: 'admin@jurisflow.com',
    password: 'Admin@12345',
    role: 'admin',
    phone: '+91 99000 11223',
    company: 'JurisFlow Legal Governance',
    city: 'New Delhi',
    state: 'Delhi',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    bio: 'Oversees platform advocate verification, commission distribution, compliance auditing, and disputes.'
  });

  await ensureUser({
    name: 'Chief Legal Officer (Admin)',
    email: 'admin@contractiq.com',
    password: 'Admin@12345',
    role: 'admin',
    phone: '+91 99000 11223',
    company: 'JurisFlow Legal Governance',
    city: 'New Delhi',
    state: 'Delhi',
  });

  // 2. Individual Client Accounts
  const clientId = await ensureUser({
    name: 'Rahul Sharma',
    email: 'client@jurisflow.com',
    password: 'Client@12345',
    role: 'client',
    phone: '+91 98111 22334',
    city: 'New Delhi',
    state: 'Delhi',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
    bio: 'Individual professional seeking contract review and legal counsel for intellectual property and commercial matters.'
  });

  await ensureUser({
    name: 'Rahul Sharma',
    email: 'client@contractiq.com',
    password: 'Client@12345',
    role: 'client',
    phone: '+91 98111 22334',
    city: 'New Delhi',
    state: 'Delhi',
  });

  // 3. Business / Enterprise Client Accounts
  const businessId = await ensureUser({
    name: 'Vikram Singhania',
    email: 'business@jurisflow.com',
    password: 'Business@12345',
    role: 'business',
    company: 'Apex Dynamics Technologies Pvt. Ltd.',
    phone: '+91 98222 33445',
    city: 'Bengaluru',
    state: 'Karnataka',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300',
    bio: 'Head of Legal & Operations at Apex Dynamics. Managing 120+ vendor contracts, SaaS licensing agreements, and employment compliance.'
  });

  await ensureUser({
    name: 'Vikram Singhania',
    email: 'business@contractiq.com',
    password: 'Business@12345',
    role: 'business',
    company: 'Apex Dynamics Technologies Pvt. Ltd.',
    phone: '+91 98222 33445',
    city: 'Bengaluru',
    state: 'Karnataka',
  });

  // Support legacy demo accounts for test suite compatibility
  await ensureUser({
    name: process.env.ADMIN_NAME || 'Chief Campus Administrator',
    email: 'admin@college.edu',
    password: 'Admin@12345',
    role: 'admin',
    phone: '+1 555-0199',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300'
  });
  await ensureUser({
    name: 'Priya Sharma (Student Demo)',
    email: 'student@college.edu',
    password: 'Student@12345',
    role: 'student',
    phone: '+1 555-0101',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'
  });
  await ensureUser({
    name: 'Dr. Vikramaditya (Organizer Demo)',
    email: 'organizer@college.edu',
    password: 'Organizer@12345',
    role: 'organizer',
    phone: '+1 555-0202',
    company: 'ACM Student Chapter',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300'
  });

  // 4. Seed Core Platform Settings
  await query(
    `INSERT INTO platform_settings (key, value, description)
     VALUES ('commission_policy', '{"default_rate_percent": 15.0, "instant_payout_enabled": true, "min_payout_inr": 1000}', 'Platform commission and settlement policy')
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`
  );

  // 5. Seed Sample Contracts for CLM
  const existingContracts = await query('SELECT count(*) FROM contracts');
  if (parseInt(existingContracts.rows[0].count, 10) === 0) {
    const msaId = crypto.randomUUID();
    const ndaId = crypto.randomUUID();
    const leaseId = crypto.randomUUID();

    // Contract 1: Active MSA
    await query(
      `INSERT INTO contracts (
        id, contract_ref, title, contract_type, organization_id, owner_id, status,
        current_version, content_text, effective_date, expiration_date, contract_value,
        ai_risk_score, ai_summary, ai_risk_flags, ai_clause_suggestions
      ) VALUES ($1, 'CLM-2026-001', 'Master Cloud & SaaS Services Agreement (MSA)', 'service', $2, $2, 'active', 2, $3, '2026-01-15', '2027-01-14', 1850000.00, 24, $4, $5, $6)`,
      [
        msaId,
        businessId,
        `MASTER SERVICES AGREEMENT\n\nThis Master Cloud & Software Services Agreement ("Agreement") is made effective as of January 15, 2026, by and between Apex Dynamics Technologies Pvt. Ltd. ("Customer") and CloudScale Infrastructure Ltd. ("Provider").\n\n1. SCOPE OF SERVICES: Provider shall provide 99.9% uptime for cloud infrastructure and SaaS database clusters.\n\n2. PAYMENT TERMS: Payments shall be made within 30 days of invoice receipt.\n\n3. LIMITATION OF LIABILITY: Neither party shall be liable for indirect, punitive, or consequential damages. Aggregate liability is capped at 12 months fees paid.\n\n4. CONFIDENTIALITY: Both parties agree to protect proprietary technical data with reasonable care.\n\n5. GOVERNING LAW: This Agreement shall be governed by the laws of India and jurisdiction of Courts at Bengaluru.`,
        'High-compliance commercial agreement. Balanced liability cap (12 months), standard 30-day payment term, standard uptime SLA of 99.9%. Low overall business risk.',
        JSON.stringify([
          { severity: 'low', clause: 'Limitation of Liability', detail: 'Consequential damages mutual exclusion in line with industry standards.' },
          { severity: 'info', clause: 'Governing Law', detail: 'Jurisdiction placed exclusively at Bengaluru.' }
        ]),
        JSON.stringify([
          { clause: 'SLA Credit Penalty', suggestion: 'Add financial refund credits of 5% for every 0.1% uptime dip below 99.5%.' }
        ])
      ]
    );

    // Contract 2: Bilateral NDA in Review with AI Red Flags
    await query(
      `INSERT INTO contracts (
        id, contract_ref, title, contract_type, organization_id, owner_id, status,
        current_version, content_text, effective_date, expiration_date, contract_value,
        ai_risk_score, ai_summary, ai_risk_flags, ai_clause_suggestions
      ) VALUES ($1, 'CLM-2026-002', 'Bilateral Mutual Non-Disclosure Agreement (NDA)', 'nda', $2, $2, 'in_review', 1, $3, '2026-10-01', '2028-10-01', 0.00, 68, $4, $5, $6)`,
      [
        ndaId,
        businessId,
        `MUTUAL NON-DISCLOSURE AGREEMENT\n\nBetween Apex Dynamics Technologies Pvt. Ltd. and Quantum Edge Innovations Ltd.\n\n1. OBLIGATIONS: The Receiving Party shall hold all Disclosing Party data in strict perpetual confidence without exception.\n\n2. INDEMNITY: Receiving Party unconditionally agrees to indemnify Disclosing Party against ANY loss, legal claim, or dispute arising from discussion, without financial limitation.\n\n3. NON-SOLICITATION: Receiving Party agrees not to hire, solicit, or engage any employee or contractor of Disclosing Party for a period of 5 years.\n\n4. REMEDIES: Disclosing Party may seek ex-parte injunctions without requiring bond or proof of irreparable harm.`,
        'High-risk contract draft. Contains perpetual confidentiality obligation, uncapped unilateral indemnity for simple discussion breach, and an overly restrictive 5-year non-solicitation clause.',
        JSON.stringify([
          { severity: 'high', clause: 'Section 2: Uncapped Indemnity', detail: 'Uncapped unilateral indemnification in an informational NDA is unreasonable and exposes the company to extreme liabilities.' },
          { severity: 'high', clause: 'Section 3: 5-Year Non-Solicitation', detail: 'Section 27 Indian Contract Act restricts restraint of trade; 5 years is excessive and likely unenforceable or hazardous.' },
          { severity: 'medium', clause: 'Section 1: Perpetual Confidentiality', detail: 'Standard commercial practice is 2-3 years survival for non-trade secret disclosures.' }
        ]),
        JSON.stringify([
          { clause: 'Indemnity Clause', suggestion: 'Delete Section 2 entirely. NDAs do not customarily carry indemnification provisions.' },
          { clause: 'Non-Solicitation', suggestion: 'Reduce duration from 5 years to 1 year and restrict only to key personnel actively engaged in project.' },
          { clause: 'Confidentiality Term', suggestion: 'Add standard 3-year expiration term from date of disclosure.' }
        ])
      ]
    );

    // Contract 3: Real Estate Lease
    await query(
      `INSERT INTO contracts (
        id, contract_ref, title, contract_type, organization_id, owner_id, status,
        current_version, content_text, effective_date, expiration_date, contract_value,
        ai_risk_score, ai_summary, ai_risk_flags, ai_clause_suggestions
      ) VALUES ($1, 'CLM-2026-003', 'Commercial Office Space Lease & License Agreement', 'lease', $2, $2, 'draft', 1, $3, '2026-11-01', '2029-10-31', 4200000.00, 38, $4, $5, $6)`,
      [
        leaseId,
        businessId,
        `COMMERCIAL LEASE & LICENSE AGREEMENT\n\nPremises: 4th Floor, Tech Park One, Whitefield, Bengaluru.\nMonthly Rent: ₹3,50,000.\nSecurity Deposit: 6 Months rent.\nLock-in Period: 24 Months.\nMaintenance & Electricity: Tenant responsibility.`,
        'Commercial lease draft. Lock-in period of 24 months requires close scrutiny before execution.',
        JSON.stringify([
          { severity: 'medium', clause: 'Lock-in Period', detail: '24-month lock-in carries early termination fee equivalent to remaining rent.' }
        ]),
        JSON.stringify([
          { clause: 'Force Majeure', suggestion: 'Insert comprehensive clause covering pandemic, government shutdown, and structural defects.' }
        ])
      ]
    );
  }

  console.log('[Seed] JurisFlow core system accounts, platform settings, and CLM contracts synchronized successfully.');
  return { adminId, clientId, businessId };
};

export const seedDatabase = async () => {
  try {
    await initSchema();
    return await ensureDemoAccounts();
  } catch (err) {
    console.error('[Seed] Error during JurisFlow initialization:', err.message);
  }
};

if (process.argv.includes('--seed-demo')) {
  seedDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
}
