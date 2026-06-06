-- =============================================================================
-- Barangay System | 12_system_settings.sql
-- Optional standalone — table + seed are already included in 09_rls_policies.sql
-- Run this only if you need the table without re-applying RLS policies.
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
