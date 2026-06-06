-- =============================================================================
-- Barangay System | 11_seed_basketball_courts.sql
-- Default basketball courts
-- =============================================================================

INSERT INTO public.basketball_courts (court_number, name, location, capacity, amenities, hourly_rate, is_active)
VALUES
  (1, 'Main Basketball Court', 'Barangay Sports Complex', 20,
   ARRAY['Lighting', 'Seating', 'Water Station', 'Restroom'], 100, TRUE),
  (2, 'Secondary Basketball Court', 'Barangay Sports Complex', 15,
   ARRAY['Lighting', 'Seating', 'Water Station'], 80, TRUE),
  (3, 'Community Basketball Court', 'Community Center', 12,
   ARRAY['Lighting', 'Water Station'], 50, TRUE)
ON CONFLICT (court_number) DO NOTHING;
