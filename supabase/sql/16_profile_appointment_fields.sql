-- =============================================================================
-- Barangay System | 16_profile_appointment_fields.sql
-- Store purok + resident_since on profiles for appointment auto-fill
-- Run after 15_sync_profiles_from_auth.sql
-- SAFE TO RE-RUN
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS purok TEXT,
  ADD COLUMN IF NOT EXISTS resident_since TEXT;

COMMENT ON COLUMN public.profiles.purok IS 'Barangay purok/zone — reused on certificate appointment requests';
COMMENT ON COLUMN public.profiles.resident_since IS 'Year resident moved to barangay — reused on appointment requests';

-- Backfill resident_since from account creation year when missing
UPDATE public.profiles
SET resident_since = EXTRACT(YEAR FROM created_at)::TEXT
WHERE resident_since IS NULL OR TRIM(resident_since) = '';

-- Demo admin/staff: sample purok values
UPDATE public.profiles SET purok = 'Purok 1', resident_since = '2020'
WHERE email = 'admin@gmail.com' AND (purok IS NULL OR TRIM(purok) = '');

UPDATE public.profiles SET purok = 'Purok 2', resident_since = '2021'
WHERE email = 'staff@gmail.com' AND (purok IS NULL OR TRIM(purok) = '');
