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
