-- ==========================================
-- 20261103000001_initial_schema.sql
-- ==========================================

-- ==============================================================================
-- ContractIQ — Comprehensive Supabase Database Schema
-- Migration 01: Core Entities, Relationships, Constraints, and Indexes
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Profiles (Unified User Profile synced with auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE,
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
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backward-compatibility / Express user table sync
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL DEFAULT '',
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
  interests JSONB DEFAULT '["Technology", "Legal Tech"]'::jsonb,
  organization_name VARCHAR(150) DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. User Roles (Granular permission management)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(30) NOT NULL,
  permissions JSONB DEFAULT '[]'::jsonb,
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 4. Lawyer Categories
CREATE TABLE IF NOT EXISTS lawyer_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  additional_specialties JSONB DEFAULT '[]'::jsonb,
  experience_years INT NOT NULL DEFAULT 3,
  bar_council_number VARCHAR(100) DEFAULT '',
  bar_state VARCHAR(100) DEFAULT '',
  languages JSONB DEFAULT '["English", "Hindi"]'::jsonb,
  education JSONB DEFAULT '[]'::jsonb,
  consultation_fee_15 NUMERIC(10, 2) DEFAULT 499.00,
  consultation_fee_30 NUMERIC(10, 2) DEFAULT 899.00,
  consultation_fee_60 NUMERIC(10, 2) DEFAULT 1499.00,
  consultation_modes JSONB DEFAULT '["chat", "audio", "video"]'::jsonb,
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id VARCHAR(36) REFERENCES lawyer_profiles(id) ON DELETE CASCADE,
  category_name VARCHAR(100) NOT NULL,
  sub_specialty VARCHAR(100) DEFAULT '',
  years_practicing INT DEFAULT 1,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Lawyer Documents (Degrees, Bar Certificates, ID Proofs)
CREATE TABLE IF NOT EXISTS lawyer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 9. Lawyer Availability
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

-- Alias availability_schedules table for existing routes
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
  client_documents JSONB DEFAULT '[]'::jsonb,
  meeting_room_id VARCHAR(100) DEFAULT '',
  meeting_credentials JSONB DEFAULT '{}'::jsonb,
  lawyer_notes TEXT DEFAULT '',
  rejection_reason TEXT DEFAULT '',
  cancelled_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  cancellation_reason TEXT DEFAULT '',
  completed_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Consultation Sessions (WebRTC / Audio / Video Room Logs)
CREATE TABLE IF NOT EXISTS consultation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 12. Contract Lifecycle Management (CLM)
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
  ai_risk_flags JSONB DEFAULT '[]'::jsonb,
  ai_clause_suggestions JSONB DEFAULT '[]'::jsonb,
  ai_analyzed_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Contract Parties
CREATE TABLE IF NOT EXISTS contract_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id VARCHAR(36) REFERENCES contracts(id) ON DELETE CASCADE,
  party_name VARCHAR(150) NOT NULL,
  party_type VARCHAR(50) DEFAULT 'counterparty' CHECK (party_type IN ('internal', 'client', 'vendor', 'counterparty')),
  contact_email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'reviewer' CHECK (role IN ('drafter', 'reviewer', 'approver', 'signatory', 'viewer')),
  user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Contract Versions
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

-- 15. Contract Clauses & Clause Library
CREATE TABLE IF NOT EXISTS contract_clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id VARCHAR(36) REFERENCES contracts(id) ON DELETE CASCADE,
  clause_type VARCHAR(50) NOT NULL CHECK (clause_type IN ('indemnity', 'confidentiality', 'termination', 'liability', 'governing_law', 'ip_ownership', 'warranties', 'custom')),
  clause_title VARCHAR(150) NOT NULL,
  clause_text TEXT NOT NULL,
  standard_language TEXT DEFAULT '',
  risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  ai_suggestion TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Contract Approvals
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

-- 17. Contract Comments
CREATE TABLE IF NOT EXISTS contract_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id VARCHAR(36) REFERENCES contracts(id) ON DELETE CASCADE,
  author_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  clause_reference VARCHAR(150) DEFAULT '',
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Contract Signatures
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

-- 19. Contract Reminders
CREATE TABLE IF NOT EXISTS contract_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id VARCHAR(36) REFERENCES contracts(id) ON DELETE CASCADE,
  reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('renewal', 'expiry', 'milestone', 'approval')),
  reminder_date DATE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT DEFAULT '',
  recipients JSONB DEFAULT '[]'::jsonb,
  is_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Contract Activity Logs
