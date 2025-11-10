-- ============================================
-- التحقق من إعداد قاعدة البيانات
-- Verify Database Setup
-- ============================================

-- هذا السكربت يتحقق من أن كل شيء مُعدّ بشكل صحيح
-- This script verifies that everything is set up correctly

-- ============================================
-- فحص الجداول | Check Tables
-- ============================================

DO $$
DECLARE
  table_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔍 فحص الجداول | Checking Tables';
  RAISE NOTICE '========================================';
  
  -- Check profiles
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    SELECT COUNT(*) INTO table_count FROM public.profiles;
    RAISE NOTICE '✅ profiles: % سجل | % records', table_count;
  ELSE
    RAISE NOTICE '❌ profiles: الجدول غير موجود | Table not found';
  END IF;
  
  -- Check courses
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'courses') THEN
    SELECT COUNT(*) INTO table_count FROM public.courses;
    RAISE NOTICE '✅ courses: % سجل | % records', table_count;
  ELSE
    RAISE NOTICE '❌ courses: الجدول غير موجود | Table not found';
  END IF;
  
  -- Check sections
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sections') THEN
    SELECT COUNT(*) INTO table_count FROM public.sections;
    RAISE NOTICE '✅ sections: % سجل | % records', table_count;
  ELSE
    RAISE NOTICE '❌ sections: الجدول غير موجود | Table not found';
  END IF;
  
  -- Check schedules
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'schedules') THEN
    SELECT COUNT(*) INTO table_count FROM public.schedules;
    RAISE NOTICE '✅ schedules: % سجل | % records', table_count;
  ELSE
    RAISE NOTICE '❌ schedules: الجدول غير موجود | Table not found';
  END IF;
  
  -- Check sessions
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sessions') THEN
    SELECT COUNT(*) INTO table_count FROM public.sessions;
    RAISE NOTICE '✅ sessions: % سجل | % records', table_count;
  ELSE
    RAISE NOTICE '❌ sessions: الجدول غير موجود | Table not found';
  END IF;
  
  -- Check attendance
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'attendance') THEN
    SELECT COUNT(*) INTO table_count FROM public.attendance;
    RAISE NOTICE '✅ attendance: % سجل | % records', table_count;
  ELSE
    RAISE NOTICE '❌ attendance: الجدول غير موجود | Table not found';
  END IF;
  
  -- Check webauthn_credentials
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'webauthn_credentials') THEN
    SELECT COUNT(*) INTO table_count FROM public.webauthn_credentials;
    RAISE NOTICE '✅ webauthn_credentials: % سجل | % records', table_count;
  ELSE
    RAISE NOTICE '❌ webauthn_credentials: الجدول غير موجود | Table not found';
  END IF;
  
  -- Check allowed_students
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'allowed_students') THEN
    SELECT COUNT(*) INTO table_count FROM public.allowed_students;
    RAISE NOTICE '✅ allowed_students: % سجل | % records', table_count;
  ELSE
    RAISE NOTICE '❌ allowed_students: الجدول غير موجود | Table not found';
  END IF;
  
END $$;

-- ============================================
-- فحص المستخدمين حسب الدور | Check Users by Role
-- ============================================

DO $$
DECLARE
  supervisor_count INT;
  teacher_count INT;
  student_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '👥 فحص المستخدمين | Checking Users';
  RAISE NOTICE '========================================';
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    SELECT COUNT(*) INTO supervisor_count FROM public.profiles WHERE role = 'supervisor';
    SELECT COUNT(*) INTO teacher_count FROM public.profiles WHERE role = 'teacher';
    SELECT COUNT(*) INTO student_count FROM public.profiles WHERE role = 'student';
    
    RAISE NOTICE '👤 المشرفون | Supervisors: %', supervisor_count;
    RAISE NOTICE '👨‍🏫 المعلمون | Teachers: %', teacher_count;
    RAISE NOTICE '👨‍🎓 الطلاب | Students: %', student_count;
    
    IF supervisor_count = 0 THEN
      RAISE NOTICE '⚠️  لا يوجد مشرفون! سجّل admin@kku.edu.sa';
      RAISE NOTICE '⚠️  No supervisors! Register admin@kku.edu.sa';
    END IF;
    
    IF teacher_count = 0 THEN
      RAISE NOTICE '⚠️  لا يوجد معلمون! سجّل teacher@kku.edu.sa';
      RAISE NOTICE '⚠️  No teachers! Register teacher@kku.edu.sa';
    END IF;
    
    IF student_count = 0 THEN
      RAISE NOTICE '⚠️  لا يوجد طلاب! سجّل student@kku.edu.sa';
      RAISE NOTICE '⚠️  No students! Register student@kku.edu.sa';
    END IF;
  END IF;
END $$;

-- ============================================
-- فحص المواد الدراسية | Check Courses
-- ============================================

