-- ============================================
-- نظام إدارة الحضور الذكي - جامعة الملك خالد
-- بيانات تجريبية للاختبار
-- Smart Attendance System - Sample Data
-- ============================================

-- ⚠️ هام: يجب تشغيل هذا السكربت بعد تسجيل المستخدمين عبر الموقع
-- Important: Run this script AFTER registering users through the website

-- ============================================
-- تحديث أدوار المستخدمين
-- Update User Roles
-- ============================================

-- تحديث دور المشرف
-- Update supervisor role
UPDATE public.profiles 
SET role = 'supervisor' 
WHERE email = 'admin@kku.edu.sa';

-- تحديث دور المعلم
-- Update teacher role
UPDATE public.profiles 
SET role = 'teacher' 
WHERE email = 'teacher@kku.edu.sa';

-- تحديث دور الطالب
-- Update student role
UPDATE public.profiles 
SET role = 'student' 
WHERE email = 'student@kku.edu.sa';

-- ============================================
-- إضافة مواد دراسية
-- Insert Courses
-- ============================================

-- احصل على معرف المعلم
-- Get teacher ID
DO $$
DECLARE
  teacher_id UUID;
BEGIN
  -- احصل على معرف المعلم
  SELECT id INTO teacher_id FROM public.profiles WHERE email = 'teacher@kku.edu.sa' LIMIT 1;
  
  IF teacher_id IS NULL THEN
    RAISE EXCEPTION '❌ لم يتم العثور على المعلم! يجب تسجيل حساب teacher@kku.edu.sa أولاً';
  END IF;
  
  -- إدراج المواد الدراسية
  INSERT INTO public.courses (code, name, instructor_id) VALUES
    ('CIS342', 'نظم قواعد البيانات', teacher_id),
    ('CIS481', 'أمن المعلومات', teacher_id),
    ('CIS351', 'تحليل وتصميم الأنظمة', teacher_id),
    ('CIS241', 'هياكل البيانات', teacher_id)
  ON CONFLICT (code) DO UPDATE
    SET name = EXCLUDED.name,
        instructor_id = EXCLUDED.instructor_id;
  
  RAISE NOTICE '✅ تم إضافة المواد الدراسية بنجاح';
END $$;

-- ============================================
-- إضافة الشعب/الأقسام
-- Insert Sections
-- ============================================

DO $$
DECLARE
  course_cis342 UUID;
  course_cis481 UUID;
  course_cis351 UUID;
  course_cis241 UUID;
  section_cis342_1 UUID;
  section_cis481_1 UUID;
  section_cis351_1 UUID;
  section_cis241_1 UUID;
BEGIN
  -- احصل على معرفات المواد
  SELECT id INTO course_cis342 FROM public.courses WHERE code = 'CIS342';
  SELECT id INTO course_cis481 FROM public.courses WHERE code = 'CIS481';
  SELECT id INTO course_cis351 FROM public.courses WHERE code = 'CIS351';
  SELECT id INTO course_cis241 FROM public.courses WHERE code = 'CIS241';
  
  -- إدراج الشعب
  INSERT INTO public.sections (course_id, name) VALUES
    (course_cis342, 'الشعبة 1'),
    (course_cis481, 'الشعبة 1'),
    (course_cis351, 'الشعبة 1'),
    (course_cis241, 'الشعبة 1')
  ON CONFLICT (course_id, name) DO NOTHING
  RETURNING id INTO section_cis342_1;
  
  -- إذا لم يتم إدراج جديد، احصل على المعرفات الموجودة
  IF section_cis342_1 IS NULL THEN
    SELECT id INTO section_cis342_1 FROM public.sections WHERE course_id = course_cis342 AND name = 'الشعبة 1';
    SELECT id INTO section_cis481_1 FROM public.sections WHERE course_id = course_cis481 AND name = 'الشعبة 1';
    SELECT id INTO section_cis351_1 FROM public.sections WHERE course_id = course_cis351 AND name = 'الشعبة 1';
    SELECT id INTO section_cis241_1 FROM public.sections WHERE course_id = course_cis241 AND name = 'الشعبة 1';
  END IF;
  
  RAISE NOTICE '✅ تم إضافة الشعب بنجاح';
