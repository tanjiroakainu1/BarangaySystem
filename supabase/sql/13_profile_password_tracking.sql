-- =============================================================================
-- Barangay System | 13_profile_password_tracking.sql
-- Track last password change on profiles (password itself lives in auth.users)
-- Safe to copy-paste and re-run.
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.password_changed_at IS
  'Timestamp of last password change (password stored in auth.users)';
