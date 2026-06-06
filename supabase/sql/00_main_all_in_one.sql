-- =============================================================================
-- Barangay System | 00_main_all_in_one.sql
-- COMPLETE SCHEMA — copy & paste entire file into Supabase SQL Editor
-- Project: BarangaySystem | uqdaicrtspezrxqasmfx | Region: ap-southeast-2
--
-- RUN ORDER:
--   1. This file (00_main_all_in_one.sql)
--   2. demo/demo_accounts.sql        (demo logins — SEPARATE)
--   3. 20_seed_certificate_museum.sql OR demo/demo_sample_data.sql (museum samples)
-- =============================================================================


-- >>> FILE: 01_extensions_and_enums.sql >>>

-- =============================================================================
-- Barangay System | 01_extensions_and_enums.sql
-- Run first. Extensions and custom enum types.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User roles (normalized)
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('admin', 'staff', 'resident', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Account status
DO $$ BEGIN
  CREATE TYPE public.account_status AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Appointment / certificate workflow status
DO $$ BEGIN
  CREATE TYPE public.workflow_status AS ENUM (
    'pending', 'approved', 'rejected', 'completed', 'processing', 'issued', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- >>> FILE: 02_profiles.sql >>>

-- =============================================================================
-- Barangay System | 02_profiles.sql
-- User profiles linked to Supabase Auth (auth.users)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL UNIQUE,
  first_name      TEXT,
  last_name       TEXT,
  middle_name     TEXT,
  suffix          TEXT,
  name            TEXT,
  phone           TEXT,
  address         TEXT,
  birth_date      DATE,
  gender          TEXT,
  civil_status    TEXT,
  nationality     TEXT DEFAULT 'Filipino',
  purok           TEXT,
  resident_since  TEXT,
  role            public.user_role NOT NULL DEFAULT 'resident',
  status          public.account_status NOT NULL DEFAULT 'active',
  position        TEXT,
  department      TEXT,
  employee_id     TEXT,
  hire_date       DATE,
  password_changed_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN public.profiles.password_changed_at IS 'Timestamp of last password change (password stored in auth.users)';

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

COMMENT ON TABLE public.profiles IS 'Barangay System user profiles extending Supabase Auth';


-- >>> FILE: 03_certificate_forms.sql >>>

-- =============================================================================
-- Barangay System | 03_certificate_forms.sql
-- Certificate type catalog (admin-managed forms)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.certificate_forms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'Certificate',
  description     TEXT,
  requirements    TEXT[] NOT NULL DEFAULT ARRAY['Valid ID'],
  price           NUMERIC(10,2) NOT NULL DEFAULT 0,
  fee             NUMERIC(10,2) NOT NULL DEFAULT 0,
  processing_time TEXT DEFAULT '1 day',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certificate_forms_active ON public.certificate_forms(is_active);

COMMENT ON TABLE public.certificate_forms IS 'Available certificate/clearance types residents can request';


-- >>> FILE: 04_appointment_requests.sql >>>

-- =============================================================================
-- Barangay System | 04_appointment_requests.sql
-- Certificate appointment / request records
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.appointment_requests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  certificate_form_id   UUID REFERENCES public.certificate_forms(id) ON DELETE SET NULL,
  status                public.workflow_status NOT NULL DEFAULT 'pending',
  appointment_date      DATE,
  appointment_time      TEXT,
  requested_date        DATE,
  requested_time        TEXT,
  request_date          DATE,
  user_email            TEXT,
  user_name             TEXT,
  certificate_name      TEXT,
  certificate_type      TEXT,
  purpose               TEXT,
  notes                 TEXT,
  first_name            TEXT,
  middle_name           TEXT,
  last_name             TEXT,
  address               TEXT,
  purok                 TEXT,
  date_of_birth         DATE,
  gender                TEXT,
  civil_status          TEXT,
  phone_no              TEXT,
  resident_since        TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointment_requests_user ON public.appointment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_appointment_requests_status ON public.appointment_requests(status);
CREATE INDEX IF NOT EXISTS idx_appointment_requests_created ON public.appointment_requests(created_at DESC);

COMMENT ON TABLE public.appointment_requests IS 'Resident certificate appointment requests';


-- >>> FILE: 05_certificates.sql >>>

-- =============================================================================
-- Barangay System | 05_certificates.sql
-- Issued certificate records
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.certificates (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  appointment_id      UUID REFERENCES public.appointment_requests(id) ON DELETE SET NULL,
  user_name           TEXT NOT NULL,
  certificate_type    TEXT NOT NULL,
  certificate_number  TEXT UNIQUE,
  status              public.workflow_status NOT NULL DEFAULT 'pending',
  request_date        DATE,
  issued_date         DATE,
  expiry_date         DATE,
  purpose             TEXT,
  notes               TEXT,
  address             TEXT,
  gender              TEXT,
  civil_status        TEXT,
  date_of_birth       DATE,
  resident_since      TEXT,
  is_sample           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certificates_user ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON public.certificates(status);
CREATE INDEX IF NOT EXISTS idx_certificates_appointment ON public.certificates(appointment_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_appointment_unique
  ON public.certificates(appointment_id)
  WHERE appointment_id IS NOT NULL;

COMMENT ON TABLE public.certificates IS 'Issued barangay certificates and clearances';


-- >>> FILE: 06_basketball_courts.sql >>>

-- =============================================================================
-- Barangay System | 06_basketball_courts.sql
-- Basketball court definitions
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.basketball_courts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_number        INTEGER NOT NULL UNIQUE,
  name                TEXT NOT NULL,
  location            TEXT NOT NULL DEFAULT 'Barangay Sports Complex',
  capacity            INTEGER NOT NULL DEFAULT 20,
  amenities           TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  hourly_rate         NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  maintenance_start   DATE,
  maintenance_end     DATE,
  maintenance_reason  TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_basketball_courts_number ON public.basketball_courts(court_number);
CREATE INDEX IF NOT EXISTS idx_basketball_courts_active ON public.basketball_courts(is_active);

COMMENT ON TABLE public.basketball_courts IS 'Barangay basketball court facilities';


-- >>> FILE: 07_basketball_reservations.sql >>>

-- =============================================================================
-- Barangay System | 07_basketball_reservations.sql
-- Basketball court booking / reservation records
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.basketball_court_reservations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  court_id          UUID REFERENCES public.basketball_courts(id) ON DELETE SET NULL,
  court_number      INTEGER NOT NULL,
  user_name         TEXT NOT NULL,
  user_email        TEXT NOT NULL,
  reservation_date  DATE NOT NULL,
  start_time        TEXT NOT NULL,
  end_time          TEXT NOT NULL,
  duration          INTEGER NOT NULL DEFAULT 1,
  purpose           TEXT NOT NULL,
  status            public.workflow_status NOT NULL DEFAULT 'pending',
  notes             TEXT,
  approved_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_basketball_reservations_user ON public.basketball_court_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_basketball_reservations_court ON public.basketball_court_reservations(court_number);
CREATE INDEX IF NOT EXISTS idx_basketball_reservations_date ON public.basketball_court_reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_basketball_reservations_status ON public.basketball_court_reservations(status);

COMMENT ON TABLE public.basketball_court_reservations IS 'Basketball court reservation requests';


-- >>> FILE: 08_functions_and_triggers.sql >>>

-- =============================================================================
-- Barangay System | 08_functions_and_triggers.sql
-- Auto timestamps, profile creation on signup
--
-- AUTH NOTE: Passwords live in auth.users. After self-registration the app
-- signs the user out and redirects to /login for manual sign-in.
-- =============================================================================

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at to all tables
DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles', 'certificate_forms', 'appointment_requests',
    'certificates', 'basketball_courts', 'basketball_court_reservations'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%s', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%s FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      t, t
    );
  END LOOP;
END $$;

-- Auto-create profile when a new auth user signs up (full registration fields)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_first  TEXT := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  v_middle TEXT := NULLIF(COALESCE(NEW.raw_user_meta_data->>'middle_name', ''), '');
  v_last   TEXT := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  v_suffix TEXT := NULLIF(COALESCE(NEW.raw_user_meta_data->>'suffix', ''), '');
  v_name   TEXT;
  v_birth  DATE;
BEGIN
  v_name := TRIM(
    CONCAT_WS(' ', v_first, v_middle, v_last)
    || CASE WHEN v_suffix IS NOT NULL AND v_suffix <> '' THEN ', ' || v_suffix ELSE '' END
  );

  BEGIN
    v_birth := NULLIF(NEW.raw_user_meta_data->>'birth_date', '')::date;
  EXCEPTION WHEN OTHERS THEN
    v_birth := NULL;
  END;

  INSERT INTO public.profiles (
    id, email, first_name, last_name, middle_name, suffix, name,
    phone, address, birth_date, gender, civil_status, nationality, role
  ) VALUES (
    NEW.id,
    NEW.email,
    NULLIF(v_first, ''),
    NULLIF(v_last, ''),
    v_middle,
    v_suffix,
    NULLIF(v_name, ''),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(NEW.raw_user_meta_data->>'address', ''),
    v_birth,
    NULLIF(NEW.raw_user_meta_data->>'gender', ''),
    NULLIF(NEW.raw_user_meta_data->>'civil_status', ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'nationality', ''), 'Filipino'),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'resident')
  )
  ON CONFLICT (id) DO UPDATE SET
    email         = EXCLUDED.email,
    first_name    = COALESCE(NULLIF(EXCLUDED.first_name, ''), public.profiles.first_name),
    last_name     = COALESCE(NULLIF(EXCLUDED.last_name, ''), public.profiles.last_name),
    middle_name   = COALESCE(EXCLUDED.middle_name, public.profiles.middle_name),
    suffix        = COALESCE(EXCLUDED.suffix, public.profiles.suffix),
    name          = COALESCE(NULLIF(EXCLUDED.name, ''), public.profiles.name),
    phone         = COALESCE(EXCLUDED.phone, public.profiles.phone),
    address       = COALESCE(EXCLUDED.address, public.profiles.address),
    birth_date    = COALESCE(EXCLUDED.birth_date, public.profiles.birth_date),
    gender        = COALESCE(EXCLUDED.gender, public.profiles.gender),
    civil_status  = COALESCE(EXCLUDED.civil_status, public.profiles.civil_status),
    nationality   = COALESCE(EXCLUDED.nationality, public.profiles.nationality),
    updated_at    = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper: get current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- >>> FILE: 09_rls_policies.sql >>>

-- =============================================================================
-- Barangay System | 09_rls_policies.sql
-- System settings table + Row Level Security policies
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.system_settings (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barangay_name          TEXT NOT NULL DEFAULT 'Barangay System',
  barangay_captain       TEXT,
  contact_number         TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.system_settings (barangay_name, barangay_captain, contact_number)
SELECT 'Barangay System', 'Barangay Captain', '(02) 123-4567'
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings LIMIT 1);

COMMENT ON TABLE public.system_settings IS 'Barangay System global settings';

ALTER TABLE public.system_settings DROP COLUMN IF EXISTS email_notifications;
ALTER TABLE public.system_settings DROP COLUMN IF EXISTS sms_notifications;
ALTER TABLE public.system_settings DROP COLUMN IF EXISTS auto_approve_documents;

DROP TRIGGER IF EXISTS trg_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER trg_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.basketball_courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.basketball_court_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- ----- PROFILES -----
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_select_admin_staff" ON public.profiles;
CREATE POLICY "profiles_select_admin_staff" ON public.profiles
  FOR SELECT USING (public.current_user_role() IN ('admin', 'staff'));

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL USING (public.current_user_role() = 'admin');

-- ----- CERTIFICATE FORMS (catalog - public read) -----
DROP POLICY IF EXISTS "cert_forms_select_all" ON public.certificate_forms;
CREATE POLICY "cert_forms_select_all" ON public.certificate_forms
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "cert_forms_admin_manage" ON public.certificate_forms;
CREATE POLICY "cert_forms_admin_manage" ON public.certificate_forms
  FOR ALL USING (public.current_user_role() = 'admin');

-- ----- APPOINTMENT REQUESTS -----
DROP POLICY IF EXISTS "appointments_select_own" ON public.appointment_requests;
CREATE POLICY "appointments_select_own" ON public.appointment_requests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "appointments_select_staff" ON public.appointment_requests;
CREATE POLICY "appointments_select_staff" ON public.appointment_requests
  FOR SELECT USING (public.current_user_role() IN ('admin', 'staff'));

DROP POLICY IF EXISTS "appointments_insert_own" ON public.appointment_requests;
CREATE POLICY "appointments_insert_own" ON public.appointment_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "appointments_update_staff" ON public.appointment_requests;
CREATE POLICY "appointments_update_staff" ON public.appointment_requests
  FOR UPDATE USING (public.current_user_role() IN ('admin', 'staff'));

-- ----- CERTIFICATES -----
DROP POLICY IF EXISTS "certificates_select_own" ON public.certificates;
CREATE POLICY "certificates_select_own" ON public.certificates
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "certificates_select_staff" ON public.certificates;
CREATE POLICY "certificates_select_staff" ON public.certificates
  FOR SELECT USING (public.current_user_role() IN ('admin', 'staff'));

DROP POLICY IF EXISTS "certificates_manage_staff" ON public.certificates;
CREATE POLICY "certificates_manage_staff" ON public.certificates
  FOR ALL USING (public.current_user_role() IN ('admin', 'staff'));

DROP POLICY IF EXISTS "certificates_select_samples" ON public.certificates;
CREATE POLICY "certificates_select_samples" ON public.certificates
  FOR SELECT USING (is_sample = TRUE);

-- ----- BASKETBALL COURTS -----
DROP POLICY IF EXISTS "courts_select_all" ON public.basketball_courts;
CREATE POLICY "courts_select_all" ON public.basketball_courts
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "courts_admin_manage" ON public.basketball_courts;
CREATE POLICY "courts_admin_manage" ON public.basketball_courts
  FOR ALL USING (public.current_user_role() IN ('admin', 'staff'));

-- ----- BASKETBALL RESERVATIONS -----
DROP POLICY IF EXISTS "reservations_select_own" ON public.basketball_court_reservations;
CREATE POLICY "reservations_select_own" ON public.basketball_court_reservations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "reservations_select_staff" ON public.basketball_court_reservations;
CREATE POLICY "reservations_select_staff" ON public.basketball_court_reservations
  FOR SELECT USING (public.current_user_role() IN ('admin', 'staff'));

DROP POLICY IF EXISTS "reservations_insert_own" ON public.basketball_court_reservations;
CREATE POLICY "reservations_insert_own" ON public.basketball_court_reservations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reservations_update_staff" ON public.basketball_court_reservations;
CREATE POLICY "reservations_update_staff" ON public.basketball_court_reservations
  FOR UPDATE USING (public.current_user_role() IN ('admin', 'staff'));

DROP POLICY IF EXISTS "reservations_cancel_own" ON public.basketball_court_reservations;
CREATE POLICY "reservations_cancel_own" ON public.basketball_court_reservations
  FOR UPDATE USING (auth.uid() = user_id);

-- ----- SYSTEM SETTINGS -----
DROP POLICY IF EXISTS "settings_select_all" ON public.system_settings;
CREATE POLICY "settings_select_all" ON public.system_settings
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "settings_admin_manage" ON public.system_settings;
CREATE POLICY "settings_admin_manage" ON public.system_settings
  FOR ALL USING (public.current_user_role() = 'admin');


-- >>> FILE: 10_seed_certificate_forms.sql >>>

-- =============================================================================
-- Barangay System | 10_seed_certificate_forms.sql
-- Default certificate form catalog (safe to re-run)
-- =============================================================================

INSERT INTO public.certificate_forms (name, type, description, requirements, price, fee, processing_time, is_active)
SELECT 'Certificate of Residency', 'Certificate', 'Proof of residence in the barangay', ARRAY['Valid ID'], 0, 0, '1 day', TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.certificate_forms WHERE name = 'Certificate of Residency');

