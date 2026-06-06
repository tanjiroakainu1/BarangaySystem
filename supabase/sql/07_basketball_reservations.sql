-- =============================================================================
-- Barangay System | 07_basketball_reservations.sql
-- Basketball court booking / reservation records
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.basketball_court_reservations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  court_id          UUID REFERENCES public.basketball_courts(id) ON DELETE SET NULL,
  court_number      INTEGER NOT NULL,
  user_name         TEXT NOT NULL,
  user_email        TEXT NOT NULL,
  reservation_date  DATE NOT NULL,
  start_time        TEXT NOT NULL,
  end_time          TEXT NOT NULL,
  duration          INTEGER NOT NULL DEFAULT 1,
  purpose           TEXT NOT NULL,
  status            public.workflow_status NOT NULL DEFAULT 'pending',
  notes             TEXT,
  approved_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_basketball_reservations_user ON public.basketball_court_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_basketball_reservations_court ON public.basketball_court_reservations(court_number);
CREATE INDEX IF NOT EXISTS idx_basketball_reservations_date ON public.basketball_court_reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_basketball_reservations_status ON public.basketball_court_reservations(status);

COMMENT ON TABLE public.basketball_court_reservations IS 'Basketball court reservation requests';
