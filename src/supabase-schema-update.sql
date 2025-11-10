-- ============================================
-- King Khalid University Smart Attendance System
-- Database Schema Update Script
-- Fix for sessions table structure
-- ============================================

-- Add missing columns to sessions table if they don't exist
ALTER TABLE public.sessions 
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS require_webauthn BOOLEAN DEFAULT FALSE;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_sessions_starts_at ON public.sessions(starts_at);
CREATE INDEX IF NOT EXISTS idx_sessions_ends_at ON public.sessions(ends_at);

-- Display success message
DO $$
BEGIN
  RAISE NOTICE '✅ Sessions table updated successfully!';
  RAISE NOTICE '✅ Added columns: starts_at, ends_at, require_webauthn';
  RAISE NOTICE '✅ Created indexes for better query performance.';
END $$;
