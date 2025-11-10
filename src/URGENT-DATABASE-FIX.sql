-- ============================================
-- URGENT FIX: Add missing columns to sessions table
-- Run this in Supabase SQL Editor NOW!
-- ============================================

-- Step 1: Check if the sessions table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sessions') THEN
    RAISE EXCEPTION 'ERROR: sessions table does not exist! Please run the full schema first: /supabase-schema.sql';
  END IF;
END $$;

-- Step 2: Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add starts_at column
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'starts_at') THEN
    ALTER TABLE public.sessions ADD COLUMN starts_at TIMESTAMPTZ;
    RAISE NOTICE '✅ Added starts_at column';
  ELSE
    RAISE NOTICE '⚠️ starts_at column already exists';
  END IF;

  -- Add ends_at column
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'ends_at') THEN
    ALTER TABLE public.sessions ADD COLUMN ends_at TIMESTAMPTZ;
    RAISE NOTICE '✅ Added ends_at column';
  ELSE
    RAISE NOTICE '⚠️ ends_at column already exists';
  END IF;

  -- Add require_webauthn column
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'require_webauthn') THEN
    ALTER TABLE public.sessions ADD COLUMN require_webauthn BOOLEAN DEFAULT FALSE;
    RAISE NOTICE '✅ Added require_webauthn column';
  ELSE
    RAISE NOTICE '⚠️ require_webauthn column already exists';
  END IF;
END $$;

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_starts_at ON public.sessions(starts_at);
CREATE INDEX IF NOT EXISTS idx_sessions_ends_at ON public.sessions(ends_at);

-- Step 4: Verify the foreign key relationship exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' 
    AND table_name = 'sessions' 
    AND constraint_name LIKE '%section_id%'
  ) THEN
    -- Add the foreign key if it doesn't exist
    ALTER TABLE public.sessions 
      ADD CONSTRAINT sessions_section_id_fkey 
      FOREIGN KEY (section_id) 
      REFERENCES public.sections(id) 
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added foreign key constraint sessions_section_id_fkey';
  ELSE
    RAISE NOTICE '✅ Foreign key constraint already exists';
  END IF;
END $$;

-- Step 5: Verify sections to courses relationship
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' 
    AND table_name = 'sections' 
    AND constraint_name LIKE '%course_id%'
  ) THEN
    -- Add the foreign key if it doesn't exist
    ALTER TABLE public.sections 
      ADD CONSTRAINT sections_course_id_fkey 
      FOREIGN KEY (course_id) 
      REFERENCES public.courses(id) 
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added foreign key constraint sections_course_id_fkey';
  ELSE
    RAISE NOTICE '✅ Foreign key constraint already exists';
  END IF;
END $$;

-- Step 6: Verify schedules to sections relationship
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' 
    AND table_name = 'schedules' 
    AND constraint_name LIKE '%section_id%'
  ) THEN
    -- Add the foreign key if it doesn't exist
    ALTER TABLE public.schedules 
      ADD CONSTRAINT schedules_section_id_fkey 
      FOREIGN KEY (section_id) 
      REFERENCES public.sections(id) 
      ON DELETE CASCADE;
    RAISE NOTICE '✅ Added foreign key constraint schedules_section_id_fkey';
  ELSE
    RAISE NOTICE '✅ Foreign key constraint already exists';
  END IF;
END $$;

-- Step 7: Display success message and next steps
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ DATABASE UPDATE COMPLETED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Refresh your application';
  RAISE NOTICE '2. Try logging in as a student';
  RAISE NOTICE '3. Check if the error is gone';
  RAISE NOTICE '';
  RAISE NOTICE 'If you still see errors:';
  RAISE NOTICE '- Check the browser console for details';
  RAISE NOTICE '- Verify all tables exist (courses, sections, schedules, sessions, attendance)';
  RAISE NOTICE '- Run the full schema: /supabase-schema.sql';
  RAISE NOTICE '';
END $$;
