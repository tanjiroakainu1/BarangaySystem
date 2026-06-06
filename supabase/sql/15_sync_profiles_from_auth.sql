-- =============================================================================
-- Barangay System | 15_sync_profiles_from_auth.sql
-- Sync profiles from auth.users registration metadata (fixes missing profile fields)
-- Run after 14_profile_registration_fields.sql
-- SAFE TO RE-RUN
-- =============================================================================

-- Internal: copy raw_user_meta_data → profiles (no auth check — SQL editor / triggers)
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
  SELECT email, raw_user_meta_data
  INTO v_email, v_meta
  FROM auth.users
  WHERE id = p_user_id;

  IF v_meta IS NULL THEN
    RETURN;
  END IF;

  v_first  := COALESCE(v_meta->>'first_name', '');
  v_middle := NULLIF(COALESCE(v_meta->>'middle_name', ''), '');
  v_last   := COALESCE(v_meta->>'last_name', '');
  v_suffix := NULLIF(COALESCE(v_meta->>'suffix', ''), '');

  v_name := TRIM(
    CONCAT_WS(' ', v_first, v_middle, v_last)
    || CASE WHEN v_suffix IS NOT NULL AND v_suffix <> '' THEN ', ' || v_suffix ELSE '' END
  );

  BEGIN
    v_birth := NULLIF(v_meta->>'birth_date', '')::date;
  EXCEPTION WHEN OTHERS THEN
    v_birth := NULL;
  END;

  BEGIN
    v_role := COALESCE((v_meta->>'role')::public.user_role, 'resident');
  EXCEPTION WHEN OTHERS THEN
    v_role := 'resident';
  END;

  INSERT INTO public.profiles (
    id, email, first_name, last_name, middle_name, suffix, name,
    phone, address, birth_date, gender, civil_status, nationality, role, status
  ) VALUES (
    p_user_id,
    COALESCE(v_email, v_meta->>'email', ''),
    NULLIF(v_first, ''),
    NULLIF(v_last, ''),
    v_middle,
    v_suffix,
    NULLIF(v_name, ''),
    NULLIF(v_meta->>'phone', ''),
    NULLIF(v_meta->>'address', ''),
    v_birth,
    NULLIF(v_meta->>'gender', ''),
    NULLIF(v_meta->>'civil_status', ''),
    COALESCE(NULLIF(v_meta->>'nationality', ''), 'Filipino'),
    v_role,
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    email         = COALESCE(EXCLUDED.email, public.profiles.email),
    first_name    = COALESCE(NULLIF(EXCLUDED.first_name, ''), public.profiles.first_name),
    last_name     = COALESCE(NULLIF(EXCLUDED.last_name, ''), public.profiles.last_name),
    middle_name   = COALESCE(EXCLUDED.middle_name, public.profiles.middle_name),
    suffix        = COALESCE(EXCLUDED.suffix, public.profiles.suffix),
    name          = COALESCE(NULLIF(EXCLUDED.name, ''), public.profiles.name),
    phone         = COALESCE(NULLIF(EXCLUDED.phone, ''), public.profiles.phone),
    address       = COALESCE(NULLIF(EXCLUDED.address, ''), public.profiles.address),
    birth_date    = COALESCE(EXCLUDED.birth_date, public.profiles.birth_date),
    gender        = COALESCE(NULLIF(EXCLUDED.gender, ''), public.profiles.gender),
    civil_status  = COALESCE(NULLIF(EXCLUDED.civil_status, ''), public.profiles.civil_status),
    nationality   = COALESCE(NULLIF(EXCLUDED.nationality, ''), public.profiles.nationality),
    role          = COALESCE(EXCLUDED.role, public.profiles.role),
    updated_at    = NOW();
END;
$$;

-- RPC: residents can sync their own profile after login (auth.uid() must match)
CREATE OR REPLACE FUNCTION public.sync_profile_from_auth_metadata(p_user_id UUID DEFAULT auth.uid())
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'You can only sync your own profile.';
  END IF;

  PERFORM public.sync_profile_from_auth_metadata_internal(p_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_profile_from_auth_metadata(UUID) TO authenticated;

-- Backfill ALL existing users (e.g. magnuscarlsen1@gmail.com registered before full save)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM auth.users LOOP
    PERFORM public.sync_profile_from_auth_metadata_internal(r.id);
  END LOOP;
END $$;
