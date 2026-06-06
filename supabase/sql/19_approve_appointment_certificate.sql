-- =============================================================================
-- Barangay System | 19_approve_appointment_certificate.sql
-- Create resident-visible certificates when appointments are approved
-- Run after 18_basketball_reservation_submit.sql
-- SAFE TO RE-RUN
-- =============================================================================

ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS is_sample BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_appointment_unique
  ON public.certificates(appointment_id)
  WHERE appointment_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE ON public.certificates TO authenticated;

-- Update appointment status + auto-create/update linked certificate
CREATE OR REPLACE FUNCTION public.update_appointment_request_status(
  p_id UUID,
  p_status TEXT
)
RETURNS public.appointment_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row   public.appointment_requests;
  v_status public.workflow_status;
  v_name  TEXT;
  v_cert_status public.workflow_status;
BEGIN
  IF public.current_user_role() NOT IN ('admin', 'staff') THEN
    RAISE EXCEPTION 'Only admin or staff can update appointment status.';
  END IF;

  BEGIN
    v_status := lower(COALESCE(p_status, 'pending'))::public.workflow_status;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Invalid appointment status: %', p_status;
  END;

  UPDATE public.appointment_requests
  SET status = v_status, updated_at = NOW()
  WHERE id = p_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment request not found.';
  END IF;

  IF v_status IN ('approved', 'completed') THEN
    v_name := TRIM(CONCAT_WS(' ', v_row.first_name, v_row.middle_name, v_row.last_name));
    IF v_name = '' THEN v_name := COALESCE(v_row.user_name, 'Resident'); END IF;

    v_cert_status := CASE WHEN v_status = 'completed' THEN 'issued'::public.workflow_status
                          ELSE 'approved'::public.workflow_status END;

    INSERT INTO public.certificates (
      user_id, appointment_id, user_name, certificate_type, certificate_number,
      status, request_date, issued_date, purpose, notes,
      address, gender, civil_status, date_of_birth, resident_since, is_sample
    ) VALUES (
      v_row.user_id,
      v_row.id,
      v_name,
      COALESCE(v_row.certificate_type, v_row.certificate_name, 'Certificate'),
      'CERT-' || UPPER(SUBSTRING(v_row.id::text FROM 1 FOR 8)),
      v_cert_status,
      COALESCE(v_row.request_date, v_row.requested_date, CURRENT_DATE),
      CASE WHEN v_status = 'completed' THEN CURRENT_DATE ELSE NULL END,
      v_row.purpose,
      v_row.notes,
      v_row.address,
      v_row.gender,
      v_row.civil_status,
      v_row.date_of_birth,
      v_row.resident_since,
      FALSE
    )
    ON CONFLICT (appointment_id) WHERE (appointment_id IS NOT NULL) DO UPDATE SET
      status       = EXCLUDED.status,
      issued_date  = COALESCE(EXCLUDED.issued_date, public.certificates.issued_date),
      purpose      = COALESCE(EXCLUDED.purpose, public.certificates.purpose),
      notes        = COALESCE(EXCLUDED.notes, public.certificates.notes),
      updated_at   = NOW();
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_appointment_request_status(UUID, TEXT) TO authenticated;
