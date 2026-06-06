-- =============================================================================
-- Barangay System | 14_profile_registration_fields.sql
-- Persist full registration data on profiles + demo admin/staff details
-- Run after 08_functions_and_triggers.sql (or re-run 00_main_all_in_one.sql)
-- =============================================================================

-- Save all registration metadata when a new auth user is created
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

-- Demo admin profiles (full personal information)
UPDATE public.profiles SET
  middle_name   = 'Reyes',
  suffix        = NULL,
  name          = 'Admin Reyes User',
  phone         = '09171234567',
  address       = 'Barangay Hall, Old Cabalan, Olongapo City, Zambales',
  birth_date    = '1985-03-12',
  gender        = 'Male',
  civil_status  = 'Married',
  nationality   = 'Filipino',
  position      = 'System Administrator',
  department    = 'Barangay IT & Records',
  employee_id   = 'ADM-001',
  hire_date     = '2020-01-15'
WHERE email = 'admin@gmail.com';

UPDATE public.profiles SET
  middle_name   = 'Santos',
  name          = 'Luvly Santos Espiritu',
  phone         = '09181234567',
  address       = '456 Rizal Street, Old Cabalan, Olongapo City',
  birth_date    = '1992-07-22',
  gender        = 'Female',
  civil_status  = 'Single',
  nationality   = 'Filipino',
  position      = 'Barangay Secretary',
  department    = 'Barangay Administration',
  employee_id   = 'ADM-002',
  hire_date     = '2021-06-01'
WHERE email = 'admin@example.com';

UPDATE public.profiles SET
  middle_name   = 'Garcia',
  name          = 'Cristian Garcia Cayanan',
  phone         = '09191234567',
  address       = '789 Mabini Avenue, Old Cabalan, Olongapo City',
  birth_date    = '1998-11-05',
  gender        = 'Male',
  civil_status  = 'Single',
  nationality   = 'Filipino',
  position      = 'Barangay Administrator',
  department    = 'Barangay Operations',
  employee_id   = 'ADM-003',
  hire_date     = '2022-08-15'
WHERE email = 'col.2023010508@lsb.edu.ph';

-- Demo staff profile (full personal + employment information)
UPDATE public.profiles SET
  middle_name   = 'Dela',
  name          = 'Staff Dela User',
  phone         = '09201234567',
  address       = '321 Purok 3, Old Cabalan, Olongapo City, Zambales',
  birth_date    = '1990-09-18',
  gender        = 'Female',
  civil_status  = 'Married',
  nationality   = 'Filipino',
  position      = 'Barangay Staff',
  department    = 'Citizen Services',
  employee_id   = 'STF-001',
  hire_date     = '2019-04-10'
WHERE email = 'staff@gmail.com';
