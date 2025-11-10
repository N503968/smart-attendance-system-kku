-- ============================================
-- Migration Script: Update Old Roles to New Roles
-- Run this ONLY if you have existing users with old roles
-- ============================================

-- Update instructor → teacher
UPDATE public.profiles
SET role = 'teacher'
WHERE role = 'instructor';

-- Update admin → supervisor
UPDATE public.profiles
SET role = 'supervisor'
WHERE role = 'admin';

-- Fix any NULL or empty roles (set to student as default)
UPDATE public.profiles
SET role = 'student'
WHERE role IS NULL OR role = '';

-- Show results
SELECT 
  role,
  COUNT(*) as count
FROM public.profiles
GROUP BY role
ORDER BY role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Roles migration completed!';
  RAISE NOTICE '✅ All old roles (instructor, admin) updated to new roles (teacher, supervisor)';
  RAISE NOTICE '✅ Check the results above.';
END $$;
