-- ============================================
-- سكربت التحقق من النظام
-- System Verification Script
-- ============================================
-- استخدم هذا السكربت للتحقق من أن كل شيء يعمل بشكل صحيح
-- Use this script to verify everything is working correctly

-- ============================================
-- 1. التحقق من الجداول
-- Check Tables
-- ============================================

DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📋 التحقق من الجداول / Checking Tables';
  RAISE NOTICE '========================================';
  
  -- Check profiles table
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ profiles';
  ELSE
    RAISE NOTICE '❌ profiles - MISSING!';
  END IF;
  
  -- Check courses table
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'courses'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ courses';
  ELSE
    RAISE NOTICE '❌ courses - MISSING!';
  END IF;
  
  -- Check sections table
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'sections'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ sections';
  ELSE
    RAISE NOTICE '❌ sections - MISSING!';
  END IF;
  
  -- Check schedules table
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'schedules'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ schedules';
  ELSE
    RAISE NOTICE '❌ schedules - MISSING!';
  END IF;
  
  -- Check sessions table
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'sessions'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ sessions';
  ELSE
    RAISE NOTICE '❌ sessions - MISSING!';
  END IF;
  
  -- Check attendance table
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'attendance'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ attendance';
  ELSE
    RAISE NOTICE '❌ attendance - MISSING!';
  END IF;
  
  -- Check webauthn_credentials table
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'webauthn_credentials'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ webauthn_credentials';
  ELSE
    RAISE NOTICE '❌ webauthn_credentials - MISSING!';
  END IF;
  
  -- Check allowed_students table
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'allowed_students'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ allowed_students';
  ELSE
    RAISE NOTICE '❌ allowed_students - MISSING!';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

-- ============================================
-- 2. التحقق من البيانات
-- Check Data
-- ============================================

DO $$
DECLARE
  profiles_count INT;
  courses_count INT;
  sections_count INT;
  schedules_count INT;
  sessions_count INT;
  attendance_count INT;
  supervisor_count INT;
  teacher_count INT;
  student_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 إحصائيات البيانات / Data Statistics';
  RAISE NOTICE '========================================';
  
  -- Count profiles
  SELECT COUNT(*) INTO profiles_count FROM public.profiles;
  RAISE NOTICE 'المستخدمين / Users: %', profiles_count;
  
  -- Count by role
  SELECT COUNT(*) INTO supervisor_count FROM public.profiles WHERE role = 'supervisor';
  RAISE NOTICE '  - مشرفين / Supervisors: %', supervisor_count;
  
  SELECT COUNT(*) INTO teacher_count FROM public.profiles WHERE role = 'teacher';
  RAISE NOTICE '  - معلمين / Teachers: %', teacher_count;
  
  SELECT COUNT(*) INTO student_count FROM public.profiles WHERE role = 'student';
  RAISE NOTICE '  - طلاب / Students: %', student_count;
  
  -- Count courses
  SELECT COUNT(*) INTO courses_count FROM public.courses;
  RAISE NOTICE 'المواد الدراسية / Courses: %', courses_count;
  
  -- Count sections
  SELECT COUNT(*) INTO sections_count FROM public.sections;
  RAISE NOTICE 'الشعب / Sections: %', sections_count;
  
  -- Count schedules
  SELECT COUNT(*) INTO schedules_count FROM public.schedules;
  RAISE NOTICE 'الجداول / Schedules: %', schedules_count;
  
  -- Count sessions
  SELECT COUNT(*) INTO sessions_count FROM public.sessions;
  RAISE NOTICE 'الجلسات / Sessions: %', sessions_count;
  
  -- Count attendance
  SELECT COUNT(*) INTO attendance_count FROM public.attendance;
  RAISE NOTICE 'سجلات الحضور / Attendance Records: %', attendance_count;
  
  RAISE NOTICE '========================================';
  
  -- Check if we have the expected data
  IF profiles_count < 3 THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  تحذير: عدد المستخدمين أقل من المتوقع (3)';
    RAISE NOTICE '⚠️  Warning: User count is less than expected (3)';
    RAISE NOTICE '    يجب تسجيل المستخدمين من خلال الموقع أولاً';
    RAISE NOTICE '    Please register users through the website first';
  END IF;
  
  IF courses_count = 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  تحذير: لا توجد مواد دراسية';
    RAISE NOTICE '⚠️  Warning: No courses found';
    RAISE NOTICE '    يجب تشغيل /SAMPLE-DATA.sql';
    RAISE NOTICE '    Please run /SAMPLE-DATA.sql';
  END IF;
END $$;

-- ============================================
-- 3. التحقق من المستخدمين المسجلين
-- Check Registered Users
-- ============================================

DO $$
DECLARE
  admin_exists BOOLEAN;
  teacher_exists BOOLEAN;
  student_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '👥 التحقق من المستخدمين / User Check';
  RAISE NOTICE '========================================';
  
  -- Check admin
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE email = 'admin@kku.edu.sa'
  ) INTO admin_exists;
  
  IF admin_exists THEN
    RAISE NOTICE '✅ admin@kku.edu.sa - مسجل / Registered';
  ELSE
    RAISE NOTICE '❌ admin@kku.edu.sa - غير مسجل / Not registered';
  END IF;
  
  -- Check teacher
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE email = 'teacher@kku.edu.sa'
  ) INTO teacher_exists;
  
  IF teacher_exists THEN
    RAISE NOTICE '✅ teacher@kku.edu.sa - مسجل / Registered';
  ELSE
    RAISE NOTICE '❌ teacher@kku.edu.sa - غير مسجل / Not registered';
  END IF;
  
  -- Check student
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE email = 'student@kku.edu.sa'
  ) INTO student_exists;
  
  IF student_exists THEN
    RAISE NOTICE '✅ student@kku.edu.sa - مسجل / Registered';
  ELSE
    RAISE NOTICE '❌ student@kku.edu.sa - غير مسجل / Not registered';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