DO $$
DECLARE
  course_record RECORD;
  course_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📚 المواد الدراسية | Courses';
  RAISE NOTICE '========================================';
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'courses') THEN
    SELECT COUNT(*) INTO course_count FROM public.courses;
    
    IF course_count = 0 THEN
      RAISE NOTICE '⚠️  لا توجد مواد! شغّل /SAMPLE-DATA.sql';
      RAISE NOTICE '⚠️  No courses! Run /SAMPLE-DATA.sql';
    ELSE
      FOR course_record IN 
        SELECT c.code, c.name, p.full_name as instructor_name
        FROM public.courses c
        LEFT JOIN public.profiles p ON c.instructor_id = p.id
        ORDER BY c.code
      LOOP
        RAISE NOTICE '📖 % - % (المعلم: %)', 
          course_record.code, 
          course_record.name,
          COALESCE(course_record.instructor_name, 'غير محدد');
      END LOOP;
    END IF;
  END IF;
END $$;

-- ============================================
-- فحص الجلسات النشطة | Check Active Sessions
-- ============================================

DO $$
DECLARE
  session_record RECORD;
  active_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔴 الجلسات النشطة | Active Sessions';
  RAISE NOTICE '========================================';
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sessions') THEN
    SELECT COUNT(*) INTO active_count 
    FROM public.sessions 
    WHERE ends_at > NOW();
    
    IF active_count = 0 THEN
      RAISE NOTICE '⚠️  لا توجد جلسات نشطة حالياً';
      RAISE NOTICE '⚠️  No active sessions currently';
      RAISE NOTICE '💡 سجّل دخول كمعلم وأنشئ جلسة جديدة';
      RAISE NOTICE '💡 Login as teacher and create a new session';
    ELSE
      RAISE NOTICE 'عدد الجلسات النشطة: %', active_count;
      
      FOR session_record IN 
        SELECT 
          ses.code,
          ses.starts_at,
          ses.ends_at,
          c.code as course_code,
          c.name as course_name
        FROM public.sessions ses
        JOIN public.sections sec ON ses.section_id = sec.id
        JOIN public.courses c ON sec.course_id = c.id
        WHERE ses.ends_at > NOW()
        ORDER BY ses.starts_at
      LOOP
        RAISE NOTICE '🟢 % - % (كود: %)', 
          session_record.course_code,
          session_record.course_name,
          session_record.code;
      END LOOP;
    END IF;
  END IF;
END $$;

-- ============================================
-- فحص العلاقات الأجنبية | Check Foreign Keys
-- ============================================

DO $$
DECLARE
  fk_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔗 العلاقات الأجنبية | Foreign Keys';
  RAISE NOTICE '========================================';
  
  SELECT COUNT(*) INTO fk_count
  FROM information_schema.table_constraints
  WHERE constraint_type = 'FOREIGN KEY'
    AND table_schema = 'public';
  
  RAISE NOTICE 'عدد العلاقات الأجنبية: %', fk_count;
  
  IF fk_count < 8 THEN
    RAISE NOTICE '⚠️  عدد العلاقات قليل! تأكد من تشغيل /COMPLETE-DATABASE-SETUP.sql';
    RAISE NOTICE '⚠️  Too few foreign keys! Make sure to run /COMPLETE-DATABASE-SETUP.sql';
  ELSE
    RAISE NOTICE '✅ العلاقات الأجنبية مُعدّة بشكل صحيح';
  END IF;
END $$;

-- ============================================
-- فحص Row Level Security | Check RLS
-- ============================================

DO $$
DECLARE
  rls_table RECORD;
  rls_count INT := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔒 Row Level Security (RLS)';
  RAISE NOTICE '========================================';
  
  FOR rls_table IN
    SELECT 
      tablename,
      rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN ('profiles', 'courses', 'sections', 'schedules', 'sessions', 'attendance', 'webauthn_credentials', 'allowed_students')
    ORDER BY tablename
  LOOP
    IF rls_table.rowsecurity THEN
      RAISE NOTICE '✅ %: مُفعّل | Enabled', rls_table.tablename;
      rls_count := rls_count + 1;
    ELSE
      RAISE NOTICE '❌ %: غير مُفعّل | Not Enabled', rls_table.tablename;
    END IF;
  END LOOP;
  
  IF rls_count = 8 THEN
    RAISE NOTICE '';
    RAISE NOTICE '✅ جميع الجداول محمية بـ RLS';
    RAISE NOTICE '✅ All tables protected with RLS';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  بعض الجداول غير محمية!';
    RAISE NOTICE '⚠️  Some tables are not protected!';
  END IF;
END $$;

-- ============================================
-- فحص الفهارس | Check Indexes
-- ============================================