INSERT INTO public.certificate_forms (name, type, description, requirements, price, fee, processing_time, is_active)
SELECT 'Certificate of Indigency', 'Certificate', 'For government assistance and social welfare', ARRAY['Valid ID'], 0, 0, '1 day', TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.certificate_forms WHERE name = 'Certificate of Indigency');

INSERT INTO public.certificate_forms (name, type, description, requirements, price, fee, processing_time, is_active)
SELECT 'Barangay Clearance', 'Clearance', 'Standard clearance for employment and other purposes', ARRAY['Valid ID'], 50, 50, '1 day', TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.certificate_forms WHERE name = 'Barangay Clearance');

INSERT INTO public.certificate_forms (name, type, description, requirements, price, fee, processing_time, is_active)
SELECT 'Barangay Business Clearance', 'Clearance', 'Business permit clearance for barangay operations', ARRAY['Valid ID', 'Business Registration', 'DTI/SEC Registration'], 150, 150, '3 days', TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.certificate_forms WHERE name = 'Barangay Business Clearance');


-- >>> FILE: 11_seed_basketball_courts.sql >>>

-- =============================================================================
-- Barangay System | 11_seed_basketball_courts.sql
-- Default basketball courts
-- =============================================================================

INSERT INTO public.basketball_courts (court_number, name, location, capacity, amenities, hourly_rate, is_active)
VALUES
  (1, 'Main Basketball Court', 'Barangay Sports Complex', 20,
   ARRAY['Lighting', 'Seating', 'Water Station', 'Restroom'], 100, TRUE),
  (2, 'Secondary Basketball Court', 'Barangay Sports Complex', 15,
   ARRAY['Lighting', 'Seating', 'Water Station'], 80, TRUE),
  (3, 'Community Basketball Court', 'Community Center', 12,
   ARRAY['Lighting', 'Water Station'], 50, TRUE)
