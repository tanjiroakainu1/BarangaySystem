-- =============================================================================
-- Barangay System | demo/demo_accounts.sql
-- DEMO ACCOUNTS — SAFE TO RE-RUN (idempotent)
-- Run AFTER 00_main_all_in_one.sql (or core schema)
--
-- Login credentials:
--   admin@gmail.com              / admin123   (admin)
--   admin@example.com            / admin123   (admin)
--   col.2023010508@lsb.edu.ph    / admin123   (admin)
--   staff@gmail.com              / staff123   (staff)
--
-- If emails already exist in auth.users (e.g. from Supabase Dashboard signup),
-- this script reuses those user IDs and updates profiles — no duplicate email error.
-- =============================================================================

-- Required for crypt() / gen_salt() password hashing (Supabase: extensions schema)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.demo_upsert_account(
  p_preferred_id   UUID,
  p_email          TEXT,
  p_password       TEXT,
  p_meta           JSONB,
  p_first_name     TEXT,
  p_last_name      TEXT,
  p_middle_name    TEXT,
  p_name           TEXT,
  p_phone          TEXT,
  p_address        TEXT,
  p_birth_date     DATE,
  p_gender         TEXT,
  p_civil_status   TEXT,
  p_nationality    TEXT,
  p_role           public.user_role,
  p_position       TEXT DEFAULT NULL,
  p_department     TEXT DEFAULT NULL,
  p_employee_id    TEXT DEFAULT NULL,
  p_hire_date      DATE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_instance_id UUID;
  v_user_id     UUID;
  v_password_hash TEXT;
BEGIN
  v_password_hash := extensions.crypt(p_password, extensions.gen_salt('bf'::text));
  -- Reuse existing auth user when email already registered
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email
  LIMIT 1;

  SELECT id INTO v_instance_id FROM auth.instances LIMIT 1;
  IF v_instance_id IS NULL THEN
    v_instance_id := '00000000-0000-0000-0000-000000000000';
  END IF;

  IF v_user_id IS NULL THEN
    v_user_id := p_preferred_id;

    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) VALUES (
      v_user_id, v_instance_id, 'authenticated', 'authenticated',
      p_email, v_password_hash,
      NOW(), '{"provider":"email","providers":["email"]}',
      p_meta,
      NOW(), NOW(), '', '', '', ''
    );
  ELSE
    -- Account exists — refresh demo password + metadata
    UPDATE auth.users SET
      encrypted_password   = v_password_hash,
      raw_user_meta_data   = p_meta,
      email_confirmed_at   = COALESCE(email_confirmed_at, NOW()),
      updated_at           = NOW()
    WHERE id = v_user_id;
  END IF;

  -- Ensure email identity exists
  IF EXISTS (
    SELECT 1 FROM auth.identities
    WHERE user_id = v_user_id AND provider = 'email'
  ) THEN
    UPDATE auth.identities SET
      provider_id   = p_email,
      identity_data = jsonb_build_object(
        'sub', v_user_id::text,
        'email', p_email,
        'email_verified', true,
        'phone_verified', false
      ),
      updated_at = NOW()
    WHERE user_id = v_user_id AND provider = 'email';
  ELSE
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', p_email,
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      p_email,
      NOW(), NOW(), NOW()
    );
  END IF;

  -- Remove stale profile row with same email but different id (demo cleanup only)
  DELETE FROM public.profiles
  WHERE email = p_email
    AND id <> v_user_id;

  INSERT INTO public.profiles (
    id, email, first_name, last_name, middle_name, name,
    phone, address, birth_date, gender, civil_status, nationality,
    role, status, position, department, employee_id, hire_date
  ) VALUES (
    v_user_id, p_email, p_first_name, p_last_name, p_middle_name, p_name,
    p_phone, p_address, p_birth_date, p_gender, p_civil_status, p_nationality,
    p_role, 'active', p_position, p_department, p_employee_id, p_hire_date
  )
  ON CONFLICT (id) DO UPDATE SET
    email         = EXCLUDED.email,
    first_name    = EXCLUDED.first_name,
    last_name     = EXCLUDED.last_name,
    middle_name   = EXCLUDED.middle_name,
    name          = EXCLUDED.name,
    phone         = EXCLUDED.phone,
    address       = EXCLUDED.address,
    birth_date    = EXCLUDED.birth_date,
    gender        = EXCLUDED.gender,
    civil_status  = EXCLUDED.civil_status,
    nationality   = EXCLUDED.nationality,
    role          = EXCLUDED.role,
    status        = 'active',
    position      = EXCLUDED.position,
    department    = EXCLUDED.department,
    employee_id   = EXCLUDED.employee_id,
    hire_date     = EXCLUDED.hire_date,
    updated_at    = NOW();

  RETURN v_user_id;
END;
$$;

-- Seed all demo accounts
SELECT public.demo_upsert_account(
  'a0000001-0000-4000-8000-000000000001',
  'admin@gmail.com', 'admin123',
  '{"first_name":"Admin","last_name":"User","role":"admin"}'::jsonb,
  'Admin', 'User', 'Reyes', 'Admin Reyes User',
  '09171234567', 'Barangay Hall, Old Cabalan, Olongapo City, Zambales',
  '1985-03-12', 'Male', 'Married', 'Filipino', 'admin',
  'System Administrator', 'Barangay IT & Records', 'ADM-001', '2020-01-15'
);

SELECT public.demo_upsert_account(
  'a0000002-0000-4000-8000-000000000002',
  'admin@example.com', 'admin123',
  '{"first_name":"Luvly","last_name":"Espiritu","role":"admin"}'::jsonb,
  'Luvly', 'Espiritu', 'Santos', 'Luvly Santos Espiritu',
  '09181234567', '456 Rizal Street, Old Cabalan, Olongapo City',
  '1992-07-22', 'Female', 'Single', 'Filipino', 'admin',
  'Barangay Secretary', 'Barangay Administration', 'ADM-002', '2021-06-01'
);

SELECT public.demo_upsert_account(
  'a0000003-0000-4000-8000-000000000003',
  'col.2023010508@lsb.edu.ph', 'admin123',
  '{"first_name":"Cristian","last_name":"Cayanan","role":"admin"}'::jsonb,
  'Cristian', 'Cayanan', 'Garcia', 'Cristian Garcia Cayanan',
  '09191234567', '789 Mabini Avenue, Old Cabalan, Olongapo City',
  '1998-11-05', 'Male', 'Single', 'Filipino', 'admin',
  'Barangay Administrator', 'Barangay Operations', 'ADM-003', '2022-08-15'
);

SELECT public.demo_upsert_account(
  'b0000001-0000-4000-8000-000000000001',
  'staff@gmail.com', 'staff123',
  '{"first_name":"Staff","last_name":"User","role":"staff"}'::jsonb,
  'Staff', 'User', 'Dela', 'Staff Dela User',
  '09201234567', '321 Purok 3, Old Cabalan, Olongapo City, Zambales',
  '1990-09-18', 'Female', 'Married', 'Filipino', 'staff',
  'Barangay Staff', 'Citizen Services', 'STF-001', '2019-04-10'
);

-- Optional: drop helper after seed (comment out to keep for re-runs)
-- DROP FUNCTION IF EXISTS public.demo_upsert_account;
