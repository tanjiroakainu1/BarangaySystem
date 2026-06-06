-- =============================================================================
-- Barangay System | 10_seed_certificate_forms.sql
-- Default certificate form catalog (safe to re-run)
-- =============================================================================

INSERT INTO public.certificate_forms (name, type, description, requirements, price, fee, processing_time, is_active)
SELECT 'Certificate of Residency', 'Certificate', 'Proof of residence in the barangay', ARRAY['Valid ID'], 0, 0, '1 day', TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.certificate_forms WHERE name = 'Certificate of Residency');

INSERT INTO public.certificate_forms (name, type, description, requirements, price, fee, processing_time, is_active)
SELECT 'Certificate of Indigency', 'Certificate', 'For government assistance and social welfare', ARRAY['Valid ID'], 0, 0, '1 day', TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.certificate_forms WHERE name = 'Certificate of Indigency');

INSERT INTO public.certificate_forms (name, type, description, requirements, price, fee, processing_time, is_active)
SELECT 'Barangay Clearance', 'Clearance', 'Standard clearance for employment and other purposes', ARRAY['Valid ID'], 50, 50, '1 day', TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.certificate_forms WHERE name = 'Barangay Clearance');

INSERT INTO public.certificate_forms (name, type, description, requirements, price, fee, processing_time, is_active)
SELECT 'Barangay Business Clearance', 'Clearance', 'Business permit clearance for barangay operations', ARRAY['Valid ID', 'Business Registration', 'DTI/SEC Registration'], 150, 150, '3 days', TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.certificate_forms WHERE name = 'Barangay Business Clearance');
