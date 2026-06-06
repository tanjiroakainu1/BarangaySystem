-- =============================================================================
-- Barangay System | 05_certificates.sql
-- Issued certificate records
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.certificates (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  appointment_id      UUID REFERENCES public.appointment_requests(id) ON DELETE SET NULL,
  user_name           TEXT NOT NULL,
  certificate_type    TEXT NOT NULL,
  certificate_number  TEXT UNIQUE,
  status              public.workflow_status NOT NULL DEFAULT 'pending',
  request_date        DATE,
  issued_date         DATE,
  expiry_date         DATE,
  purpose             TEXT,
  notes               TEXT,
  address             TEXT,
  gender              TEXT,
  civil_status        TEXT,
  date_of_birth       DATE,
  resident_since      TEXT,
  is_sample           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certificates_user ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON public.certificates(status);
CREATE INDEX IF NOT EXISTS idx_certificates_appointment ON public.certificates(appointment_id);

-- One certificate per appointment (required for approve upsert ON CONFLICT)
CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_appointment_unique
  ON public.certificates(appointment_id)
  WHERE appointment_id IS NOT NULL;

COMMENT ON TABLE public.certificates IS 'Issued barangay certificates and clearances';
