-- ContractIQ & Enterprise Legal Ecosystem Database Schema
-- Compatible with PostgreSQL 14+, Supabase, Neon PostgreSQL, and local pg-mem engine

-- 1. Profiles (Unified User Profile synced with auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(36) PRIMARY KEY,
  auth_user_id VARCHAR(36) UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  role VARCHAR(30) NOT NULL CHECK (role IN ('client', 'lawyer', 'business', 'admin', 'legal', 'sales', 'finance', 'procurement', 'hr', 'student', 'organizer')) DEFAULT 'client',
  phone VARCHAR(30) DEFAULT '',
  avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
  bio TEXT DEFAULT '',
  company_name VARCHAR(150) DEFAULT '',
  department VARCHAR(100) DEFAULT 'General',
  city VARCHAR(100) DEFAULT '',
  state VARCHAR(100) DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Unified Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(30) NOT NULL CHECK (role IN ('client', 'lawyer', 'business', 'admin', 'legal', 'sales', 'finance', 'procurement', 'hr', 'student', 'organizer')) DEFAULT 'client',
  phone VARCHAR(30) DEFAULT '',
  avatar TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
  bio TEXT DEFAULT '',
  company_name VARCHAR(150) DEFAULT '',
  city VARCHAR(100) DEFAULT '',
  state VARCHAR(100) DEFAULT '',
  student_id VARCHAR(50) DEFAULT '',
  employee_id VARCHAR(50) DEFAULT '',
  admin_id VARCHAR(50) DEFAULT '',
  department VARCHAR(100) DEFAULT 'General',
  graduation_year INT DEFAULT 2026,
  interests JSONB DEFAULT '["Technology", "Legal Tech"]',
  organization_name VARCHAR(150) DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. User Roles
CREATE TABLE IF NOT EXISTS user_roles (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(30) NOT NULL,
  permissions JSONB DEFAULT '[]',
  assigned_by VARCHAR(36),
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Lawyer Categories
CREATE TABLE IF NOT EXISTS lawyer_categories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  icon VARCHAR(50) DEFAULT 'Scale',
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Lawyer Professional Profiles
CREATE TABLE IF NOT EXISTS lawyer_profiles (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  headline VARCHAR(255) DEFAULT '',
  primary_specialty VARCHAR(100) NOT NULL,
  additional_specialties JSONB DEFAULT '[]',
  experience_years INT NOT NULL DEFAULT 3,
  bar_council_number VARCHAR(100) DEFAULT '',
  bar_state VARCHAR(100) DEFAULT '',
  languages JSONB DEFAULT '["English", "Hindi"]',
  education JSONB DEFAULT '[]',
  consultation_fee_15 NUMERIC(10, 2) DEFAULT 499.00,
  consultation_fee_30 NUMERIC(10, 2) DEFAULT 899.00,
  consultation_fee_60 NUMERIC(10, 2) DEFAULT 1499.00,
  consultation_modes JSONB DEFAULT '["chat", "audio", "video"]',
  is_instant_booking BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  verification_status VARCHAR(25) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  rating_avg NUMERIC(3, 2) DEFAULT 4.90,
  rating_count INT DEFAULT 12,
  total_consultations INT DEFAULT 15,
  bio TEXT DEFAULT '',
  office_address TEXT DEFAULT '',
  city VARCHAR(100) DEFAULT 'New Delhi',
  state VARCHAR(100) DEFAULT 'Delhi',
  bank_account_number VARCHAR(50) DEFAULT '',
  bank_ifsc VARCHAR(20) DEFAULT '',
  bank_holder_name VARCHAR(100) DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Lawyer Specializations
CREATE TABLE IF NOT EXISTS lawyer_specializations (
  id VARCHAR(36) PRIMARY KEY,
  lawyer_id VARCHAR(36) REFERENCES lawyer_profiles(id) ON DELETE CASCADE,
  category_name VARCHAR(100) NOT NULL,
  sub_specialty VARCHAR(100) DEFAULT '',
  years_practicing INT DEFAULT 1,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Lawyer Documents
CREATE TABLE IF NOT EXISTS lawyer_documents (
  id VARCHAR(36) PRIMARY KEY,
  lawyer_id VARCHAR(36) REFERENCES lawyer_profiles(id) ON DELETE CASCADE,
  doc_type VARCHAR(50) NOT NULL CHECK (doc_type IN ('bar_certificate', 'id_proof', 'degree', 'practice_license', 'other')),
  title VARCHAR(200) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  mime_type VARCHAR(100) DEFAULT 'application/pdf',
  verification_status VARCHAR(25) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Lawyer Verifications
CREATE TABLE IF NOT EXISTS lawyer_verifications (
  id VARCHAR(36) PRIMARY KEY,
  lawyer_id VARCHAR(36) REFERENCES lawyer_profiles(id) ON DELETE CASCADE,
  user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  bar_registration_number VARCHAR(100) NOT NULL,
  bar_council_state VARCHAR(100) NOT NULL,
  enrollment_year INT NOT NULL,
  id_proof_url TEXT DEFAULT '',
  bar_certificate_url TEXT DEFAULT '',
  status VARCHAR(25) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'more_info_needed')),
  admin_notes TEXT DEFAULT '',
  reviewed_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Availability Schedules & Lawyer Availability
CREATE TABLE IF NOT EXISTS availability_schedules (
  id VARCHAR(36) PRIMARY KEY,
  lawyer_id VARCHAR(36) REFERENCES lawyer_profiles(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time VARCHAR(10) NOT NULL DEFAULT '09:00',
  end_time VARCHAR(10) NOT NULL DEFAULT '18:00',
  is_active BOOLEAN DEFAULT true,
  slot_duration_minutes INT DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lawyer_availability (
  id VARCHAR(36) PRIMARY KEY,
  lawyer_id VARCHAR(36) REFERENCES lawyer_profiles(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time VARCHAR(10) NOT NULL DEFAULT '09:00',
  end_time VARCHAR(10) NOT NULL DEFAULT '18:00',
  is_active BOOLEAN DEFAULT true,
  slot_duration_minutes INT DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Consultation Bookings
CREATE TABLE IF NOT EXISTS consultation_bookings (
  id VARCHAR(36) PRIMARY KEY,
  booking_ref VARCHAR(50) UNIQUE NOT NULL,
  client_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  lawyer_id VARCHAR(36) REFERENCES lawyer_profiles(id) ON DELETE CASCADE,
  practice_area VARCHAR(100) NOT NULL,
  consultation_mode VARCHAR(20) NOT NULL CHECK (consultation_mode IN ('chat', 'audio', 'video', 'in_person')) DEFAULT 'video',
  duration_minutes INT NOT NULL DEFAULT 30,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 899.00,
  currency VARCHAR(10) DEFAULT 'INR',
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  status VARCHAR(25) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  legal_issue_description TEXT NOT NULL,
  urgency VARCHAR(20) DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'emergency')),
  client_documents JSONB DEFAULT '[]',
  meeting_room_id VARCHAR(100) DEFAULT '',
  meeting_credentials JSONB DEFAULT '{}',
  lawyer_notes TEXT DEFAULT '',
  rejection_reason TEXT DEFAULT '',
  cancelled_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  cancellation_reason TEXT DEFAULT '',
  completed_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Consultation Sessions
CREATE TABLE IF NOT EXISTS consultation_sessions (
  id VARCHAR(36) PRIMARY KEY,
  booking_id VARCHAR(36) REFERENCES consultation_bookings(id) ON DELETE CASCADE,
  room_token TEXT DEFAULT '',
  channel_name VARCHAR(100) DEFAULT '',
  session_started_at TIMESTAMPTZ DEFAULT NOW(),
  session_ended_at TIMESTAMPTZ DEFAULT NULL,
  duration_seconds INT DEFAULT 0,
  recording_url TEXT DEFAULT '',
  transcript_url TEXT DEFAULT '',
  quality_rating INT DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Chat Conversations & Real-Time Messaging
CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR(36) PRIMARY KEY,
  booking_id VARCHAR(36) REFERENCES consultation_bookings(id) ON DELETE CASCADE,
  client_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  lawyer_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  id VARCHAR(36) PRIMARY KEY,
  conversation_id VARCHAR(36) REFERENCES conversations(id) ON DELETE CASCADE,
  user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'participant',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(36) PRIMARY KEY,
  conversation_id VARCHAR(36) REFERENCES conversations(id) ON DELETE CASCADE,
  booking_id VARCHAR(36) REFERENCES consultation_bookings(id) ON DELETE CASCADE,
  sender_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  recipient_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'document', 'system', 'audio')),
  attachment_url TEXT DEFAULT '',
  attachment_name VARCHAR(255) DEFAULT '',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Contract Lifecycle Management (CLM)
CREATE TABLE IF NOT EXISTS contracts (
  id VARCHAR(36) PRIMARY KEY,
  contract_ref VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  contract_type VARCHAR(50) NOT NULL,
  organization_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  owner_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(25) NOT NULL CHECK (status IN ('draft', 'in_review', 'approved', 'signed', 'active', 'expired', 'terminated')) DEFAULT 'draft',
  current_version INT NOT NULL DEFAULT 1,
  content_text TEXT NOT NULL,
  file_url TEXT DEFAULT '',
  effective_date DATE DEFAULT NULL,
  expiration_date DATE DEFAULT NULL,
  renewal_notice_days INT DEFAULT 30,
  auto_renew BOOLEAN DEFAULT false,
  contract_value NUMERIC(14, 2) DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'INR',
  ai_risk_score INT DEFAULT NULL,
  ai_summary TEXT DEFAULT '',
  ai_risk_flags JSONB DEFAULT '[]',
  ai_clause_suggestions JSONB DEFAULT '[]',
  ai_analyzed_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contract_parties (
  id VARCHAR(36) PRIMARY KEY,
  contract_id VARCHAR(36) REFERENCES contracts(id) ON DELETE CASCADE,
  party_name VARCHAR(150) NOT NULL,
  party_type VARCHAR(50) DEFAULT 'counterparty' CHECK (party_type IN ('internal', 'client', 'vendor', 'counterparty')),
  contact_email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'reviewer' CHECK (role IN ('drafter', 'reviewer', 'approver', 'signatory', 'viewer')),
  user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contract_versions (
  id VARCHAR(36) PRIMARY KEY,
  contract_id VARCHAR(36) REFERENCES contracts(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  content_text TEXT NOT NULL,
  change_summary TEXT DEFAULT '',
  file_url TEXT DEFAULT '',
  created_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contract_clauses (
  id VARCHAR(36) PRIMARY KEY,
  contract_id VARCHAR(36) REFERENCES contracts(id) ON DELETE CASCADE,
  clause_type VARCHAR(50) NOT NULL,
  clause_title VARCHAR(150) NOT NULL,
  clause_text TEXT NOT NULL,
  standard_language TEXT DEFAULT '',
  risk_level VARCHAR(20) DEFAULT 'low',
  ai_suggestion TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contract_approvals (
  id VARCHAR(36) PRIMARY KEY,
  contract_id VARCHAR(36) REFERENCES contracts(id) ON DELETE CASCADE,
  approver_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  stage_name VARCHAR(100) DEFAULT 'Legal Review',
  sequence_order INT DEFAULT 1,
  status VARCHAR(25) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  comments TEXT DEFAULT '',
  acted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contract_comments (
  id VARCHAR(36) PRIMARY KEY,
  contract_id VARCHAR(36) REFERENCES contracts(id) ON DELETE CASCADE,
  author_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  clause_reference VARCHAR(150) DEFAULT '',
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contract_signatures (
  id VARCHAR(36) PRIMARY KEY,
  contract_id VARCHAR(36) REFERENCES contracts(id) ON DELETE CASCADE,
  signer_name VARCHAR(150) NOT NULL,
  signer_email VARCHAR(255) NOT NULL,
  signer_role VARCHAR(50) DEFAULT 'Party',
  signature_data TEXT DEFAULT '',
  certificate_hash VARCHAR(255) DEFAULT '',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'declined')),
  signed_at TIMESTAMPTZ DEFAULT NULL,
  ip_address VARCHAR(50) DEFAULT '127.0.0.1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contract_reminders (
  id VARCHAR(36) PRIMARY KEY,
  contract_id VARCHAR(36) REFERENCES contracts(id) ON DELETE CASCADE,
  reminder_type VARCHAR(50) NOT NULL,
  reminder_date DATE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT DEFAULT '',
  recipients JSONB DEFAULT '[]',
  is_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contract_activity_logs (
  id VARCHAR(36) PRIMARY KEY,
  contract_id VARCHAR(36) REFERENCES contracts(id) ON DELETE CASCADE,
  actor_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  description TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}',
  ip_address VARCHAR(50) DEFAULT '127.0.0.1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shared_document_permissions (
  id VARCHAR(36) PRIMARY KEY,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(36) NOT NULL,
  granted_by VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  granted_to_lawyer_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  permission_level VARCHAR(20) DEFAULT 'review' CHECK (permission_level IN ('view', 'review', 'comment')),
  purpose TEXT DEFAULT 'Legal review and advice',
  expires_at TIMESTAMPTZ DEFAULT NULL,
  revoked_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Legal Cases & Client Cases
CREATE TABLE IF NOT EXISTS legal_cases (
  id VARCHAR(36) PRIMARY KEY,
  case_ref VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  practice_area VARCHAR(100) NOT NULL,
  client_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  assigned_lawyer_id VARCHAR(36) REFERENCES lawyer_profiles(id) ON DELETE CASCADE,
  organization_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(30) DEFAULT 'enquiry' CHECK (status IN ('enquiry', 'consultation', 'engagement_pending', 'active_matter', 'hearing_proceedings', 'closed')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  court_name VARCHAR(200) DEFAULT '',
  case_number VARCHAR(100) DEFAULT '',
  next_hearing_date DATE DEFAULT NULL,
  summary TEXT DEFAULT '',
  chronology JSONB DEFAULT '[]',
  private_lawyer_notes TEXT DEFAULT '',
  client_notes TEXT DEFAULT '',
  related_contract_id VARCHAR(36) REFERENCES contracts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_cases (
  id VARCHAR(36) PRIMARY KEY,
  case_ref VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  practice_area VARCHAR(100) NOT NULL,
  client_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  assigned_lawyer_id VARCHAR(36) REFERENCES lawyer_profiles(id) ON DELETE CASCADE,
  status VARCHAR(30) DEFAULT 'enquiry',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS case_documents (
  id VARCHAR(36) PRIMARY KEY,
  case_id VARCHAR(36) REFERENCES legal_cases(id) ON DELETE CASCADE,
  uploaded_by VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  doc_category VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INT DEFAULT 0,
  mime_type VARCHAR(100) DEFAULT 'application/pdf',
  is_confidential BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Reviews
CREATE TABLE IF NOT EXISTS client_reviews (
  id VARCHAR(36) PRIMARY KEY,
  booking_id VARCHAR(36) REFERENCES consultation_bookings(id) ON DELETE CASCADE UNIQUE,
  client_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  lawyer_id VARCHAR(36) REFERENCES lawyer_profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT DEFAULT '',
  tags JSONB DEFAULT '[]',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lawyer_reviews (
  id VARCHAR(36) PRIMARY KEY,
  booking_id VARCHAR(36) REFERENCES consultation_bookings(id) ON DELETE CASCADE UNIQUE,
  client_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  lawyer_id VARCHAR(36) REFERENCES lawyer_profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT DEFAULT '',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lawyer_favorites (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  lawyer_id VARCHAR(36) REFERENCES lawyer_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Legal Services Marketplace
CREATE TABLE IF NOT EXISTS legal_services (
  id VARCHAR(36) PRIMARY KEY,
  lawyer_id VARCHAR(36) REFERENCES lawyer_profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  deliverables JSONB DEFAULT '[]',
  price_amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  estimated_turnaround_days INT DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_requests (
  id VARCHAR(36) PRIMARY KEY,
  request_ref VARCHAR(50) UNIQUE NOT NULL,
  service_id VARCHAR(36) REFERENCES legal_services(id) ON DELETE CASCADE,
  client_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  lawyer_id VARCHAR(36) REFERENCES lawyer_profiles(id) ON DELETE CASCADE,
  requirements TEXT NOT NULL,
  supporting_documents JSONB DEFAULT '[]',
  quote_amount NUMERIC(10, 2) NOT NULL,
  status VARCHAR(25) DEFAULT 'submitted' CHECK (status IN ('submitted', 'accepted', 'in_progress', 'review_pending', 'completed', 'cancelled')),
  deliverable_file_url TEXT DEFAULT '',
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Payments
CREATE TABLE IF NOT EXISTS payment_orders (
  id VARCHAR(36) PRIMARY KEY,
  order_ref VARCHAR(50) UNIQUE NOT NULL,
  razorpay_order_id VARCHAR(100) UNIQUE NOT NULL,
  user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  booking_id VARCHAR(36) REFERENCES consultation_bookings(id) ON DELETE SET NULL,
  service_request_id VARCHAR(36) REFERENCES service_requests(id) ON DELETE SET NULL,
  amount_paise BIGINT NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(25) DEFAULT 'created' CHECK (status IN ('created', 'attempted', 'paid', 'failed')),
  idempotency_key VARCHAR(100) UNIQUE,
  receipt_number VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(36) PRIMARY KEY,
  payment_ref VARCHAR(50) UNIQUE NOT NULL,
  order_id VARCHAR(36) REFERENCES payment_orders(id) ON DELETE SET NULL,
  user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  amount_paise BIGINT NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(25) DEFAULT 'created' CHECK (status IN ('created', 'attempted', 'paid', 'failed')),
  gateway_payment_id VARCHAR(100) DEFAULT '',
  gateway_signature VARCHAR(255) DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id VARCHAR(36) PRIMARY KEY,
  transaction_ref VARCHAR(50) UNIQUE NOT NULL,
  order_id VARCHAR(36) REFERENCES payment_orders(id) ON DELETE CASCADE,
  razorpay_payment_id VARCHAR(100) UNIQUE NOT NULL,
  razorpay_signature VARCHAR(255) DEFAULT '',
  amount_paise BIGINT NOT NULL,
  status VARCHAR(25) NOT NULL CHECK (status IN ('success', 'failed', 'refunded')),
  payment_method VARCHAR(50) DEFAULT 'upi',
  error_code VARCHAR(50) DEFAULT NULL,
  error_description TEXT DEFAULT NULL,
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commission_ledgers (
  id VARCHAR(36) PRIMARY KEY,
  transaction_id VARCHAR(36) REFERENCES payment_transactions(id) ON DELETE CASCADE,
  booking_id VARCHAR(36) REFERENCES consultation_bookings(id) ON DELETE SET NULL,
  service_request_id VARCHAR(36) REFERENCES service_requests(id) ON DELETE SET NULL,
  gross_amount NUMERIC(10, 2) NOT NULL,
  commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
  platform_fee NUMERIC(10, 2) NOT NULL,
  lawyer_net_amount NUMERIC(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'credited' CHECK (status IN ('credited', 'reversed', 'on_hold')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lawyer_earnings (
  id VARCHAR(36) PRIMARY KEY,
  lawyer_id VARCHAR(36) REFERENCES lawyer_profiles(id) ON DELETE CASCADE,
  transaction_id VARCHAR(36) REFERENCES payment_transactions(id) ON DELETE SET NULL,
  gross_amount NUMERIC(10, 2) NOT NULL,
  platform_commission NUMERIC(10, 2) NOT NULL,
  net_earnings NUMERIC(10, 2) NOT NULL,
  description VARCHAR(255) DEFAULT 'Consultation fee',
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'pending', 'withdrawn', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payouts (
  id VARCHAR(36) PRIMARY KEY,
  payout_ref VARCHAR(50) UNIQUE NOT NULL,
  lawyer_id VARCHAR(36) REFERENCES lawyer_profiles(id) ON DELETE CASCADE,
  requested_amount NUMERIC(10, 2) NOT NULL,
  status VARCHAR(25) DEFAULT 'requested' CHECK (status IN ('requested', 'processing', 'completed', 'rejected')),
  bank_reference VARCHAR(100) DEFAULT '',
  processed_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ DEFAULT NULL,
  rejection_reason TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refunds (
  id VARCHAR(36) PRIMARY KEY,
  refund_ref VARCHAR(50) UNIQUE NOT NULL,
  transaction_id VARCHAR(36) REFERENCES payment_transactions(id) ON DELETE CASCADE,
  booking_id VARCHAR(36) REFERENCES consultation_bookings(id) ON DELETE SET NULL,
  requested_by VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(25) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processed', 'rejected')),
  admin_notes TEXT DEFAULT '',
  processed_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(36) PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  order_id VARCHAR(36) REFERENCES payment_orders(id) ON DELETE SET NULL,
  user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  recipient_name VARCHAR(150) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_address TEXT DEFAULT '',
  subtotal NUMERIC(10, 2) NOT NULL,
  tax_amount NUMERIC(10, 2) NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  pdf_url TEXT DEFAULT '',
  status VARCHAR(20) DEFAULT 'issued' CHECK (status IN ('issued', 'paid', 'cancelled')),
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  admin_email VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id VARCHAR(100) DEFAULT '',
  details TEXT DEFAULT '',
  ip_address VARCHAR(50) DEFAULT '127.0.0.1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  admin_email VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id VARCHAR(100) DEFAULT '',
  details TEXT DEFAULT '',
  ip_address VARCHAR(50) DEFAULT '127.0.0.1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  recipient_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'general',
  link TEXT DEFAULT '',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Preserved Legacy Tables
CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  banner_image TEXT NOT NULL,
  event_date DATE NOT NULL,
  start_time VARCHAR(20) NOT NULL,
  end_time VARCHAR(20) NOT NULL,
  venue VARCHAR(200) NOT NULL,
  venue_type VARCHAR(20) NOT NULL CHECK (venue_type IN ('offline', 'online', 'hybrid')) DEFAULT 'offline',
  meeting_url TEXT DEFAULT '',
  creator_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  organizer_name VARCHAR(150) NOT NULL,
  organizer_email VARCHAR(255) NOT NULL,
  department VARCHAR(100) DEFAULT 'Campus Wide',
  max_capacity INT NOT NULL DEFAULT 100,
  registered_count INT NOT NULL DEFAULT 0,
  registration_deadline TIMESTAMPTZ NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  ticket_price NUMERIC(10, 2) DEFAULT 0,
  status VARCHAR(25) NOT NULL CHECK (status IN ('pending_approval', 'approved', 'rejected', 'cancelled', 'completed')) DEFAULT 'pending_approval',
  tags JSONB DEFAULT '[]',
  eligibility TEXT DEFAULT 'Open to all enrolled university students',
  prerequisites TEXT DEFAULT 'None',
  rejection_reason TEXT DEFAULT '',
  is_team_event BOOLEAN DEFAULT false,
  team_size_min INT DEFAULT 1,
  team_size_max INT DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_registrations (
  id VARCHAR(36) PRIMARY KEY,
  event_id VARCHAR(36) REFERENCES events(id) ON DELETE CASCADE,
  user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  ticket_code VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(25) NOT NULL CHECK (status IN ('confirmed', 'waitlisted', 'attended', 'cancelled')) DEFAULT 'confirmed',
  attendance_status VARCHAR(20) DEFAULT 'unmarked',
  registration_date TIMESTAMPTZ DEFAULT NOW(),
  qr_code_data TEXT DEFAULT '',
  team_id VARCHAR(36) DEFAULT NULL,
  team_name VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_event UNIQUE (user_id, event_id)
);

CREATE TABLE IF NOT EXISTS attendances (
  id VARCHAR(36) PRIMARY KEY,
  event_id VARCHAR(36) REFERENCES events(id) ON DELETE CASCADE,
  registration_id VARCHAR(36) REFERENCES event_registrations(id) ON DELETE CASCADE,
  student_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  ticket_code VARCHAR(50) UNIQUE NOT NULL,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  verified_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  scan_method VARCHAR(20) DEFAULT 'qr_scan',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS certificates (
  id VARCHAR(36) PRIMARY KEY,
  certificate_code VARCHAR(50) UNIQUE NOT NULL,
  student_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  event_id VARCHAR(36) REFERENCES events(id) ON DELETE CASCADE,
  student_name VARCHAR(150) NOT NULL,
  student_roll VARCHAR(50) DEFAULT '',
  event_title VARCHAR(200) NOT NULL,
  issue_date TIMESTAMPTZ DEFAULT NOW(),
  issued_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  verification_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcements (
  id VARCHAR(36) PRIMARY KEY,
  event_id VARCHAR(36) REFERENCES events(id) ON DELETE CASCADE,
  author_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('normal', 'important', 'urgent')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
