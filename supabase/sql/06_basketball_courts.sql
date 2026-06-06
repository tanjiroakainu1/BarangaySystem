-- =============================================================================
-- Barangay System | 06_basketball_courts.sql
-- Basketball court definitions
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.basketball_courts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_number        INTEGER NOT NULL UNIQUE,
  name                TEXT NOT NULL,
  location            TEXT NOT NULL DEFAULT 'Barangay Sports Complex',
  capacity            INTEGER NOT NULL DEFAULT 20,
  amenities           TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  hourly_rate         NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  maintenance_start   DATE,
  maintenance_end     DATE,
  maintenance_reason  TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_basketball_courts_number ON public.basketball_courts(court_number);
CREATE INDEX IF NOT EXISTS idx_basketball_courts_active ON public.basketball_courts(is_active);

COMMENT ON TABLE public.basketball_courts IS 'Barangay basketball court facilities';
