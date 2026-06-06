-- =============================================================================
-- Barangay System | demo/demo_sample_data.sql
-- Sample certificates and appointments (run AFTER demo_accounts.sql)
-- SAFE TO RE-RUN — resolves user_id by email, not hard-coded UUID
-- =============================================================================

ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS is_sample BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  SELECT id INTO v_admin_id FROM public.profiles WHERE email = 'admin@gmail.com' LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE NOTICE 'admin@gmail.com not found — run demo_accounts.sql first. Skipping sample data.';
    RETURN;
  END IF;

  -- Museum samples (see also 20_seed_certificate_museum.sql)
  INSERT INTO public.certificates (
    user_id, user_name, certificate_type, certificate_number, status, is_sample,
    request_date, issued_date, purpose, address, gender, civil_status, date_of_birth, notes, resident_since
  )
  SELECT
    v_admin_id, 'Juan Dela Cruz', 'Barangay Clearance', 'SAMPLE-BC-001', 'issued', TRUE,
    CURRENT_DATE, CURRENT_DATE, 'Employment',
    '123 Barangay Street, Old Cabalan, Olongapo City', 'Male', 'Single', '1990-05-15',
    'Museum sample — Barangay Clearance preview', '2015'
  WHERE NOT EXISTS (SELECT 1 FROM public.certificates WHERE certificate_number = 'SAMPLE-BC-001');

  INSERT INTO public.certificates (
    user_id, user_name, certificate_type, certificate_number, status, is_sample,
    request_date, issued_date, purpose, address, gender, civil_status, date_of_birth, notes
  )
  SELECT
    v_admin_id, 'Maria Santos', 'Certificate of Indigency', 'SAMPLE-COI-002', 'issued', TRUE,
    CURRENT_DATE, CURRENT_DATE, 'Government Assistance',
    '456 Purok 2, Old Cabalan, Olongapo City', 'Female', 'Married', '1985-08-20',
    'Museum sample — Certificate of Indigency preview'
  WHERE NOT EXISTS (SELECT 1 FROM public.certificates WHERE certificate_number = 'SAMPLE-COI-002');

  INSERT INTO public.certificates (
    user_id, user_name, certificate_type, certificate_number, status, is_sample,
    request_date, issued_date, purpose, address, gender, civil_status, date_of_birth, resident_since, notes
  )
  SELECT
    v_admin_id, 'Pedro Reyes', 'Certificate of Residency', 'SAMPLE-COR-003', 'issued', TRUE,
    CURRENT_DATE, CURRENT_DATE, 'School Requirement',
    '789 Sitio Malaga, Old Cabalan, Olongapo City', 'Male', 'Married', '1982-01-10', '2010',
    'Museum sample — Certificate of Residency preview'
  WHERE NOT EXISTS (SELECT 1 FROM public.certificates WHERE certificate_number = 'SAMPLE-COR-003');

  INSERT INTO public.certificates (
    user_id, user_name, certificate_type, certificate_number, status, is_sample,
    request_date, issued_date, expiry_date, purpose, address, gender, civil_status, date_of_birth, notes
  )
  SELECT
    v_admin_id, 'Ana Mendoza', 'Barangay Business Clearance', 'SAMPLE-BBC-004', 'issued', TRUE,
    CURRENT_DATE, CURRENT_DATE, CURRENT_DATE + 365, 'Business Permit',
    '12 Commerce Lane, Old Cabalan, Olongapo City', 'Female', 'Single', '1993-11-25',
    'Museum sample — Barangay Business Clearance preview'
  WHERE NOT EXISTS (SELECT 1 FROM public.certificates WHERE certificate_number = 'SAMPLE-BBC-004');

  INSERT INTO public.basketball_court_reservations (
    user_id, court_number, user_name, user_email, reservation_date,
    start_time, end_time, duration, purpose, status, notes
  )
  SELECT
    v_admin_id, 1, 'Resident User', 'user@gmail.com',
    CURRENT_DATE + INTERVAL '2 days', '6:00 AM', '8:00 AM', 2,
    'Morning basketball practice', 'approved', 'Regular morning practice session'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.basketball_court_reservations
    WHERE user_email = 'user@gmail.com' AND court_number = 1 AND purpose = 'Morning basketball practice'
  );

  INSERT INTO public.basketball_court_reservations (
    user_id, court_number, user_name, user_email, reservation_date,
    start_time, end_time, duration, purpose, status, notes
  )
  SELECT
    v_admin_id, 2, 'Resident User', 'user@gmail.com',
    CURRENT_DATE + INTERVAL '3 days', '7:00 PM', '9:00 PM', 2,
    'Community basketball game', 'pending', 'Weekly community game'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.basketball_court_reservations
    WHERE user_email = 'user@gmail.com' AND court_number = 2 AND purpose = 'Community basketball game'
  );

END $$;
