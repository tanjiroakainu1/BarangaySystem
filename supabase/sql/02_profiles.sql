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
