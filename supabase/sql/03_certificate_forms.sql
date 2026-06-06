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
