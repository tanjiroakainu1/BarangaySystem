-- =============================================================================
-- Barangay System | 18_basketball_reservation_submit.sql
-- Fix basketball court reservation submission: grants + secure RPC
-- Run after 17_appointment_request_submit.sql
-- SAFE TO RE-RUN
-- =============================================================================

GRANT SELECT ON public.basketball_courts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.basketball_court_reservations TO authenticated;

CREATE OR REPLACE FUNCTION public.create_basketball_reservation(p_data JSONB)
RETURNS public.basketball_court_reservations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid    UUID := auth.uid();
  v_row    public.basketball_court_reservations;
  v_court  UUID;
  v_status public.workflow_status;
  v_num    INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'You must be logged in to reserve a basketball court.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_uid) THEN
    RAISE EXCEPTION 'User profile not found. Please complete your profile first.';
  END IF;

  v_num := COALESCE(NULLIF(p_data->>'court_number', '')::integer, 0);
  IF v_num <= 0 THEN
    RAISE EXCEPTION 'A valid court number is required.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.basketball_courts
    WHERE court_number = v_num AND is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'Selected basketball court is not available.';
  END IF;

  BEGIN
    v_court := NULLIF(p_data->>'court_id', '')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_court := NULL;
  END;

  IF v_court IS NULL THEN
    SELECT id INTO v_court FROM public.basketball_courts WHERE court_number = v_num LIMIT 1;
  END IF;

  BEGIN
    v_status := COALESCE(NULLIF(lower(p_data->>'status'), ''), 'pending')::public.workflow_status;
  EXCEPTION WHEN OTHERS THEN
    v_status := 'pending';
  END;

  IF NULLIF(p_data->>'purpose', '') IS NULL THEN
    RAISE EXCEPTION 'Purpose is required.';
  END IF;

  INSERT INTO public.basketball_court_reservations (
    user_id,
    court_id,
    court_number,
    user_name,
    user_email,
    reservation_date,
    start_time,
    end_time,
    duration,
    purpose,
    status,
    notes
  ) VALUES (
    v_uid,
    v_court,
    v_num,
    COALESCE(NULLIF(p_data->>'user_name', ''), 'Resident'),
    COALESCE(NULLIF(p_data->>'user_email', ''), ''),
    NULLIF(p_data->>'reservation_date', '')::date,
    NULLIF(p_data->>'start_time', ''),
    NULLIF(p_data->>'end_time', ''),
    GREATEST(1, COALESCE(NULLIF(p_data->>'duration', '')::integer, 1)),
    NULLIF(p_data->>'purpose', ''),
    v_status,
    NULLIF(p_data->>'notes', '')
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_basketball_reservation(JSONB) TO authenticated;