END $$;

-- ============================================
-- إضافة الجداول الدراسية
-- Insert Schedules
-- ============================================

DO $$
DECLARE
  section_cis342 UUID;
  section_cis481 UUID;
  section_cis351 UUID;
  section_cis241 UUID;
BEGIN
  -- احصل على معرفات الشعب
  SELECT s.id INTO section_cis342 
  FROM public.sections s 
  JOIN public.courses c ON s.course_id = c.id 
  WHERE c.code = 'CIS342' AND s.name = 'الشعبة 1';
  
  SELECT s.id INTO section_cis481 
  FROM public.sections s 
  JOIN public.courses c ON s.course_id = c.id 
  WHERE c.code = 'CIS481' AND s.name = 'الشعبة 1';
  
  SELECT s.id INTO section_cis351 
  FROM public.sections s 
  JOIN public.courses c ON s.course_id = c.id 
  WHERE c.code = 'CIS351' AND s.name = 'الشعبة 1';
  
  SELECT s.id INTO section_cis241 
  FROM public.sections s 
  JOIN public.courses c ON s.course_id = c.id 
  WHERE c.code = 'CIS241' AND s.name = 'الشعبة 1';
  
  -- إدراج جداول CIS342 (الأحد والثلاثاء)
  INSERT INTO public.schedules (section_id, day_of_week, start_time, end_time, location) VALUES
    (section_cis342, 0, '08:00', '09:30', 'معمل 203'),
    (section_cis342, 2, '08:00', '09:30', 'معمل 203');
  
  -- إدراج جداول CIS481 (الاثنين والأربعاء)
  INSERT INTO public.schedules (section_id, day_of_week, start_time, end_time, location) VALUES
    (section_cis481, 1, '10:00', '11:30', 'قاعة 105'),
    (section_cis481, 3, '10:00', '11:30', 'قاعة 105');
  
  -- إدراج جداول CIS351 (الأحد والثلاثاء)
  INSERT INTO public.schedules (section_id, day_of_week, start_time, end_time, location) VALUES
    (section_cis351, 0, '13:00', '14:30', 'قاعة 201'),
    (section_cis351, 2, '13:00', '14:30', 'قاعة 201');
  
  -- إدراج جداول CIS241 (الاثنين والأربعاء)
  INSERT INTO public.schedules (section_id, day_of_week, start_time, end_time, location) VALUES
    (section_cis241, 1, '08:00', '09:30', 'معمل 101'),
    (section_cis241, 3, '08:00', '09:30', 'معمل 101');
  
  RAISE NOTICE '✅ تم إضافة الجداول الدراسية بنجاح';
END $$;

-- ============================================
-- إضافة جلسات حضور تجريبية
-- Insert Sample Sessions
-- ============================================

DO $$
DECLARE
  section_cis342 UUID;
  section_cis481 UUID;
  session_code TEXT;
BEGIN
  -- احصل على معرفات الشعب
  SELECT s.id INTO section_cis342 
  FROM public.sections s 
  JOIN public.courses c ON s.course_id = c.id 
  WHERE c.code = 'CIS342' AND s.name = 'الشعبة 1';
  
  SELECT s.id INTO section_cis481 
  FROM public.sections s 
  JOIN public.courses c ON s.course_id = c.id 
  WHERE c.code = 'CIS481' AND s.name = 'الشعبة 1';
  
  -- إنشاء جلسة مفتوحة لـ CIS342 (اليوم)
  session_code := 'CIS342-' || to_char(NOW(), 'YYYYMMDD-HH24MISS');
  INSERT INTO public.sessions (section_id, starts_at, ends_at, code, require_webauthn) 
  VALUES (
    section_cis342,
    NOW(),
    NOW() + INTERVAL '2 hours',
    session_code,
    false
  )
  ON CONFLICT (code) DO NOTHING;
  
  -- إنشاء جلسة مفتوحة لـ CIS481 (اليوم)
  session_code := 'CIS481-' || to_char(NOW(), 'YYYYMMDD-HH24MISS');
  INSERT INTO public.sessions (section_id, starts_at, ends_at, code, require_webauthn) 
  VALUES (
    section_cis481,
    NOW(),
    NOW() + INTERVAL '2 hours',
    session_code,
    false
  )
  ON CONFLICT (code) DO NOTHING;
  
  -- إنشاء جلسة سابقة (الأمس) لـ CIS342
  session_code := 'CIS342-' || to_char(NOW() - INTERVAL '1 day', 'YYYYMMDD-HH24MISS');
  INSERT INTO public.sessions (section_id, starts_at, ends_at, code, require_webauthn) 
  VALUES (
    section_cis342,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day' + INTERVAL '1 hour 30 minutes',
    session_code,
    false
  )
  ON CONFLICT (code) DO NOTHING;
  
  RAISE NOTICE '✅ تم إضافة الجلسات التجريبية بنجاح';
