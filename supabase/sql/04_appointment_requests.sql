-- =============================================================================
-- Barangay System | 04_appointment_requests.sql
-- Certificate appointment / request records
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.appointment_requests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  certificate_form_id   UUID REFERENCES public.certificate_forms(id) ON DELETE SET NULL,
  status                public.workflow_status NOT NULL DEFAULT 'pending',
  appointment_date      DATE,
  appointment_time      TEXT,
  requested_date        DATE,
  requested_time        TEXT,
  request_date          DATE,
  user_email            TEXT,
  user_name             TEXT,
  certificate_name      TEXT,
  certificate_type      TEXT,
  purpose               TEXT,
  notes                 TEXT,
  first_name            TEXT,
  middle_name           TEXT,
  last_name             TEXT,
  address               TEXT,
  purok                 TEXT,
  date_of_birth         DATE,
  gender                TEXT,
  civil_status          TEXT,
  phone_no              TEXT,
  resident_since        TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointment_requests_user ON public.appointment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_appointment_requests_status ON public.appointment_requests(status);
CREATE INDEX IF NOT EXISTS idx_appointment_requests_created ON public.appointment_requests(created_at DESC);

COMMENT ON TABLE public.appointment_requests IS 'Resident certificate appointment requests';
