-- =============================================================================
-- Barangay System | 20_seed_certificate_museum.sql
-- Sample certificates for Certificate Museum (preview + PDF export testing)
-- Run after demo_accounts.sql (needs admin@gmail.com profile)
-- SAFE TO RE-RUN
-- =============================================================================

ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS is_sample BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.certificates.is_sample IS 'TRUE = museum sample/preview certificate';

-- Allow anyone to view sample certificates (museum public previews)
DROP POLICY IF EXISTS "certificates_select_samples" ON public.certificates;
CREATE POLICY "certificates_select_samples" ON public.certificates
  FOR SELECT USING (is_sample = TRUE);

DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  SELECT id INTO v_admin_id FROM public.profiles WHERE email = 'admin@gmail.com' LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE NOTICE 'admin@gmail.com not found — run demo_accounts.sql first.';
    RETURN;
  END IF;

  -- Barangay Clearance (sample)
  INSERT INTO public.certificates (
    user_id, user_name, certificate_type, certificate_number, status, is_sample,
    request_date, issued_date, purpose, address, gender, civil_status, date_of_birth,
    notes, resident_since
  )
  SELECT
    v_admin_id, 'Juan Dela Cruz', 'Barangay Clearance', 'SAMPLE-BC-001', 'issued', TRUE,
    CURRENT_DATE - 30, CURRENT_DATE - 28, 'Employment Requirement',
    '123 Rizal Street, Purok 1, Old Cabalan, Olongapo City, Zambales',
    'Male', 'Single', '1990-05-15',
    'Museum sample — Barangay Clearance preview. NO DEROGATORY RECORD on file.',
    '2015'
  WHERE NOT EXISTS (SELECT 1 FROM public.certificates WHERE certificate_number = 'SAMPLE-BC-001');

  -- Certificate of Indigency (sample)
  INSERT INTO public.certificates (
    user_id, user_name, certificate_type, certificate_number, status, is_sample,
    request_date, issued_date, purpose, address, gender, civil_status, date_of_birth, notes
  )
  SELECT
    v_admin_id, 'Maria Santos', 'Certificate of Indigency', 'SAMPLE-COI-002', 'issued', TRUE,
    CURRENT_DATE - 20, CURRENT_DATE - 18, 'Medical / Government Assistance',
    '456 Mabini Avenue, Purok 2, Old Cabalan, Olongapo City, Zambales',
    'Female', 'Married', '1985-08-20',
    'Museum sample — Certificate of Indigency preview for indigent residents.'
  WHERE NOT EXISTS (SELECT 1 FROM public.certificates WHERE certificate_number = 'SAMPLE-COI-002');

  -- Certificate of Residency (sample)
  INSERT INTO public.certificates (
    user_id, user_name, certificate_type, certificate_number, status, is_sample,
    request_date, issued_date, purpose, address, gender, civil_status, date_of_birth,
    notes, resident_since
  )
  SELECT
    v_admin_id, 'Pedro Reyes', 'Certificate of Residency', 'SAMPLE-COR-003', 'issued', TRUE,
    CURRENT_DATE - 15, CURRENT_DATE - 14, 'School Enrollment',
    '789 Bonifacio Street, Purok 3, Old Cabalan, Olongapo City, Zambales',
    'Male', 'Married', '1982-01-10',
    'Museum sample — Certificate of Residency preview.',
    '2010'
  WHERE NOT EXISTS (SELECT 1 FROM public.certificates WHERE certificate_number = 'SAMPLE-COR-003');

  -- Barangay Business Clearance (sample)
  INSERT INTO public.certificates (
    user_id, user_name, certificate_type, certificate_number, status, is_sample,
    request_date, issued_date, expiry_date, purpose, address, gender, civil_status,
    date_of_birth, notes, resident_since
  )
  SELECT
    v_admin_id, 'Ana Mendoza', 'Barangay Business Clearance', 'SAMPLE-BBC-004', 'issued', TRUE,
    CURRENT_DATE - 10, CURRENT_DATE - 8, CURRENT_DATE + 355,
    'Sari-Sari Store Permit', '12 Commerce Lane, Purok 4, Old Cabalan, Olongapo City, Zambales',
    'Female', 'Single', '1993-11-25',
    'Museum sample — Barangay Business Clearance preview. Business: Ana''s Mini Mart.',
    '2018'
  WHERE NOT EXISTS (SELECT 1 FROM public.certificates WHERE certificate_number = 'SAMPLE-BBC-004');

END $$;
