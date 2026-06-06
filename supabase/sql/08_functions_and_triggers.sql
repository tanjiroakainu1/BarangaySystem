-- =============================================================================
-- Barangay System | 08_functions_and_triggers.sql
-- Auto timestamps, profile creation on signup
--
-- AUTH NOTE: Passwords live in auth.users (Supabase Auth), not in profiles.
-- After self-registration, the Angular app signs the user out and sends them
-- to /login to sign in manually. In Supabase Dashboard > Auth > Providers >
-- Email, you may disable "Confirm email" so new accounts work immediately
-- after first login.
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