END $$;

-- ============================================
-- إضافة سجلات حضور تجريبية
-- Insert Sample Attendance Records
-- ============================================

DO $$
DECLARE
  student_id UUID;
  session_id UUID;
BEGIN
  -- احصل على معرف الطالب
  SELECT id INTO student_id FROM public.profiles WHERE email = 'student@kku.edu.sa' LIMIT 1;
  
  IF student_id IS NOT NULL THEN
    -- احصل على معرف جلسة سابقة
    SELECT id INTO session_id 
    FROM public.sessions 
    WHERE starts_at < NOW() 
    ORDER BY starts_at DESC 
    LIMIT 1;
    
    IF session_id IS NOT NULL THEN
      -- إدراج سجل حضور
      INSERT INTO public.attendance (session_id, student_id, status, method) 
      VALUES (session_id, student_id, 'present', 'code')
      ON CONFLICT (session_id, student_id) DO NOTHING;
      
      RAISE NOTICE '✅ تم إضافة سجلات الحضور التجريبية بنجاح';
    END IF;
  END IF;
END $$;

-- ============================================
-- تحقق من البيانات المُدرجة
-- Verify Inserted Data
-- ============================================

DO $$
DECLARE
  courses_count INT;
  sections_count INT;
  schedules_count INT;
  sessions_count INT;
  profiles_count INT;
BEGIN
  SELECT COUNT(*) INTO courses_count FROM public.courses;
  SELECT COUNT(*) INTO sections_count FROM public.sections;
  SELECT COUNT(*) INTO schedules_count FROM public.schedules;
  SELECT COUNT(*) INTO sessions_count FROM public.sessions;
  SELECT COUNT(*) INTO profiles_count FROM public.profiles;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 ملخص البيانات / Data Summary';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'المواد الدراسية / Courses: %', courses_count;
  RAISE NOTICE 'الشعب / Sections: %', sections_count;
  RAISE NOTICE 'الجداول / Schedules: %', schedules_count;
  RAISE NOTICE 'الجلسات / Sessions: %', sessions_count;
  RAISE NOTICE 'المستخدمين / Users: %', profiles_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- ============================================
-- رسالة النجاح النهائية
-- Final Success Message
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ تم إضافة البيانات التجريبية بنجاح!';
  RAISE NOTICE '✅ Sample Data Added Successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 الآن يمكنك:';
  RAISE NOTICE '   Now you can:';
  RAISE NOTICE '';
  RAISE NOTICE '1️⃣ سجّل دخول كمعلم (teacher@kku.edu.sa)';
  RAISE NOTICE '   واعرض المواد والجلسات';
  RAISE NOTICE '   Login as teacher and view courses & sessions';
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣ سجّل دخول كطالب (student@kku.edu.sa)';
  RAISE NOTICE '   واعرض الجداول والحضور';
  RAISE NOTICE '   Login as student and view schedules & attendance';
  RAISE NOTICE '';
  RAISE NOTICE '3️⃣ سجّل دخول كمشرف (admin@kku.edu.sa)';
  RAISE NOTICE '   واعرض كل البيانات والتقارير';
  RAISE NOTICE '   Login as supervisor and view all data & reports';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;
