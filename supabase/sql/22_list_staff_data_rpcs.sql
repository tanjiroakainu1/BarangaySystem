-- =============================================================================
-- Barangay System | 22_list_staff_data_rpcs.sql
-- Reliable staff/admin data reads (bypasses RLS timing issues)
-- Run after 21_fix_certificate_approve_conflict.sql
-- SAFE TO RE-RUN
-- =============================================================================

-- All certificate appointment requests (admin/staff)
CREATE OR REPLACE FUNCTION public.list_appointment_requests()
RETURNS SETOF public.appointment_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.current_user_role() NOT IN ('admin', 'staff') THEN
    RAISE EXCEPTION 'Only admin or staff can list all appointment requests.';
  END IF;
  RETURN QUERY
    SELECT * FROM public.appointment_requests
    ORDER BY created_at DESC;
END;
$$;

-- All certificates including museum samples (admin/staff)
CREATE OR REPLACE FUNCTION public.list_certificates()
RETURNS SETOF public.certificates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.current_user_role() NOT IN ('admin', 'staff') THEN
    RAISE EXCEPTION 'Only admin or staff can list all certificates.';
  END IF;
  RETURN QUERY
    SELECT * FROM public.certificates
    ORDER BY created_at DESC;
END;
$$;

-- All basketball reservations (admin/staff)
CREATE OR REPLACE FUNCTION public.list_basketball_reservations()
RETURNS SETOF public.basketball_court_reservations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.current_user_role() NOT IN ('admin', 'staff') THEN
    RAISE EXCEPTION 'Only admin or staff can list all basketball reservations.';
  END IF;
  RETURN QUERY
    SELECT * FROM public.basketball_court_reservations
    ORDER BY created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_appointment_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_certificates() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_basketball_reservations() TO authenticated;
