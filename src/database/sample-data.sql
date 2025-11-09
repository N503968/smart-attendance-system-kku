-- ============================================
-- Sample Data for Testing
-- Smart Attendance System - KKU
-- ============================================

-- Note: Run this AFTER schema.sql has been executed

-- ============================================
-- 1. Allowed Students (Whitelist)
-- ============================================

INSERT INTO public.allowed_students (student_number, full_name, email_domain, active) VALUES
  ('442100001', 'خالد أحمد السالم', 'kku.edu.sa', true),
  ('442100002', 'سارة محمد القحطاني', 'kku.edu.sa', true),
  ('442100003', 'عبدالله علي الشهري', 'kku.edu.sa', true),
  ('442100004', 'فاطمة حسن العمري', 'kku.edu.sa', true),
  ('442100005', 'أحمد عبدالله الغامدي', 'kku.edu.sa', true),
  ('442100006', 'نورة سعد القرني', 'kku.edu.sa', true),
  ('442100007', 'محمد علي الزهراني', 'kku.edu.sa', true),
  ('442100008', 'مريم يوسف الدوسري', 'kku.edu.sa', true),
  ('442100009', 'عمر فهد الشمراني', 'kku.edu.sa', true),
  ('442100010', 'هند ماجد العتيبي', 'kku.edu.sa', true)
ON CONFLICT (student_number) DO NOTHING;

-- ============================================
-- 2. Create Test Users
-- ============================================

-- Note: These users must be created via Supabase Auth signup
-- After signup, their profiles will be automatically created
-- Then you can update their roles using the queries below

-- To create admin user:
-- 1. Signup via app with email: admin@kku.edu.sa
-- 2. Run this query to make them admin:

-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE email = 'admin@kku.edu.sa';

-- To create instructor user:
-- 1. Signup via app with email: instructor@kku.edu.sa
-- 2. Run this query:

-- UPDATE public.profiles 
-- SET role = 'instructor' 
-- WHERE email = 'instructor@kku.edu.sa';

-- ============================================
-- 3. Sample Courses
-- ============================================

-- First, get the instructor's UUID from profiles table
-- Replace 'INSTRUCTOR_UUID_HERE' with actual UUID

/*
INSERT INTO public.courses (code, name, instructor_id) VALUES
  ('CS101', 'مقدمة في علوم الحاسب', 'INSTRUCTOR_UUID_HERE'),
  ('CS201', 'قواعد البيانات', 'INSTRUCTOR_UUID_HERE'),
  ('CS301', 'هندسة البرمجيات', 'INSTRUCTOR_UUID_HERE'),
  ('MATH101', 'الرياضيات 1', 'INSTRUCTOR_UUID_HERE'),
  ('ENG101', 'اللغة الإنجليزية', 'INSTRUCTOR_UUID_HERE');
*/

-- ============================================
-- 4. Sample Sections
-- ============================================

-- After creating courses, get their IDs and create sections
-- Replace 'COURSE_UUID_HERE' with actual course UUIDs

/*
INSERT INTO public.sections (course_id, name) VALUES
  ('COURSE_UUID_HERE', 'SEC-1'),
  ('COURSE_UUID_HERE', 'SEC-2');
*/

-- ============================================
-- 5. Sample Schedules
-- ============================================

-- day_of_week: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday

/*
INSERT INTO public.schedules (section_id, day_of_week, start_time, end_time, location) VALUES
  ('SECTION_UUID_HERE', 0, '08:00:00', '10:00:00', 'قاعة A101'),
  ('SECTION_UUID_HERE', 2, '10:00:00', '12:00:00', 'قاعة A101'),
  ('SECTION_UUID_HERE', 1, '08:00:00', '10:00:00', 'قاعة B205'),
  ('SECTION_UUID_HERE', 3, '13:00:00', '15:00:00', 'قاعة B205');
*/

-- ============================================
-- 6. Sample Active Session
-- ============================================

-- Create a session that's currently active (for testing)

/*
INSERT INTO public.sessions (section_id, starts_at, ends_at, code, require_webauthn) VALUES
  (
    'SECTION_UUID_HERE',
    NOW(),
    NOW() + INTERVAL '2 hours',
    'ABC123',
    false  -- Set to true if you want to require biometric
  );
*/

-- ============================================
-- HELPER QUERIES
-- ============================================

-- Get all profiles and their roles
SELECT id, email, full_name, role, student_number, created_at 
FROM public.profiles 
ORDER BY created_at DESC;

-- Get all allowed students
SELECT * FROM public.allowed_students WHERE active = true;

-- Get all courses with instructor info
SELECT 
  c.id,
  c.code,
  c.name,
  p.full_name as instructor_name,
  p.email as instructor_email
FROM public.courses c
LEFT JOIN public.profiles p ON c.instructor_id = p.id
ORDER BY c.code;

-- Get all active sessions
SELECT 
  s.id,
  s.code,
  s.starts_at,
  s.ends_at,
  sec.name as section_name,
  c.name as course_name
FROM public.sessions s
JOIN public.sections sec ON s.section_id = sec.id
JOIN public.courses c ON sec.course_id = c.id
WHERE s.ends_at > NOW()
ORDER BY s.starts_at;

-- Get attendance summary
SELECT 
  p.full_name,
  c.name as course,
  a.status,
  a.method,
  a.marked_at
FROM public.attendance a
JOIN public.profiles p ON a.student_id = p.id
JOIN public.sessions s ON a.session_id = s.id
JOIN public.sections sec ON s.section_id = sec.id
JOIN public.courses c ON sec.course_id = c.id
ORDER BY a.marked_at DESC;

-- ============================================
-- QUICK SETUP GUIDE
-- ============================================

-- Step 1: Create users via Supabase Auth (app signup)
-- Step 2: Update roles if needed:

-- Make user an admin:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'user@kku.edu.sa';

-- Make user an instructor:
-- UPDATE public.profiles SET role = 'instructor' WHERE email = 'user@kku.edu.sa';

-- Step 3: Get instructor UUID:
-- SELECT id FROM public.profiles WHERE role = 'instructor' LIMIT 1;

-- Step 4: Create courses with that UUID
-- Step 5: Get course UUIDs and create sections
-- Step 6: Get section UUIDs and create schedules
-- Step 7: Create sessions for testing

-- ============================================
-- MAINTENANCE QUERIES
-- ============================================

-- Add new student to whitelist
INSERT INTO public.allowed_students (student_number, full_name, active)
VALUES ('442100999', 'New Student Name', true)
ON CONFLICT (student_number) DO UPDATE SET active = true;

-- Deactivate student
UPDATE public.allowed_students 
SET active = false 
WHERE student_number = '442100999';

-- Delete old sessions (older than 30 days)
DELETE FROM public.sessions 
WHERE ends_at < NOW() - INTERVAL '30 days';

-- Get attendance statistics
SELECT 
  p.role,
  COUNT(a.id) as total_records,
  SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present,
  SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent,
  SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late
FROM public.attendance a
JOIN public.profiles p ON a.student_id = p.id
GROUP BY p.role;