ON CONFLICT (court_number) DO NOTHING;


-- >>> FILE: 15_sync_profiles_from_auth.sql >>>

-- Sync profiles from auth.users registration metadata (fixes missing profile fields)
CREATE OR REPLACE FUNCTION public.sync_profile_from_auth_metadata_internal(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_meta  JSONB;
  v_email TEXT;
  v_first  TEXT;
  v_middle TEXT;
  v_last   TEXT;
  v_suffix TEXT;
  v_name   TEXT;
  v_birth  DATE;
  v_role   public.user_role;
BEGIN
  SELECT email, raw_user_meta_data INTO v_email, v_meta FROM auth.users WHERE id = p_user_id;
  IF v_meta IS NULL THEN RETURN; END IF;

  v_first  := COALESCE(v_meta->>'first_name', '');
  v_middle := NULLIF(COALESCE(v_meta->>'middle_name', ''), '');
  v_last   := COALESCE(v_meta->>'last_name', '');
  v_suffix := NULLIF(COALESCE(v_meta->>'suffix', ''), '');
  v_name := TRIM(CONCAT_WS(' ', v_first, v_middle, v_last)
    || CASE WHEN v_suffix IS NOT NULL AND v_suffix <> '' THEN ', ' || v_suffix ELSE '' END);

  BEGIN v_birth := NULLIF(v_meta->>'birth_date', '')::date;
  EXCEPTION WHEN OTHERS THEN v_birth := NULL; END;

  BEGIN v_role := COALESCE((v_meta->>'role')::public.user_role, 'resident');
  EXCEPTION WHEN OTHERS THEN v_role := 'resident'; END;

  INSERT INTO public.profiles (
    id, email, first_name, last_name, middle_name, suffix, name,
    phone, address, birth_date, gender, civil_status, nationality, role, status
  ) VALUES (
    p_user_id, COALESCE(v_email, v_meta->>'email', ''),
    NULLIF(v_first, ''), NULLIF(v_last, ''), v_middle, v_suffix, NULLIF(v_name, ''),
    NULLIF(v_meta->>'phone', ''), NULLIF(v_meta->>'address', ''), v_birth,
    NULLIF(v_meta->>'gender', ''), NULLIF(v_meta->>'civil_status', ''),
    COALESCE(NULLIF(v_meta->>'nationality', ''), 'Filipino'), v_role, 'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), public.profiles.first_name),
    last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), public.profiles.last_name),
    middle_name = COALESCE(EXCLUDED.middle_name, public.profiles.middle_name),
    suffix = COALESCE(EXCLUDED.suffix, public.profiles.suffix),
    name = COALESCE(NULLIF(EXCLUDED.name, ''), public.profiles.name),
    phone = COALESCE(NULLIF(EXCLUDED.phone, ''), public.profiles.phone),
    address = COALESCE(NULLIF(EXCLUDED.address, ''), public.profiles.address),
    birth_date = COALESCE(EXCLUDED.birth_date, public.profiles.birth_date),
    gender = COALESCE(NULLIF(EXCLUDED.gender, ''), public.profiles.gender),
    civil_status = COALESCE(NULLIF(EXCLUDED.civil_status, ''), public.profiles.civil_status),
    nationality = COALESCE(NULLIF(EXCLUDED.nationality, ''), public.profiles.nationality),
    role = COALESCE(EXCLUDED.role, public.profiles.role),
    updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_profile_from_auth_metadata(p_user_id UUID DEFAULT auth.uid())
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF p_user_id IS NULL THEN RETURN; END IF;
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'You can only sync your own profile.';
  END IF;
  PERFORM public.sync_profile_from_auth_metadata_internal(p_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_profile_from_auth_metadata(UUID) TO authenticated;

DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM auth.users LOOP
    PERFORM public.sync_profile_from_auth_metadata_internal(r.id);
  END LOOP;
END $$;


-- >>> FILE: 16_profile_appointment_fields.sql >>>

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS purok TEXT,
  ADD COLUMN IF NOT EXISTS resident_since TEXT;

UPDATE public.profiles
SET resident_since = EXTRACT(YEAR FROM created_at)::TEXT
WHERE resident_since IS NULL OR TRIM(resident_since) = '';

UPDATE public.profiles SET purok = 'Purok 1', resident_since = '2020'
WHERE email = 'admin@gmail.com' AND (purok IS NULL OR TRIM(purok) = '');

UPDATE public.profiles SET purok = 'Purok 2', resident_since = '2021'
WHERE email = 'staff@gmail.com' AND (purok IS NULL OR TRIM(purok) = '');


-- >>> FILE: 17_appointment_request_submit.sql >>>

ALTER TABLE public.appointment_requests
  ADD COLUMN IF NOT EXISTS request_date DATE;

GRANT SELECT, INSERT, UPDATE ON public.appointment_requests TO authenticated;
GRANT SELECT ON public.certificate_forms TO authenticated;

CREATE OR REPLACE FUNCTION public.create_appointment_request(p_data JSONB)
RETURNS public.appointment_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_row public.appointment_requests;
  v_cert UUID;
  v_dob DATE;
  v_status public.workflow_status;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'You must be logged in to submit an appointment request.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_uid) THEN
    RAISE EXCEPTION 'User profile not found.';
  END IF;
  BEGIN v_cert := NULLIF(p_data->>'certificate_form_id', '')::uuid;
  EXCEPTION WHEN OTHERS THEN v_cert := NULL; END;
  BEGIN v_dob := NULLIF(p_data->>'date_of_birth', '')::date;
  EXCEPTION WHEN OTHERS THEN v_dob := NULL; END;
  BEGIN v_status := COALESCE(NULLIF(lower(p_data->>'status'), ''), 'pending')::public.workflow_status;
  EXCEPTION WHEN OTHERS THEN v_status := 'pending'; END;

  INSERT INTO public.appointment_requests (
    user_id, certificate_form_id, status,
    appointment_date, appointment_time, requested_date, requested_time, request_date,
    user_email, user_name, certificate_name, certificate_type,
    purpose, notes, first_name, middle_name, last_name, address, purok,
    date_of_birth, gender, civil_status, phone_no, resident_since
  ) VALUES (
    v_uid, v_cert, v_status,
    NULLIF(p_data->>'appointment_date', '')::date,
    NULLIF(p_data->>'appointment_time', ''),
    NULLIF(p_data->>'requested_date', '')::date,
    NULLIF(p_data->>'requested_time', ''),
    NULLIF(p_data->>'request_date', '')::date,
    NULLIF(p_data->>'user_email', ''), NULLIF(p_data->>'user_name', ''),
    NULLIF(p_data->>'certificate_name', ''), NULLIF(p_data->>'certificate_type', ''),
    NULLIF(p_data->>'purpose', ''), NULLIF(p_data->>'notes', ''),
    NULLIF(p_data->>'first_name', ''), NULLIF(p_data->>'middle_name', ''),
    NULLIF(p_data->>'last_name', ''), NULLIF(p_data->>'address', ''),
    NULLIF(p_data->>'purok', ''), v_dob,
    NULLIF(p_data->>'gender', ''), NULLIF(p_data->>'civil_status', ''),
    NULLIF(p_data->>'phone_no', ''), NULLIF(p_data->>'resident_since', '')
  )
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_appointment_request(JSONB) TO authenticated;


-- >>> FILE: 18_basketball_reservation_submit.sql >>>

GRANT SELECT ON public.basketball_courts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.basketball_court_reservations TO authenticated;

CREATE OR REPLACE FUNCTION public.create_basketball_reservation(p_data JSONB)
RETURNS public.basketball_court_reservations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_row public.basketball_court_reservations;
  v_court UUID;
  v_status public.workflow_status;
  v_num INTEGER;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'You must be logged in to reserve a basketball court.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_uid) THEN
    RAISE EXCEPTION 'User profile not found.';
  END IF;
  v_num := COALESCE(NULLIF(p_data->>'court_number', '')::integer, 0);
  IF v_num <= 0 THEN RAISE EXCEPTION 'A valid court number is required.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.basketball_courts WHERE court_number = v_num AND is_active = TRUE) THEN
    RAISE EXCEPTION 'Selected basketball court is not available.';
  END IF;
  BEGIN v_court := NULLIF(p_data->>'court_id', '')::uuid;
  EXCEPTION WHEN OTHERS THEN v_court := NULL; END;
  IF v_court IS NULL THEN
    SELECT id INTO v_court FROM public.basketball_courts WHERE court_number = v_num LIMIT 1;
  END IF;
  BEGIN v_status := COALESCE(NULLIF(lower(p_data->>'status'), ''), 'pending')::public.workflow_status;
  EXCEPTION WHEN OTHERS THEN v_status := 'pending'; END;
  IF NULLIF(p_data->>'purpose', '') IS NULL THEN RAISE EXCEPTION 'Purpose is required.'; END IF;
  INSERT INTO public.basketball_court_reservations (
    user_id, court_id, court_number, user_name, user_email,
    reservation_date, start_time, end_time, duration, purpose, status, notes
  ) VALUES (
    v_uid, v_court, v_num,
    COALESCE(NULLIF(p_data->>'user_name', ''), 'Resident'),
    COALESCE(NULLIF(p_data->>'user_email', ''), ''),
    NULLIF(p_data->>'reservation_date', '')::date,
    NULLIF(p_data->>'start_time', ''), NULLIF(p_data->>'end_time', ''),
    GREATEST(1, COALESCE(NULLIF(p_data->>'duration', '')::integer, 1)),
    NULLIF(p_data->>'purpose', ''), v_status, NULLIF(p_data->>'notes', '')
  ) RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_basketball_reservation(JSONB) TO authenticated;


-- >>> FILE: 19_approve_appointment_certificate.sql >>>

ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS is_sample BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_appointment_unique
  ON public.certificates(appointment_id)
  WHERE appointment_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE ON public.certificates TO authenticated;

CREATE OR REPLACE FUNCTION public.update_appointment_request_status(p_id UUID, p_status TEXT)
RETURNS public.appointment_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.appointment_requests;
  v_status public.workflow_status;
  v_name TEXT;
  v_cert_status public.workflow_status;
BEGIN
  IF public.current_user_role() NOT IN ('admin', 'staff') THEN
    RAISE EXCEPTION 'Only admin or staff can update appointment status.';
  END IF;
  BEGIN v_status := lower(COALESCE(p_status, 'pending'))::public.workflow_status;
  EXCEPTION WHEN OTHERS THEN RAISE EXCEPTION 'Invalid appointment status: %', p_status; END;
  UPDATE public.appointment_requests SET status = v_status, updated_at = NOW()
  WHERE id = p_id RETURNING * INTO v_row;
  IF NOT FOUND THEN RAISE EXCEPTION 'Appointment request not found.'; END IF;
  IF v_status IN ('approved', 'completed') THEN
    v_name := TRIM(CONCAT_WS(' ', v_row.first_name, v_row.middle_name, v_row.last_name));
    IF v_name = '' THEN v_name := COALESCE(v_row.user_name, 'Resident'); END IF;
    v_cert_status := CASE WHEN v_status = 'completed' THEN 'issued'::public.workflow_status ELSE 'approved'::public.workflow_status END;
    INSERT INTO public.certificates (
      user_id, appointment_id, user_name, certificate_type, certificate_number, status,
      request_date, issued_date, purpose, notes, address, gender, civil_status, date_of_birth, resident_since, is_sample
    ) VALUES (
      v_row.user_id, v_row.id, v_name, COALESCE(v_row.certificate_type, v_row.certificate_name, 'Certificate'),
      'CERT-' || UPPER(SUBSTRING(v_row.id::text FROM 1 FOR 8)), v_cert_status,
      COALESCE(v_row.request_date, v_row.requested_date, CURRENT_DATE),
      CASE WHEN v_status = 'completed' THEN CURRENT_DATE ELSE NULL END,
      v_row.purpose, v_row.notes, v_row.address, v_row.gender, v_row.civil_status, v_row.date_of_birth, v_row.resident_since, FALSE
    ) ON CONFLICT (appointment_id) WHERE (appointment_id IS NOT NULL) DO UPDATE SET
      status = EXCLUDED.status,
      issued_date = COALESCE(EXCLUDED.issued_date, public.certificates.issued_date),
      purpose = COALESCE(EXCLUDED.purpose, public.certificates.purpose),
      notes = COALESCE(EXCLUDED.notes, public.certificates.notes),
      updated_at = NOW();
  END IF;
  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_appointment_request_status(UUID, TEXT) TO authenticated;


-- >>> FILE: 21_fix_certificate_approve_conflict.sql >>>
-- (Same as 19 — re-run 21_fix_certificate_approve_conflict.sql if approve still errors)


-- >>> FILE: 20_seed_certificate_museum.sql >>>

-- =============================================================================
-- Barangay System | 20_seed_certificate_museum.sql
-- Sample certificates for Certificate Museum (preview + PDF export testing)
-- Run after demo_accounts.sql (needs admin@gmail.com profile)
-- SAFE TO RE-RUN
-- =============================================================================

ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS is_sample BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.certificates.is_sample IS 'TRUE = museum sample/preview certificate';

DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  SELECT id INTO v_admin_id FROM public.profiles WHERE email = 'admin@gmail.com' LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE NOTICE 'admin@gmail.com not found — run demo_accounts.sql first.';
    RETURN;
  END IF;

  INSERT INTO public.certificates (
    user_id, user_name, certificate_type, certificate_number, status, is_sample,
    request_date, issued_date, purpose, address, gender, civil_status, date_of_birth,
    notes, resident_since
  )
  SELECT
    v_admin_id, 'Juan Dela Cruz', 'Barangay Clearance', 'SAMPLE-BC-001', 'issued', TRUE,
    CURRENT_DATE - 30, CURRENT_DATE - 28, 'Employment Requirement',
    '123 Rizal Street, Purok 1, Old Cabalan, Olongapo City, Zambales',
    'Male', 'Single', '1990-05-15',
    'Museum sample — Barangay Clearance preview. NO DEROGATORY RECORD on file.',
    '2015'
  WHERE NOT EXISTS (SELECT 1 FROM public.certificates WHERE certificate_number = 'SAMPLE-BC-001');

  INSERT INTO public.certificates (
    user_id, user_name, certificate_type, certificate_number, status, is_sample,
    request_date, issued_date, purpose, address, gender, civil_status, date_of_birth, notes
  )
  SELECT
    v_admin_id, 'Maria Santos', 'Certificate of Indigency', 'SAMPLE-COI-002', 'issued', TRUE,
    CURRENT_DATE - 20, CURRENT_DATE - 18, 'Medical / Government Assistance',
    '456 Mabini Avenue, Purok 2, Old Cabalan, Olongapo City, Zambales',
    'Female', 'Married', '1985-08-20',
    'Museum sample — Certificate of Indigency preview for indigent residents.'
  WHERE NOT EXISTS (SELECT 1 FROM public.certificates WHERE certificate_number = 'SAMPLE-COI-002');

  INSERT INTO public.certificates (
    user_id, user_name, certificate_type, certificate_number, status, is_sample,
    request_date, issued_date, purpose, address, gender, civil_status, date_of_birth,
    notes, resident_since
  )
  SELECT
    v_admin_id, 'Pedro Reyes', 'Certificate of Residency', 'SAMPLE-COR-003', 'issued', TRUE,
    CURRENT_DATE - 15, CURRENT_DATE - 14, 'School Enrollment',
    '789 Bonifacio Street, Purok 3, Old Cabalan, Olongapo City, Zambales',
    'Male', 'Married', '1982-01-10',
    'Museum sample — Certificate of Residency preview.',
    '2010'
  WHERE NOT EXISTS (SELECT 1 FROM public.certificates WHERE certificate_number = 'SAMPLE-COR-003');

  INSERT INTO public.certificates (
    user_id, user_name, certificate_type, certificate_number, status, is_sample,
    request_date, issued_date, expiry_date, purpose, address, gender, civil_status,
    date_of_birth, notes, resident_since
  )
  SELECT
    v_admin_id, 'Ana Mendoza', 'Barangay Business Clearance', 'SAMPLE-BBC-004', 'issued', TRUE,
    CURRENT_DATE - 10, CURRENT_DATE - 8, CURRENT_DATE + 355,
    'Sari-Sari Store Permit', '12 Commerce Lane, Purok 4, Old Cabalan, Olongapo City, Zambales',
    'Female', 'Single', '1993-11-25',
    'Museum sample — Barangay Business Clearance preview. Business: Ana''s Mini Mart.',
    '2018'
  WHERE NOT EXISTS (SELECT 1 FROM public.certificates WHERE certificate_number = 'SAMPLE-BBC-004');

END $$;