DO $$
DECLARE
  idx_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 الفهارس | Indexes';
  RAISE NOTICE '========================================';
  
  SELECT COUNT(*) INTO idx_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%';
  
  RAISE NOTICE 'عدد الفهارس: %', idx_count;
  
  IF idx_count < 10 THEN
    RAISE NOTICE '⚠️  الفهارس قليلة! قد يؤثر على الأداء';
    RAISE NOTICE '⚠️  Few indexes! May affect performance';
  ELSE
    RAISE NOTICE '✅ الفهارس مُعدّة بشكل جيد';
  END IF;
END $$;

-- ============================================
-- فحص الـ Triggers | Check Triggers
-- ============================================

DO $$
DECLARE
  trigger_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '⚡ المُطلقات | Triggers';
  RAISE NOTICE '========================================';
  
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) INTO trigger_exists;
  
  IF trigger_exists THEN
    RAISE NOTICE '✅ on_auth_user_created: موجود | Exists';
    RAISE NOTICE '   (يُنشئ profile تلقائياً عند التسجيل)';
    RAISE NOTICE '   (Auto-creates profile on signup)';
  ELSE
    RAISE NOTICE '❌ on_auth_user_created: غير موجود | Not Found';
    RAISE NOTICE '⚠️  لن يتم إنشاء profiles تلقائياً!';
    RAISE NOTICE '⚠️  Profiles won''t be created automatically!';
  END IF;
END $$;

-- ============================================
-- النتيجة النهائية | Final Result
-- ============================================

DO $$
DECLARE
  tables_ok BOOLEAN;
  users_ok BOOLEAN;
  data_ok BOOLEAN;
  rls_ok BOOLEAN;
  trigger_ok BOOLEAN;
BEGIN
  -- Check tables
  SELECT 
    EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') AND
    EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'courses') AND
    EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sections') AND
    EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'schedules') AND
    EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sessions') AND
    EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'attendance')
  INTO tables_ok;
  
  -- Check users
  SELECT 
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'supervisor') > 0 AND
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'teacher') > 0 AND
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'student') > 0
  INTO users_ok;
  
  -- Check data
  SELECT 
    (SELECT COUNT(*) FROM public.courses) > 0 AND
    (SELECT COUNT(*) FROM public.sections) > 0
  INTO data_ok;
  
  -- Check RLS
  SELECT 
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) = 8
  INTO rls_ok;
  
  -- Check trigger
  SELECT 
    EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created')
  INTO trigger_ok;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📋 الملخص النهائي | Final Summary';
  RAISE NOTICE '========================================';
  
  IF tables_ok THEN
    RAISE NOTICE '✅ الجداول: جاهزة | Tables: Ready';
  ELSE
    RAISE NOTICE '❌ الجداول: غير جاهزة | Tables: Not Ready';
    RAISE NOTICE '   شغّل /COMPLETE-DATABASE-SETUP.sql';
  END IF;
  
  IF users_ok THEN
    RAISE NOTICE '✅ المستخدمون: موجودون | Users: Exist';
  ELSE
    RAISE NOTICE '⚠️  المستخدمون: ناقصون | Users: Missing';
    RAISE NOTICE '   سجّل المستخدمين الثلاثة عبر الموقع';
  END IF;
  
  IF data_ok THEN
    RAISE NOTICE '✅ البيانات: موجودة | Data: Exists';
  ELSE
    RAISE NOTICE '⚠️  البيانات: فارغة | Data: Empty';
    RAISE NOTICE '   شغّل /SAMPLE-DATA.sql';
  END IF;
  
  IF rls_ok THEN
    RAISE NOTICE '✅ الأمان (RLS): مُفعّل | Security: Enabled';
  ELSE
    RAISE NOTICE '⚠️  الأمان (RLS): غير كامل | Security: Incomplete';
  END IF;
  
  IF trigger_ok THEN
    RAISE NOTICE '✅ المُطلقات: جاهزة | Triggers: Ready';
  ELSE
    RAISE NOTICE '❌ المُطلقات: غير موجودة | Triggers: Missing';
  END IF;
  
  RAISE NOTICE '';
  
  IF tables_ok AND users_ok AND data_ok AND rls_ok AND trigger_ok THEN
    RAISE NOTICE '🎉 ═══════════════════════════════════';
    RAISE NOTICE '🎉 النظام جاهز بالكامل! 🚀';
    RAISE NOTICE '🎉 System Fully Ready! 🚀';
    RAISE NOTICE '🎉 ═══════════════════════════════════';
  ELSE
    RAISE NOTICE '⚠️  ═══════════════════════════════════';
    RAISE NOTICE '⚠️  يحتاج النظام إلى إعداد إضافي';
    RAISE NOTICE '⚠️  System needs additional setup';
    RAISE NOTICE '⚠️  ═══════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📖 راجع /⚡-ابدأ-الآن.md للتعليمات';
    RAISE NOTICE '📖 See /⚡-ابدأ-الآن.md for instructions';
  END IF;
  
  RAISE NOTICE '';
END $$;
