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