-- ============================================
-- 4. عرض المواد الدراسية
-- Display Courses
-- ============================================

DO $$
DECLARE
  course_record RECORD;
  courses_exist BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📚 المواد الدراسية / Courses';
  RAISE NOTICE '========================================';
  
  SELECT EXISTS (SELECT 1 FROM public.courses) INTO courses_exist;
  
  IF courses_exist THEN
    FOR course_record IN 
      SELECT c.code, c.name, p.full_name as instructor
      FROM public.courses c
      LEFT JOIN public.profiles p ON c.instructor_id = p.id
    LOOP
      RAISE NOTICE '📖 % - % (المعلم: %)', 
        course_record.code, 
        course_record.name, 
        COALESCE(course_record.instructor, 'غير محدد');
    END LOOP;
  ELSE
    RAISE NOTICE '⚠️  لا توجد مواد دراسية';
    RAISE NOTICE '⚠️  No courses found';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

-- ============================================
-- 5. عرض الجلسات النشطة
-- Display Active Sessions
-- ============================================

DO $$
DECLARE
  session_record RECORD;
  sessions_exist BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎯 الجلسات النشطة / Active Sessions';
  RAISE NOTICE '========================================';
  
  SELECT EXISTS (
    SELECT 1 FROM public.sessions WHERE ends_at > NOW()
  ) INTO sessions_exist;
  
  IF sessions_exist THEN
    FOR session_record IN 
      SELECT 
        s.code,
        s.starts_at,
        s.ends_at,
        c.code as course_code,
        c.name as course_name
      FROM public.sessions s
      JOIN public.sections sec ON s.section_id = sec.id
      JOIN public.courses c ON sec.course_id = c.id
      WHERE s.ends_at > NOW()
      ORDER BY s.starts_at
    LOOP
      RAISE NOTICE '🎓 % - % (الكود: %)', 
        session_record.course_code,
        session_record.course_name,
        session_record.code;
      RAISE NOTICE '   من: % إلى: %',
        session_record.starts_at,
        session_record.ends_at;
    END LOOP;
  ELSE
    RAISE NOTICE '⚠️  لا توجد جلسات نشطة';
    RAISE NOTICE '⚠️  No active sessions';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

-- ============================================
-- 6. التحقق من RLS
-- Check RLS Status
-- ============================================

DO $$
DECLARE
  table_record RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔐 حالة Row Level Security';
  RAISE NOTICE '========================================';
  
  FOR table_record IN
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN (
      'profiles', 'courses', 'sections', 'schedules', 
      'sessions', 'attendance', 'webauthn_credentials', 'allowed_students'
    )
  LOOP
    IF table_record.rowsecurity THEN
      RAISE NOTICE '✅ % - RLS مفعّل', table_record.tablename;
    ELSE
      RAISE NOTICE '❌ % - RLS غير مفعّل!', table_record.tablename;
    END IF;
  END LOOP;
  
  RAISE NOTICE '========================================';
END $$;

-- ============================================
-- 7. النتيجة النهائية
-- Final Result
-- ============================================

DO $$
DECLARE
  profiles_count INT;
  courses_count INT;
  sessions_count INT;
  all_good BOOLEAN := true;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎯 النتيجة النهائية / Final Result';
  RAISE NOTICE '========================================';
  
  SELECT COUNT(*) INTO profiles_count FROM public.profiles;
  SELECT COUNT(*) INTO courses_count FROM public.courses;
  SELECT COUNT(*) INTO sessions_count FROM public.sessions;
  
  IF profiles_count < 3 THEN
    RAISE NOTICE '❌ عدد المستخدمين غير كافٍ (الحالي: %, المطلوب: 3)', profiles_count;
    all_good := false;
  END IF;
  
  IF courses_count = 0 THEN
    RAISE NOTICE '❌ لا توجد مواد دراسية';
    all_good := false;
  END IF;
  
  IF sessions_count = 0 THEN
    RAISE NOTICE '⚠️  لا توجد جلسات (يمكن إنشاءها من لوحة المعلم)';
  END IF;
  
  IF all_good AND sessions_count > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '✅✅✅ النظام جاهز للعمل! ✅✅✅';
    RAISE NOTICE '✅✅✅ System is Ready! ✅✅✅';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 يمكنك الآن تسجيل الدخول واستخدام النظام';
    RAISE NOTICE '🎉 You can now login and use the system';
  ELSIF all_good THEN
    RAISE NOTICE '';
    RAISE NOTICE '✅ قاعدة البيانات جاهزة، لكن تحتاج لإنشاء جلسات';
    RAISE NOTICE '✅ Database ready, but needs sessions to be created';
    RAISE NOTICE '';
    RAISE NOTICE '📌 سجّل دخول كمعلم لإنشاء جلسات حضور';
    RAISE NOTICE '📌 Login as teacher to create attendance sessions';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  النظام غير مكتمل - راجع الرسائل أعلاه';
    RAISE NOTICE '⚠️  System incomplete - check messages above';
    RAISE NOTICE '';
    RAISE NOTICE '📋 الخطوات المطلوبة:';
    RAISE NOTICE '1. سجّل المستخدمين من خلال الموقع';
    RAISE NOTICE '2. شغّل /SAMPLE-DATA.sql';
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;