CREATE TABLE IF NOT EXISTS contract_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id VARCHAR(36) REFERENCES contracts(id) ON DELETE CASCADE,
  actor_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  description TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR(50) DEFAULT '127.0.0.1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Shared Document Permissions
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

-- 22. Legal Cases & Client Cases
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
  chronology JSONB DEFAULT '[]'::jsonb,
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

-- 23. Case Documents
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

-- 24. Lawyer Reviews & Client Reviews
CREATE TABLE IF NOT EXISTS client_reviews (
  id VARCHAR(36) PRIMARY KEY,
  booking_id VARCHAR(36) REFERENCES consultation_bookings(id) ON DELETE CASCADE UNIQUE,
  client_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  lawyer_id VARCHAR(36) REFERENCES lawyer_profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT DEFAULT '',
  tags JSONB DEFAULT '[]'::jsonb,
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

-- 25. Lawyer Favorites
CREATE TABLE IF NOT EXISTS lawyer_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  lawyer_id VARCHAR(36) REFERENCES lawyer_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lawyer_id)
);

-- 26. Legal Services Marketplace
CREATE TABLE IF NOT EXISTS legal_services (
  id VARCHAR(36) PRIMARY KEY,
  lawyer_id VARCHAR(36) REFERENCES lawyer_profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  deliverables JSONB DEFAULT '[]'::jsonb,
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
  supporting_documents JSONB DEFAULT '[]'::jsonb,
  quote_amount NUMERIC(10, 2) NOT NULL,
  status VARCHAR(25) DEFAULT 'submitted' CHECK (status IN ('submitted', 'accepted', 'in_progress', 'review_pending', 'completed', 'cancelled')),
  deliverable_file_url TEXT DEFAULT '',
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 27. Payments & Payment Orders
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 28. Communications & Messaging
CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR(36) PRIMARY KEY,
  booking_id VARCHAR(36) REFERENCES consultation_bookings(id) ON DELETE CASCADE,
  client_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  lawyer_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id VARCHAR(36) REFERENCES conversations(id) ON DELETE CASCADE,
  user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'participant',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
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

-- 29. Administration & Verification Requests
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

-- Alias audit_logs for backward compatibility
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

-- Preserved Legacy Tables for backward compatibility
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
  tags JSONB DEFAULT '[]'::jsonb,
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

-- ==============================================================================
-- Comprehensive Indexes for Performance and Scale
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user ON profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_lawyer_primary_specialty ON lawyer_profiles(primary_specialty);
CREATE INDEX IF NOT EXISTS idx_lawyer_verified ON lawyer_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_lawyer_specs_lawyer ON lawyer_specializations(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_lawyer_docs_lawyer ON lawyer_documents(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_consultation_client ON consultation_bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_consultation_lawyer ON consultation_bookings(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_consultation_status ON consultation_bookings(status);
CREATE INDEX IF NOT EXISTS idx_contracts_owner ON contracts(owner_id);
CREATE INDEX IF NOT EXISTS idx_contracts_org ON contracts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contract_parties_contract ON contract_parties(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_clauses_contract ON contract_clauses(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_approvals_contract ON contract_approvals(contract_id);
CREATE INDEX IF NOT EXISTS idx_cases_client ON legal_cases(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_lawyer ON legal_cases(assigned_lawyer_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON legal_cases(status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_booking ON messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_rzp ON payment_orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_rzp ON payment_transactions(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);


-- ==========================================
-- 20261103000002_rls_policies.sql
-- ==========================================

-- ==============================================================================
-- ContractIQ — Comprehensive Supabase Database Schema
-- Migration 02: Row Level Security (RLS) Policies
-- ==============================================================================

-- 1. Helper Functions for Role Resolution
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS VARCHAR AS $$
DECLARE
  v_role VARCHAR;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
  IF v_role IS NULL THEN
    SELECT role INTO v_role FROM public.users WHERE id = auth.uid()::text LIMIT 1;
  END IF;
  RETURN COALESCE(v_role, 'anonymous');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND role = 'admin') OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::text AND role = 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Enable RLS on all primary tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_clauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_document_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- Profiles Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Profiles are viewable by authenticated users or public for advocates"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth_user_id = auth.uid() OR auth.uid() IS NULL);

CREATE POLICY "Users can update their own profile without role elevation"
  ON profiles FOR UPDATE
  USING (auth_user_id = auth.uid() OR is_admin())
  WITH CHECK (
    is_admin() OR
    (auth_user_id = auth.uid() AND role = (SELECT p.role FROM profiles p WHERE p.auth_user_id = auth.uid()))
  );

-- ------------------------------------------------------------------------------
-- Lawyer Profiles Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Lawyer profiles are publicly visible"
  ON lawyer_profiles FOR SELECT
  USING (true);

CREATE POLICY "Lawyers can insert their profile"
  ON lawyer_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid()::text OR is_admin());

CREATE POLICY "Lawyers can update their own details, not verification status"
  ON lawyer_profiles FOR UPDATE
  USING (user_id = auth.uid()::text OR is_admin())
  WITH CHECK (
    is_admin() OR
    (user_id = auth.uid()::text AND is_verified = (SELECT lp.is_verified FROM lawyer_profiles lp WHERE lp.user_id = auth.uid()::text))
  );

-- ------------------------------------------------------------------------------
-- Lawyer Verifications Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Lawyers can view own verification request, admins view all"
  ON lawyer_verifications FOR SELECT
  USING (user_id = auth.uid()::text OR is_admin());

CREATE POLICY "Lawyers can submit verification request"
  ON lawyer_verifications FOR INSERT
  WITH CHECK (user_id = auth.uid()::text OR is_admin());

CREATE POLICY "Only admins can review and update verification status"
  ON lawyer_verifications FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- ------------------------------------------------------------------------------
-- Contract Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view contracts they own, are party to, or have shared access"
  ON contracts FOR SELECT
  USING (
    owner_id = auth.uid()::text OR
    organization_id = auth.uid()::text OR
    EXISTS (SELECT 1 FROM contract_parties cp WHERE cp.contract_id = contracts.id AND cp.user_id = auth.uid()::text) OR
    EXISTS (SELECT 1 FROM shared_document_permissions sdp WHERE sdp.resource_id = contracts.id AND sdp.granted_to_lawyer_id = auth.uid()::text AND (sdp.expires_at IS NULL OR sdp.expires_at > NOW()) AND sdp.revoked_at IS NULL) OR
    is_admin()
  );

CREATE POLICY "Users can insert their own contracts"
  ON contracts FOR INSERT
  WITH CHECK (owner_id = auth.uid()::text OR is_admin());

CREATE POLICY "Owners and approvers can update contracts"
  ON contracts FOR UPDATE
  USING (
    owner_id = auth.uid()::text OR
    EXISTS (SELECT 1 FROM contract_approvals ca WHERE ca.contract_id = contracts.id AND ca.approver_id = auth.uid()::text) OR
    is_admin()
  );

CREATE POLICY "Only owners or admins can delete contracts"
  ON contracts FOR DELETE
  USING (owner_id = auth.uid()::text OR is_admin());

-- ------------------------------------------------------------------------------
-- Consultation Bookings Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Clients, assigned lawyers, and admins can view bookings"
  ON consultation_bookings FOR SELECT
  USING (
    client_id = auth.uid()::text OR
    EXISTS (SELECT 1 FROM lawyer_profiles lp WHERE lp.id = consultation_bookings.lawyer_id AND lp.user_id = auth.uid()::text) OR
    is_admin()
  );

CREATE POLICY "Clients can book consultations"
  ON consultation_bookings FOR INSERT
  WITH CHECK (client_id = auth.uid()::text OR is_admin());

CREATE POLICY "Booking participants can update status"
  ON consultation_bookings FOR UPDATE
  USING (
    client_id = auth.uid()::text OR
    EXISTS (SELECT 1 FROM lawyer_profiles lp WHERE lp.id = consultation_bookings.lawyer_id AND lp.user_id = auth.uid()::text) OR
    is_admin()
  );

-- ------------------------------------------------------------------------------
-- Legal Cases & Case Documents Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Clients and assigned advocates can view cases"
  ON legal_cases FOR SELECT
  USING (
    client_id = auth.uid()::text OR
    EXISTS (SELECT 1 FROM lawyer_profiles lp WHERE lp.id = legal_cases.assigned_lawyer_id AND lp.user_id = auth.uid()::text) OR
    is_admin()
  );

CREATE POLICY "Clients can file cases"
  ON legal_cases FOR INSERT
  WITH CHECK (client_id = auth.uid()::text OR is_admin());

CREATE POLICY "Case participants can update cases"
  ON legal_cases FOR UPDATE
  USING (
    client_id = auth.uid()::text OR
    EXISTS (SELECT 1 FROM lawyer_profiles lp WHERE lp.id = legal_cases.assigned_lawyer_id AND lp.user_id = auth.uid()::text) OR
    is_admin()
  );

CREATE POLICY "Case participants can view case documents"
  ON case_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM legal_cases lc
      WHERE lc.id = case_documents.case_id AND (
        lc.client_id = auth.uid()::text OR
        EXISTS (SELECT 1 FROM lawyer_profiles lp WHERE lp.id = lc.assigned_lawyer_id AND lp.user_id = auth.uid()::text) OR
        is_admin()
      )
    )
  );

CREATE POLICY "Case participants can upload case documents"
  ON case_documents FOR INSERT
  WITH CHECK (uploaded_by = auth.uid()::text OR is_admin());

-- ------------------------------------------------------------------------------
-- Messages & Conversations Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Conversation participants can view conversation"
  ON conversations FOR SELECT
  USING (
    client_id = auth.uid()::text OR
    lawyer_id = auth.uid()::text OR
    EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = conversations.id AND cp.user_id::text = auth.uid()::text) OR
    is_admin()
  );

CREATE POLICY "Authorized senders can view messages"
  ON messages FOR SELECT
  USING (
    sender_id = auth.uid()::text OR
    recipient_id = auth.uid()::text OR
    EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND (c.client_id = auth.uid()::text OR c.lawyer_id = auth.uid()::text)) OR
    is_admin()
  );

CREATE POLICY "Authorized senders can insert messages"
  ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid()::text OR is_admin());

-- ------------------------------------------------------------------------------
-- Payments & Ledgers Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view their own payment orders"
  ON payment_orders FOR SELECT
  USING (user_id = auth.uid()::text OR is_admin());

CREATE POLICY "Users can create payment orders"
  ON payment_orders FOR INSERT
  WITH CHECK (user_id = auth.uid()::text OR is_admin());

CREATE POLICY "Lawyers can view their earnings"
  ON lawyer_earnings FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM lawyer_profiles lp WHERE lp.id = lawyer_earnings.lawyer_id AND lp.user_id = auth.uid()::text) OR
    is_admin()
  );

