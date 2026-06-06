-- =============================================================================
-- Barangay System | 01_extensions_and_enums.sql
-- Run first. Extensions and custom enum types.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User roles (normalized)
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('admin', 'staff', 'resident', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Account status
DO $$ BEGIN
  CREATE TYPE public.account_status AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Appointment / certificate workflow status
DO $$ BEGIN
  CREATE TYPE public.workflow_status AS ENUM (
    'pending', 'approved', 'rejected', 'completed', 'processing', 'issued', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
