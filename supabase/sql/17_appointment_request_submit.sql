-- =============================================================================
-- Barangay System | 17_appointment_request_submit.sql
-- Fix appointment submission: grants + secure RPC insert
-- Run after 16_profile_appointment_fields.sql
-- SAFE TO RE-RUN
-- =============================================================================

ALTER TABLE public.appointment_requests
  ADD COLUMN IF NOT EXISTS request_date DATE;

COMMENT ON COLUMN public.appointment_requests.request_date IS 'Date the resident submitted the request form';

GRANT SELECT, INSERT, UPDATE ON public.appointment_requests TO authenticated;
GRANT SELECT ON public.certificate_forms TO authenticated;

-- Secure insert: always uses auth.uid() as user_id (ignores client-sent user id)
CREATE OR REPLACE FUNCTION public.create_appointment_request(p_data JSONB)
RETURNS public.appointment_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid   UUID := auth.uid();
  v_row   public.appointment_requests;
  v_cert  UUID;
  v_dob   DATE;
  v_status public.workflow_status;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'You must be logged in to submit an appointment request.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_uid) THEN
    RAISE EXCEPTION 'User profile not found. Please complete registration or contact the barangay office.';
  END IF;

  BEGIN
    v_cert := NULLIF(p_data->>'certificate_form_id', '')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_cert := NULL;
  END;

  BEGIN
    v_dob := NULLIF(p_data->>'date_of_birth', '')::date;
  EXCEPTION WHEN OTHERS THEN
    v_dob := NULL;
  END;

  BEGIN
    v_status := COALESCE(NULLIF(lower(p_data->>'status'), ''), 'pending')::public.workflow_status;
  EXCEPTION WHEN OTHERS THEN
    v_status := 'pending';
  END;

  INSERT INTO public.appointment_requests (
    user_id,
    certificate_form_id,
    status,
    appointment_date,
    appointment_time,
    requested_date,
    requested_time,
    request_date,
    user_email,
    user_name,
    certificate_name,
    certificate_type,
    purpose,
    notes,
    first_name,
    middle_name,
    last_name,
    address,
    purok,
    date_of_birth,
    gender,
    civil_status,
    phone_no,
    resident_since
  ) VALUES (
    v_uid,
    v_cert,
    v_status,
    NULLIF(p_data->>'appointment_date', '')::date,
    NULLIF(p_data->>'appointment_time', ''),
    NULLIF(p_data->>'requested_date', '')::date,
    NULLIF(p_data->>'requested_time', ''),
    NULLIF(p_data->>'request_date', '')::date,
    NULLIF(p_data->>'user_email', ''),
    NULLIF(p_data->>'user_name', ''),
    NULLIF(p_data->>'certificate_name', ''),
    NULLIF(p_data->>'certificate_type', ''),
    NULLIF(p_data->>'purpose', ''),
    NULLIF(p_data->>'notes', ''),
    NULLIF(p_data->>'first_name', ''),
    NULLIF(p_data->>'middle_name', ''),
    NULLIF(p_data->>'last_name', ''),
    NULLIF(p_data->>'address', ''),
    NULLIF(p_data->>'purok', ''),
    v_dob,
    NULLIF(p_data->>'gender', ''),
    NULLIF(p_data->>'civil_status', ''),
    NULLIF(p_data->>'phone_no', ''),
    NULLIF(p_data->>'resident_since', '')
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_appointment_request(JSONB) TO authenticated;
