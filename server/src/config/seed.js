import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { query, isDatabaseConnected, initSchema } from './db.js';

dotenv.config();

/**
 * Idempotently seed and ensure ContractIQ accounts and initial ecosystem data
 */
export const ensureDemoAccounts = async () => {
  const salt = await bcrypt.genSalt(10);
  const defaultPassword = 'Password@12345';
  const hashedDefault = await bcrypt.hash(defaultPassword, salt);

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
    return userId;
  };

  // Helper to get or insert lawyer profile
  const ensureLawyerProfile = async ({
    userId,
    fullName,
    headline,
    primarySpecialty,
    additionalSpecialties,
    experienceYears,
    barNumber,
    barState,
    languages,
    fees,
    modes,
    rating,
    reviewCount,
    consultationsCount,
    bio,
    city,
    state,
    isVerified = true
  }) => {
    const existing = await query('SELECT id FROM lawyer_profiles WHERE user_id = $1', [userId]);
    if (existing.rows.length > 0) {
      return existing.rows[0].id;
    }
    const profileId = crypto.randomUUID();
    await query(
      `INSERT INTO lawyer_profiles (
        id, user_id, full_name, headline, primary_specialty, additional_specialties,
        experience_years, bar_council_number, bar_state, languages, education,
        consultation_fee_15, consultation_fee_30, consultation_fee_60, consultation_modes,
        is_instant_booking, is_verified, verification_status, rating_avg, rating_count,
        total_consultations, bio, city, state, bank_account_number, bank_ifsc, bank_holder_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, true, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)`,
      [
        profileId,
        userId,
        fullName,
        headline,
        primarySpecialty,
        JSON.stringify(additionalSpecialties || []),
        experienceYears,
        barNumber,
        barState,
        JSON.stringify(languages || ['English', 'Hindi']),
        JSON.stringify([
          { degree: 'LL.B (Hons)', university: 'National Law School of India University', year: 2014 },
          { degree: 'LL.M in Commercial Law', university: 'Faculty of Law, University of Delhi', year: 2016 }
        ]),
        fees?.fee15 || 499.0,
        fees?.fee30 || 899.0,
        fees?.fee60 || 1499.0,
        JSON.stringify(modes || ['chat', 'audio', 'video']),
        isVerified,
        isVerified ? 'verified' : 'pending',
        rating || 4.9,
        reviewCount || 18,
        consultationsCount || 34,
        bio,
        city || 'New Delhi',
        state || 'Delhi',
        '98765432101234',
        'HDFC0001234',
        fullName
      ]
    );

    // Seed default availability (Mon - Sat, 9am - 6pm)
    for (let day = 1; day <= 6; day++) {
      await query(
        `INSERT INTO availability_schedules (id, lawyer_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active)
         VALUES ($1, $2, $3, '09:00', '18:00', 30, true)
         ON CONFLICT DO NOTHING`,
        [crypto.randomUUID(), profileId, day]
      );
    }

    return profileId;
  };

  // 1. Super Admin
  const adminId = await ensureUser({
    name: 'Chief Legal Officer (Admin)',
    email: 'admin@contractiq.com',
    password: 'Admin@12345',
    role: 'admin',
    phone: '+91 99000 11223',
    company: 'ContractIQ Legal Governance',
    city: 'New Delhi',
    state: 'Delhi',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    bio: 'Oversees platform advocate verification, commission distribution, compliance auditing, and disputes.'
  });

  // Also support legacy admin email if set in .env
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL !== 'admin@contractiq.com') {
    await ensureUser({
      name: process.env.ADMIN_NAME || 'Campus Administrator',
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD || 'Admin@12345',
      role: 'admin',
      phone: '+1 555-0199',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300'
    });
  }

  // 2. Individual Client
  const clientId = await ensureUser({
    name: 'Rahul Sharma',
    email: 'client@contractiq.com',
    password: 'Client@12345',
    role: 'client',
    phone: '+91 98111 22334',
    city: 'New Delhi',
    state: 'Delhi',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
    bio: 'Individual professional seeking contract review and legal counsel for intellectual property and employment disputes.'
  });

  // 3. Business / Enterprise Client
  const businessId = await ensureUser({
    name: 'Vikram Singhania',
    email: 'business@contractiq.com',
    password: 'Business@12345',
    role: 'business',
    company: 'Apex Dynamics Technologies Pvt. Ltd.',
    phone: '+91 98222 33445',
    city: 'Bengaluru',
    state: 'Karnataka',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300',
    bio: 'Head of Legal & Operations at Apex Dynamics. Managing 120+ vendor contracts, SaaS licensing agreements, and employment compliance.'
  });

  // 4. Advocates across major specialties
  // Advocate 1: Criminal Defense & Bail
  const crimLawyerUserId = await ensureUser({
    name: 'Adv. Vikramaditya Deshmukh',
    email: 'criminal.law@contractiq.com',
    password: 'Lawyer@12345',
    role: 'lawyer',
    phone: '+91 98333 44556',
    city: 'New Delhi',
    state: 'Delhi',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300',
    bio: 'Senior Criminal Defense Advocate with 14+ years appearing before High Courts and Supreme Court of India. Specialist in Bail, Section 482 CrPC quashing, Economic Offences, and FIR defense.'
  });
  const crimLawyerProfileId = await ensureLawyerProfile({
    userId: crimLawyerUserId,
    fullName: 'Adv. Vikramaditya Deshmukh',
    headline: 'Senior Criminal Defense & Bail Specialist | High Court of Delhi',
    primarySpecialty: 'Criminal Lawyer',
    additionalSpecialties: ['Civil Litigation Lawyer', 'Cybercrime and Technology Lawyer'],
    experienceYears: 14,
    barNumber: 'D/1842/2012',
    barState: 'Bar Council of Delhi',
    languages: ['English', 'Hindi', 'Marathi'],
    fees: { fee15: 699, fee30: 1299, fee60: 2499 },
    rating: 4.95,
    reviewCount: 48,
    consultationsCount: 112,
    bio: 'Distinguished criminal litigation counsel focusing on white-collar crime, bail applications under Section 437/439 CrPC, anticipatory bail, and Section 138 NI Act proceedings.',
    city: 'New Delhi',
    state: 'Delhi'
  });

  // Advocate 2: Corporate & Commercial Law
  const corpLawyerUserId = await ensureUser({
    name: 'Adv. Ananya Roy',
    email: 'corporate.law@contractiq.com',
    password: 'Lawyer@12345',
    role: 'lawyer',
    phone: '+91 98444 55667',
    city: 'Mumbai',
    state: 'Maharashtra',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
    bio: 'Corporate M&A, Venture Capital, and Commercial Contracts counsel. Advised 40+ startups on seed-to-Series B funding rounds and cross-border commercial licensing.'
  });
  const corpLawyerProfileId = await ensureLawyerProfile({
    userId: corpLawyerUserId,
    fullName: 'Adv. Ananya Roy',
    headline: 'Corporate Counsel | M&A, VC Deals & Cross-Border Commercial Contracts',
    primarySpecialty: 'Corporate and Commercial Lawyer',
    additionalSpecialties: ['Contract Lawyer', 'Banking and Financial Lawyer'],
    experienceYears: 10,
    barNumber: 'MAH/2941/2016',
    barState: 'Bar Council of Maharashtra & Goa',
    languages: ['English', 'Hindi', 'Bengali'],
    fees: { fee15: 799, fee30: 1499, fee60: 2799 },
    rating: 4.92,
    reviewCount: 39,
    consultationsCount: 86,
    bio: 'Expert in commercial joint ventures, shareholder agreements, founder vesting, corporate restructuring, and international commercial arbitration.',
    city: 'Mumbai',
    state: 'Maharashtra'
  });

  // Advocate 3: Contract Specialist Lawyer
  const contractLawyerUserId = await ensureUser({
    name: 'Adv. Siddharth Malhotra',
    email: 'contract.law@contractiq.com',
    password: 'Lawyer@12345',
    role: 'lawyer',
    phone: '+91 98555 66778',
    city: 'Bengaluru',
    state: 'Karnataka',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=300',
    bio: 'Dedicated Contract Drafting, Tech Licensing, and SLA Negotiations Specialist. Reviewed 1,200+ Master Services Agreements (MSAs), SaaS terms, and Non-Disclosure Agreements.'
  });
  const contractLawyerProfileId = await ensureLawyerProfile({
    userId: contractLawyerUserId,
    fullName: 'Adv. Siddharth Malhotra',
    headline: 'CLM & Tech Contracts Specialist | SLA, SaaS & Data Licensing Counsel',
    primarySpecialty: 'Contract Lawyer',
    additionalSpecialties: ['Intellectual Property Lawyer', 'Corporate and Commercial Lawyer'],
    experienceYears: 8,
    barNumber: 'KAR/1109/2018',
    barState: 'Bar Council of Karnataka',
    languages: ['English', 'Hindi', 'Kannada'],
    fees: { fee15: 499, fee30: 999, fee60: 1799 },
    rating: 4.88,
    reviewCount: 52,
    consultationsCount: 140,
    bio: 'Specialist in rapid contract redlining, indemnification risk mitigation, limitation of liability capping, and tech vendor negotiation.',
    city: 'Bengaluru',
    state: 'Karnataka'
  });

  // Advocate 4: Family & Matrimonial
  const familyLawyerUserId = await ensureUser({
    name: 'Adv. Meenakshi Sundaram',
    email: 'family.law@contractiq.com',
    password: 'Lawyer@12345',
    role: 'lawyer',
    phone: '+91 98666 77889',
    city: 'Chennai',
    state: 'Tamil Nadu',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300',
    bio: 'Senior Matrimonial & Family Dispute Mediation Counsel. Compassionate, confidential legal guidance for mutual divorce, custody, and inheritance.'
  });
  await ensureLawyerProfile({
    userId: familyLawyerUserId,
    fullName: 'Adv. Meenakshi Sundaram',
    headline: 'Family Law & Mediation Specialist | Matrimonial, Custody & Succession',
    primarySpecialty: 'Family and Divorce Lawyer',
    additionalSpecialties: ['Civil Litigation Lawyer'],
    experienceYears: 16,
    barNumber: 'TN/3401/2010',
    barState: 'Bar Council of Tamil Nadu & Puducherry',
    languages: ['English', 'Tamil', 'Telugu'],
    fees: { fee15: 599, fee30: 1099, fee60: 1999 },
    rating: 4.96,
    reviewCount: 64,
    consultationsCount: 175,
    bio: 'Trained mediator focusing on amicable settlement of marital disputes, child custody agreements, maintenance under Section 125 CrPC, and Hindu Succession Act.',
    city: 'Chennai',
    state: 'Tamil Nadu'
  });

  // Advocate 5: Property & Real Estate
  const propLawyerUserId = await ensureUser({
    name: 'Adv. Rajeshwar Verma',
    email: 'property.law@contractiq.com',
    password: 'Lawyer@12345',
    role: 'lawyer',
    phone: '+91 98777 88990',
    city: 'Hyderabad',
    state: 'Telangana',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300',
    bio: 'Real Estate Due Diligence, RERA Litigation, and Title Deed Verification Counsel. 12+ years verifying agricultural, commercial, and residential plots.'
  });
  await ensureLawyerProfile({
    userId: propLawyerUserId,
    fullName: 'Adv. Rajeshwar Verma',
    headline: 'Real Estate & Title Verification Counsel | RERA, Conveyancing & Land Disputes',
    primarySpecialty: 'Property and Real Estate Lawyer',
    additionalSpecialties: ['Civil Litigation Lawyer', 'Banking and Financial Lawyer'],
    experienceYears: 12,
    barNumber: 'TS/2190/2014',
    barState: 'Bar Council of Telangana',
    languages: ['English', 'Hindi', 'Telugu'],
    fees: { fee15: 599, fee30: 1199, fee60: 2199 },
    rating: 4.91,
    reviewCount: 31,
    consultationsCount: 78,
    bio: 'Expert in 30-year title search reports, sale deed drafting, builder-buyer disputes under RERA, partition suits, and mutation proceedings.',
    city: 'Hyderabad',
    state: 'Telangana'
  });

  // Advocate 6: Cybercrime & Technology Law
  const cyberLawyerUserId = await ensureUser({
    name: 'Adv. Rohan Menon',
    email: 'cyber.law@contractiq.com',
    password: 'Lawyer@12345',
    role: 'lawyer',
    phone: '+91 98888 99001',
    city: 'Gurugram',
    state: 'Haryana',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=300',
    bio: 'Cyber Law & Data Privacy (DPDP Act) Attorney. Certified Information Privacy Professional (CIPP/A) advising on cyber frauds, data breaches, and IT Act.'
  });
  await ensureLawyerProfile({
    userId: cyberLawyerUserId,
    fullName: 'Adv. Rohan Menon',
    headline: 'Cybercrime, IT Act & DPDP Compliance Counsel | High Court & Appellate Tribunals',
    primarySpecialty: 'Cybercrime and Technology Lawyer',
    additionalSpecialties: ['Intellectual Property Lawyer', 'Criminal Lawyer'],
    experienceYears: 9,
    barNumber: 'PH/1908/2017',
    barState: 'Bar Council of Punjab & Haryana',
    languages: ['English', 'Hindi', 'Malayalam'],
    fees: { fee15: 699, fee30: 1299, fee60: 2399 },
    rating: 4.93,
    reviewCount: 27,
    consultationsCount: 65,
    bio: 'Specialist in Section 43/66 IT Act offences, online identity theft, cryptocurrency disputes, financial cyber frauds, and Digital Personal Data Protection Act compliance.',
    city: 'Gurugram',
    state: 'Haryana'
  });

  // Advocate 7: Tax & GST Lawyer
  const taxLawyerUserId = await ensureUser({
    name: 'Adv. Harish Chawla',
    email: 'tax.law@contractiq.com',
    password: 'Lawyer@12345',
    role: 'lawyer',
    phone: '+91 98999 00112',
    city: 'Kolkata',
    state: 'West Bengal',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=300',
    bio: 'Chartered Advocate focusing on Direct & Indirect Taxation, GST dispute resolution, Transfer Pricing, and Customs appeals.'
  });
  await ensureLawyerProfile({
    userId: taxLawyerUserId,
    fullName: 'Adv. Harish Chawla',
    headline: 'Tax & GST Litigation Specialist | ITAT, GST Appellate Authority & High Court',
    primarySpecialty: 'Tax and GST Lawyer',
    additionalSpecialties: ['Corporate and Commercial Lawyer'],
    experienceYears: 18,
    barNumber: 'WB/982/2008',
    barState: 'Bar Council of West Bengal',
    languages: ['English', 'Hindi', 'Bengali'],
    fees: { fee15: 799, fee30: 1599, fee60: 2999 },
    rating: 4.89,
    reviewCount: 35,
    consultationsCount: 92,
    bio: 'Specialist in show-cause notice responses, GST scrutiny audits, search & seizure defense, and Section 148 re-assessment proceedings.',
    city: 'Kolkata',
    state: 'West Bengal'
  });

  // Advocate 8: Intellectual Property Lawyer
  const ipLawyerUserId = await ensureUser({
    name: 'Adv. Neha Kapoor',
    email: 'ip.law@contractiq.com',
    password: 'Lawyer@12345',
    role: 'lawyer',
    phone: '+91 98123 45678',
    city: 'Pune',
    state: 'Maharashtra',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
    bio: 'IP Litigation & Trademark Specialist. Represented technology startups and FMCG giants in brand protection, patent opposition, and trade secret actions.'
  });
  await ensureLawyerProfile({
    userId: ipLawyerUserId,
    fullName: 'Adv. Neha Kapoor',
    headline: 'Intellectual Property Specialist | Trademarks, Patents & Copyright Litigation',
    primarySpecialty: 'Intellectual Property Lawyer',
    additionalSpecialties: ['Contract Lawyer', 'Cybercrime and Technology Lawyer'],
    experienceYears: 11,
    barNumber: 'MAH/5623/2015',
    barState: 'Bar Council of Maharashtra & Goa',
    languages: ['English', 'Hindi', 'Marathi'],
    fees: { fee15: 699, fee30: 1299, fee60: 2499 },
    rating: 4.94,
    reviewCount: 41,
    consultationsCount: 98,
    bio: 'Trademark Registry appeals, cease-and-desist notices, software copyright licensing, patent drafting, and passing-off injunctions.',
    city: 'Pune',
    state: 'Maharashtra'
  });

  // 5. Seed Core Platform Settings
  await query(
    `INSERT INTO platform_settings (key, value, description)
     VALUES ('commission_policy', '{"default_rate_percent": 15.0, "instant_payout_enabled": true, "min_payout_inr": 1000}', 'Platform commission and settlement policy')
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`
  );

  // 6. Seed Sample Contracts for CLM
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

    // Share NDA with Contract Lawyer for Review
    await query(
      `INSERT INTO shared_document_permissions (id, resource_type, resource_id, granted_by, granted_to_lawyer_id, permission_level, purpose, expires_at)
       VALUES ($1, 'contract', $2, $3, $4, 'review', 'Urgent advocate review of red-flagged indemnity and non-solicitation clauses prior to vendor signature.', NOW() + INTERVAL '14 days')`,
      [crypto.randomUUID(), ndaId, businessId, contractLawyerUserId]
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

  // 7. Seed Sample Consultation Bookings (Astrotalk-style)
  const existingBookings = await query('SELECT count(*) FROM consultation_bookings');
  if (parseInt(existingBookings.rows[0].count, 10) === 0) {
    const booking1Id = crypto.randomUUID();
    const booking2Id = crypto.randomUUID();
    const booking3Id = crypto.randomUUID();

    // Booking 1: Confirmed Video Consultation with Criminal Lawyer
    await query(
      `INSERT INTO consultation_bookings (
        id, booking_ref, client_id, lawyer_id, practice_area, consultation_mode,
        duration_minutes, scheduled_start, scheduled_end, fee_amount, currency,
        payment_status, status, legal_issue_description, urgency, meeting_room_id
      ) VALUES (
        $1, 'CIQ-2026-8812', $2, $3, 'Criminal Lawyer', 'video', 30,
        NOW() + INTERVAL '2 hours', NOW() + INTERVAL '2 hours 30 minutes', 1299.00, 'INR',
        'paid', 'confirmed',
        'Need legal advice regarding an anticipated false FIR under Section 420 IPC filed by an aggrieved business partner. Require urgent pre-arrest bail strategy.',
        'high', 'room_ciq_8812_crim'
      )`,
      [booking1Id, clientId, crimLawyerProfileId]
    );

    // Chat conversation for Booking 1
    const conv1Id = crypto.randomUUID();
    await query(`INSERT INTO conversations (id, booking_id, client_id, lawyer_id) VALUES ($1, $2, $3, $4)`, [
      conv1Id,
      booking1Id,
      clientId,
      crimLawyerUserId
    ]);
    await query(
      `INSERT INTO messages (id, conversation_id, booking_id, sender_id, recipient_id, content, message_type)
       VALUES
       ($1, $2, $3, $4, $5, 'Hello Advocate Deshmukh, I have uploaded the complaint notice and bank transaction receipts. Looking forward to our video session.', 'text'),
       ($6, $2, $3, $5, $4, 'Hello Rahul. I have reviewed the complaint copy. Do not panic. We will discuss the Sections 438 CrPC anticipatory bail petition and case law during our call.', 'text')`,
      [
        crypto.randomUUID(),
        conv1Id,
        booking1Id,
        clientId,
        crimLawyerUserId,
        crypto.randomUUID()
      ]
    );

    // Booking 2: Pending Consultation Request for Corporate Lawyer
    await query(
      `INSERT INTO consultation_bookings (
        id, booking_ref, client_id, lawyer_id, practice_area, consultation_mode,
        duration_minutes, scheduled_start, scheduled_end, fee_amount, currency,
        payment_status, status, legal_issue_description, urgency
      ) VALUES (
        $1, 'CIQ-2026-9041', $2, $3, 'Corporate and Commercial Lawyer', 'video', 60,
        NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 1 hour', 2799.00, 'INR',
        'paid', 'pending',
        'We are preparing for a USD 1.2M seed round. Need guidance on term sheet clauses including liquidation preference, anti-dilution, and board seat composition.',
        'medium'
      )`,
      [booking2Id, businessId, corpLawyerProfileId]
    );

    // Booking 3: Completed Consultation with Contract Lawyer & Review
    await query(
      `INSERT INTO consultation_bookings (
        id, booking_ref, client_id, lawyer_id, practice_area, consultation_mode,
        duration_minutes, scheduled_start, scheduled_end, fee_amount, currency,
        payment_status, status, legal_issue_description, urgency, lawyer_notes, completed_at
      ) VALUES (
        $1, 'CIQ-2026-7643', $2, $3, 'Contract Lawyer', 'chat', 30,
        NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '30 minutes', 999.00, 'INR',
        'paid', 'completed',
        'Review of software vendor master service agreement SLA terms and payment withholding rights.',
        'medium',
        'Advised client to limit client audit rights to once per calendar year and insert standard 30-day cure period for material breach.',
        NOW() - INTERVAL '2 days' + INTERVAL '30 minutes'
      )`,
      [booking3Id, clientId, contractLawyerProfileId]
    );

    // Client Review for Booking 3
    await query(
      `INSERT INTO client_reviews (id, booking_id, client_id, lawyer_id, rating, review_text, tags)
       VALUES ($1, $2, $3, $4, 5, 'Advocate Malhotra gave outstanding and pragmatic clause recommendations in 30 minutes! Saved our company from a huge indemnification risk. Highly recommended!', '["Contract Expert", "Quick Turnaround", "Clear Communication"]'::jsonb)`,
      [crypto.randomUUID(), booking3Id, clientId, contractLawyerProfileId]
    );
  }

  // 8. Seed Legal Cases
  const existingCases = await query('SELECT count(*) FROM legal_cases');
  if (parseInt(existingCases.rows[0].count, 10) === 0) {
    const case1Id = crypto.randomUUID();
    const case2Id = crypto.randomUUID();

    // Criminal Case
    await query(
      `INSERT INTO legal_cases (
        id, case_ref, title, practice_area, client_id, assigned_lawyer_id, status, priority,
        court_name, case_number, next_hearing_date, summary, chronology, private_lawyer_notes
      ) VALUES (
        $1, 'CASE-2026-104', 'Anticipatory Bail Matter u/S 438 CrPC - FIR No. 142/2026', 'Criminal Lawyer',
        $2, $3, 'active_matter', 'high', 'Sessions Court, Patiala House, New Delhi', 'BAIL-APPL/419/2026',
        CURRENT_DATE + 5,
        'Application for anticipatory bail arising out of commercial dispute misrepresented as Section 406/420 IPC offence.',
        $4, $5
      )`,
      [
        case1Id,
        clientId,
        crimLawyerProfileId,
        JSON.stringify([
          { date: '2026-10-18', event: 'Police notice received under Section 41A CrPC.' },
          { date: '2026-10-21', event: 'Consultation conducted on ContractIQ; bail strategy finalized.' },
          { date: '2026-10-24', event: 'Anticipatory bail petition filed before Sessions Judge.' }
        ]),
        'Petitioner has clean antecedent record. Bank statements show legitimate contractual settlement.'
      ]
    );

    // Property Dispute Case
    await query(
      `INSERT INTO legal_cases (
        id, case_ref, title, practice_area, client_id, assigned_lawyer_id, status, priority,
        court_name, case_number, next_hearing_date, summary, chronology
      ) VALUES (
        $1, 'CASE-2026-105', 'Title Due Diligence & RERA Redressal - Commercial Unit 302', 'Property and Real Estate Lawyer',
        $2, $3, 'enquiry', 'medium', 'Telangana Real Estate Regulatory Authority (TGRERA)', 'COMP/RERA/782/2026',
        CURRENT_DATE + 12,
        'Delay in possession of commercial IT space and investigation of encumbrance certificate discrepancies.',
        $4
      )`,
      [
        case2Id,
        businessId,
        crimLawyerProfileId,
        JSON.stringify([
          { date: '2026-10-12', event: 'Initial developer demand notice received.' },
          { date: '2026-10-20', event: 'Title investigation initiated.' }
        ])
      ]
    );
  }

  // 9. Seed Legal Services Marketplace Offerings
  const existingServices = await query('SELECT count(*) FROM legal_services');
  if (parseInt(existingServices.rows[0].count, 10) === 0) {
    const services = [
      {
        lawyerId: contractLawyerProfileId,
        title: 'Non-Disclosure Agreement (NDA) Comprehensive Review & Redlining',
        category: 'Contract Review',
        description: 'In-depth clause-by-clause analysis of NDA terms, capping indemnities, limiting confidentiality duration, and ensuring mutual protection.',
        deliverables: ['Redlined DOCX file with tracked changes', 'Executive Risk Summary PDF', '30-minute explanation call'],
        price: 999.0,
        days: 1
      },
      {
        lawyerId: corpLawyerProfileId,
        title: 'Employment Agreement & Founder Vesting Policy Drafting',
        category: 'Corporate Drafting',
        description: 'Complete bespoke drafting of employment contracts, IP assignment deed, non-compete within legal limits, and 4-year founder vesting schedule.',
        deliverables: ['Custom Employment Agreement Template', 'IP Assignment Deed', 'ESOP / Vesting Summary'],
        price: 2999.0,
        days: 2
      },
      {
        lawyerId: crimLawyerProfileId,
        title: 'Legal Notice Response & Section 138 Cheque Bounce Defense Strategy',
        category: 'Litigation Notice',
        description: 'Detailed reply to statutory legal demand notices and strategic defense formulation before magistrate court.',
        deliverables: ['Formal Legal Notice Reply on Advocate Letterhead', 'Dispatch Tracking & Affidavit Proof'],
        price: 1899.0,
        days: 2
      }
    ];

    for (const s of services) {
      await query(
        `INSERT INTO legal_services (id, lawyer_id, title, category, description, deliverables, price_amount, estimated_turnaround_days, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
        [
          crypto.randomUUID(),
          s.lawyerId,
          s.title,
          s.category,
          s.description,
          JSON.stringify(s.deliverables),
          s.price,
          s.days
        ]
      );
    }
  }

  // 10. Seed Sample Financial Transactions & Ledger
  const existingEarnings = await query('SELECT count(*) FROM lawyer_earnings');
  if (parseInt(existingEarnings.rows[0].count, 10) === 0) {
    const orderId = crypto.randomUUID();
    const txnId = crypto.randomUUID();

    // Payment Order
    await query(
      `INSERT INTO payment_orders (id, order_ref, razorpay_order_id, user_id, amount_paise, currency, status, receipt_number)
       VALUES ($1, 'ORD-2026-001', 'order_ciq_demo_99182', $2, 99900, 'INR', 'paid', 'RCPT-2026-001')`,
      [orderId, clientId]
    );

    // Payment Transaction
    await query(
      `INSERT INTO payment_transactions (id, transaction_ref, order_id, razorpay_payment_id, razorpay_signature, amount_paise, status, payment_method)
       VALUES ($1, 'TXN-2026-001', $2, 'pay_ciq_demo_88721', 'sig_demo_hash_verified', 99900, 'success', 'upi')`,
      [txnId, orderId]
    );

    // Commission Ledger (15% platform fee)
    await query(
      `INSERT INTO commission_ledgers (id, transaction_id, gross_amount, commission_rate, platform_fee, lawyer_net_amount, status)
       VALUES ($1, $2, 999.00, 15.00, 149.85, 849.15, 'credited')`,
      [crypto.randomUUID(), txnId]
    );

    // Lawyer Earnings
    await query(
      `INSERT INTO lawyer_earnings (id, lawyer_id, transaction_id, gross_amount, platform_commission, net_earnings, description, status)
       VALUES ($1, $2, $3, 999.00, 149.85, 849.15, 'Consultation fee for Booking CIQ-2026-7643', 'available')`,
      [crypto.randomUUID(), contractLawyerProfileId, txnId]
    );
  }

  console.log('[Seed] ContractIQ multi-role personas, advocates, CLM contracts, cases, and ledgers synchronized successfully.');
  return { adminId, clientId, businessId };
};

export const seedDatabase = async () => {
  try {
    await initSchema();
    return await ensureDemoAccounts();
  } catch (err) {
    console.error('[Seed] Error during ContractIQ initialization:', err.message);
  }
};

if (process.argv.includes('--seed-demo')) {
  seedDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
}
