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
