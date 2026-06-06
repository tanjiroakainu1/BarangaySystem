-- =============================================================================
-- Barangay System | 09_rls_policies.sql
-- System settings table + Row Level Security policies
-- Safe to copy-paste and re-run.
-- =============================================================================

-- ----- PROFILE PASSWORD TRACKING (password stored in auth.users) -----
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.password_changed_at IS
  'Timestamp of last password change (password stored in auth.users)';



-- ----- SYSTEM SETTINGS TABLE (create before RLS) -----

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

-- Remove deprecated preference columns (safe if already removed)
ALTER TABLE public.system_settings DROP COLUMN IF EXISTS email_notifications;
ALTER TABLE public.system_settings DROP COLUMN IF EXISTS sms_notifications;
ALTER TABLE public.system_settings DROP COLUMN IF EXISTS auto_approve_documents;

DROP TRIGGER IF EXISTS trg_system_settings_updated_at ON public.system_settings;

CREATE TRIGGER trg_system_settings_updated_at

  BEFORE UPDATE ON public.system_settings

  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();



-- ----- ENABLE ROW LEVEL SECURITY -----

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