CREATE POLICY "Lawyers can request payouts"
  ON payouts FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM lawyer_profiles lp WHERE lp.id = payouts.lawyer_id AND lp.user_id = auth.uid()::text) OR
    is_admin()
  );

CREATE POLICY "Lawyers can view their own payouts"
  ON payouts FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM lawyer_profiles lp WHERE lp.id = payouts.lawyer_id AND lp.user_id = auth.uid()::text) OR
    is_admin()
  );

CREATE POLICY "Only admins can process payouts"
  ON payouts FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- ------------------------------------------------------------------------------
-- Notifications Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view and update their own notifications"
  ON notifications FOR ALL
  USING (recipient_id = auth.uid()::text OR is_admin())
  WITH CHECK (recipient_id = auth.uid()::text OR is_admin());

-- ------------------------------------------------------------------------------
-- Admin Logs Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Only admins can view and insert admin logs"
  ON admin_logs FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());


-- ==========================================
-- 20261103000003_storage_buckets.sql
-- ==========================================

-- ==============================================================================
-- ContractIQ — Comprehensive Supabase Database Schema
-- Migration 03: Storage Buckets & Storage Security Policies
-- ==============================================================================

-- 1. Create Storage Buckets in storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('contract-documents', 'contract-documents', false, 26214400, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']),
  ('case-documents', 'case-documents', false, 26214400, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']),
  ('lawyer-documents', 'lawyer-documents', false, 15728640, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
  ('user-profiles', 'user-profiles', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('signed-contracts', 'signed-contracts', false, 26214400, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage Objects Security Policies
-- User Profiles: Public view, authenticated upload to their own user directory
CREATE POLICY "Public profiles can be viewed by anyone"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-profiles');

CREATE POLICY "Authenticated users can upload avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'user-profiles' AND (auth.role() = 'authenticated' OR auth.role() = 'service_role'));

CREATE POLICY "Users can update their avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'user-profiles' AND (auth.role() = 'authenticated' OR auth.role() = 'service_role'));

-- Contract Documents: Private, authenticated access only
CREATE POLICY "Authorized users can view contract documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'contract-documents' AND (auth.role() = 'authenticated' OR auth.role() = 'service_role'));

CREATE POLICY "Authenticated users can upload contract documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'contract-documents' AND (auth.role() = 'authenticated' OR auth.role() = 'service_role'));

-- Case Documents: Private, authenticated access only
CREATE POLICY "Authorized participants can view case documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'case-documents' AND (auth.role() = 'authenticated' OR auth.role() = 'service_role'));

CREATE POLICY "Authorized users can upload case documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'case-documents' AND (auth.role() = 'authenticated' OR auth.role() = 'service_role'));

-- Lawyer Documents: Private verification documents
CREATE POLICY "Authorized advocates and admins can view verification documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'lawyer-documents' AND (auth.role() = 'authenticated' OR auth.role() = 'service_role'));

CREATE POLICY "Advocates can upload verification documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'lawyer-documents' AND (auth.role() = 'authenticated' OR auth.role() = 'service_role'));

-- Signed Contracts: Private immutable contracts
CREATE POLICY "Authorized parties can view signed contracts"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'signed-contracts' AND (auth.role() = 'authenticated' OR auth.role() = 'service_role'));

CREATE POLICY "System and signatories can upload signed contracts"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'signed-contracts' AND (auth.role() = 'authenticated' OR auth.role() = 'service_role'));


-- ==========================================
-- 20261103000004_realtime_setup.sql
-- ==========================================

-- ==============================================================================
-- ContractIQ — Comprehensive Supabase Database Schema
-- Migration 04: Realtime Publications & Auth User Sync Trigger
-- ==============================================================================

-- 1. Configure Replica Identity for Realtime tracking
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE consultation_bookings REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE contract_approvals REPLICA IDENTITY FULL;
ALTER TABLE contracts REPLICA IDENTITY FULL;

-- 2. Add Tables to Supabase Realtime Publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE consultation_bookings;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE contract_approvals;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE contracts;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- 3. Automatic Synchronization Trigger from auth.users to public.profiles & public.users
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role VARCHAR;
  v_name VARCHAR;
  v_phone VARCHAR;
BEGIN
  v_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');

  -- Insert or update public.profiles
  INSERT INTO public.profiles (
    id,
    auth_user_id,
    email,
    full_name,
    role,
    phone,
    metadata
  ) VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    v_name,
    v_role,
    v_phone,
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb)
  )
  ON CONFLICT (email) DO UPDATE SET
    auth_user_id = EXCLUDED.auth_user_id,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

  -- Insert or update public.users
  INSERT INTO public.users (
    id,
    name,
    email,
    role,
    phone
  ) VALUES (
    NEW.id::text,
    v_name,
    NEW.email,
    v_role,
    v_phone
  )
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role;

  -- If advocate/lawyer role, ensure lawyer_profile placeholder exists
  IF v_role = 'lawyer' THEN
    INSERT INTO public.lawyer_profiles (
      id,
      user_id,
      full_name,
      primary_specialty,
      headline,
      bio
    ) VALUES (
      NEW.id::text,
      NEW.id::text,
      v_name,
      COALESCE(NEW.raw_user_meta_data->>'primary_specialty', 'Contract Lawyer'),
      'Advocate | Legal Consultant',
      COALESCE(NEW.raw_user_meta_data->>'bio', '')
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safe trigger definition for Supabase Auth
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
  END IF;
END $$;
