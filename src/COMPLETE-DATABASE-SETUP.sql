-- ============================================
-- نظام إدارة الحضور الذكي - جامعة الملك خالد
-- إعداد قاعدة البيانات الكامل
-- Smart Attendance System - King Khalid University
-- Complete Database Setup
-- ============================================

-- نظف قاعدة البيانات من أي جداول قديمة (اختياري)
-- Clean database from old tables (optional)
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.schedules CASCADE;
DROP TABLE IF EXISTS public.sections CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.webauthn_credentials CASCADE;
DROP TABLE IF EXISTS public.allowed_students CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- تفعيل UUID extension
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- إنشاء الجداول
-- Create Tables
-- ============================================

-- جدول الملفات الشخصية (يمتد من auth.users)
-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('supervisor', 'teacher', 'student')),
  student_number TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- قائمة الطلاب المسموح لهم
-- Allowed students whitelist
CREATE TABLE IF NOT EXISTS public.allowed_students (
  student_number TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email_domain TEXT DEFAULT 'kku.edu.sa',
  active BOOLEAN DEFAULT TRUE
);

-- جدول المواد الدراسية
-- Courses table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  instructor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول الأقسام/الشعب
-- Sections table
CREATE TABLE IF NOT EXISTS public.sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  UNIQUE(course_id, name)
);

-- جدول الجداول الدراسية
-- Schedules table
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT NOT NULL
);

-- جدول الجلسات (اللقاءات الفعلية)
-- Sessions table (actual class meetings)
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  code TEXT UNIQUE NOT NULL,
  qr_svg TEXT,
  require_webauthn BOOLEAN DEFAULT TRUE
);

-- جدول بيانات اعتماد WebAuthn
-- WebAuthn credentials table
CREATE TABLE IF NOT EXISTS public.webauthn_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  credential_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول سجلات الحضور
-- Attendance records table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_at TIMESTAMPTZ DEFAULT NOW(),
  method TEXT NOT NULL CHECK (method IN ('code', 'qr', 'webauthn')),
  UNIQUE(session_id, student_id)
);

-- ============================================
-- إنشاء الفهارس لتحسين الأداء
-- Create Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_student_number ON public.profiles(student_number);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_code ON public.courses(code);
CREATE INDEX IF NOT EXISTS idx_sections_course ON public.sections(course_id);
CREATE INDEX IF NOT EXISTS idx_schedules_section ON public.schedules(section_id);
CREATE INDEX IF NOT EXISTS idx_sessions_section ON public.sessions(section_id);
CREATE INDEX IF NOT EXISTS idx_sessions_code ON public.sessions(code);
CREATE INDEX IF NOT EXISTS idx_sessions_starts_at ON public.sessions(starts_at);
CREATE INDEX IF NOT EXISTS idx_sessions_ends_at ON public.sessions(ends_at);
CREATE INDEX IF NOT EXISTS idx_webauthn_user ON public.webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON public.attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance(student_id);

-- ============================================
-- تفعيل Row Level Security (RLS)
-- Enable Row Level Security
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allowed_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- ============================================
-- سياسات الأمان للجداول
-- Security Policies
-- ============================================

-- سياسات جدول الملفات الشخصية
-- Profiles policies

-- يمكن للمستخدمين عرض ملفاتهم الشخصية
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- يمكن للمشرفين عرض جميع الملفات
DROP POLICY IF EXISTS "Supervisors can view all profiles" ON public.profiles;
CREATE POLICY "Supervisors can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'supervisor'
    )
  );

-- يمكن للمعلمين عرض طلابهم
DROP POLICY IF EXISTS "Teachers can view their students" ON public.profiles;
CREATE POLICY "Teachers can view their students" ON public.profiles
  FOR SELECT USING (
    role = 'student' AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- يمكن للمستخدمين تحديث ملفاتهم الشخصية
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- يمكن للمشرفين تحديث جميع الملفات
DROP POLICY IF EXISTS "Supervisors can update all profiles" ON public.profiles;
CREATE POLICY "Supervisors can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'supervisor'
    )
  );

-- يمكن للمشرفين إدراج ملفات جديدة
DROP POLICY IF EXISTS "Supervisors can insert profiles" ON public.profiles;
CREATE POLICY "Supervisors can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'supervisor'
    )
  );

-- سياسات الطلاب المسموح لهم (مشرفين فقط)
-- Allowed students policies (supervisors only)
DROP POLICY IF EXISTS "Supervisors can manage allowed students" ON public.allowed_students;
CREATE POLICY "Supervisors can manage allowed students" ON public.allowed_students
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'supervisor'
    )
  );

-- سياسات المواد الدراسية
-- Courses policies

-- يمكن للجميع عرض المواد
DROP POLICY IF EXISTS "Everyone can view courses" ON public.courses;
CREATE POLICY "Everyone can view courses" ON public.courses
  FOR SELECT USING (true);

-- يمكن للمعلمين إدارة موادهم
DROP POLICY IF EXISTS "Teachers can manage own courses" ON public.courses;
CREATE POLICY "Teachers can manage own courses" ON public.courses
  FOR ALL USING (
    instructor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'supervisor'
    )
  );

-- سياسات الأقسام/الشعب
-- Sections policies

-- يمكن للجميع عرض الأقسام
DROP POLICY IF EXISTS "Everyone can view sections" ON public.sections;
CREATE POLICY "Everyone can view sections" ON public.sections
  FOR SELECT USING (true);

-- يمكن للمعلمين إدارة أقسامهم
DROP POLICY IF EXISTS "Teachers can manage sections" ON public.sections;
CREATE POLICY "Teachers can manage sections" ON public.sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id AND (c.instructor_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supervisor'))
    )
  );

-- سياسات الجداول الدراسية
-- Schedules policies

-- يمكن للجميع عرض الجداول
DROP POLICY IF EXISTS "Everyone can view schedules" ON public.schedules;
CREATE POLICY "Everyone can view schedules" ON public.schedules
  FOR SELECT USING (true);

-- يمكن للمعلمين إدارة جداولهم
DROP POLICY IF EXISTS "Teachers can manage schedules" ON public.schedules;
CREATE POLICY "Teachers can manage schedules" ON public.schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.sections s
      JOIN public.courses c ON s.course_id = c.id
      WHERE s.id = section_id AND (c.instructor_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supervisor'))
    )
  );

-- سياسات الجلسات
-- Sessions policies

-- يمكن للجميع عرض الجلسات النشطة
DROP POLICY IF EXISTS "Everyone can view active sessions" ON public.sessions;
CREATE POLICY "Everyone can view active sessions" ON public.sessions
  FOR SELECT USING (true);

-- يمكن للمعلمين إدارة جلساتهم
DROP POLICY IF EXISTS "Teachers can manage sessions" ON public.sessions;
CREATE POLICY "Teachers can manage sessions" ON public.sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.sections s
      JOIN public.courses c ON s.course_id = c.id
      WHERE s.id = section_id AND (c.instructor_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supervisor'))
    )
  );

-- سياسات بيانات اعتماد WebAuthn
-- WebAuthn credentials policies

-- يمكن للمستخدمين عرض بيانات اعتمادهم
DROP POLICY IF EXISTS "Users can view own credentials" ON public.webauthn_credentials;
CREATE POLICY "Users can view own credentials" ON public.webauthn_credentials
  FOR SELECT USING (user_id = auth.uid());

-- يمكن للمستخدمين إدراج بيانات اعتمادهم
DROP POLICY IF EXISTS "Users can insert own credentials" ON public.webauthn_credentials;
CREATE POLICY "Users can insert own credentials" ON public.webauthn_credentials
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- يمكن للمستخدمين حذف بيانات اعتمادهم
DROP POLICY IF EXISTS "Users can delete own credentials" ON public.webauthn_credentials;
CREATE POLICY "Users can delete own credentials" ON public.webauthn_credentials
  FOR DELETE USING (user_id = auth.uid());

-- سياسات سجلات الحضور
-- Attendance policies

-- يمكن للطلاب عرض حضورهم
DROP POLICY IF EXISTS "Students can view own attendance" ON public.attendance;
CREATE POLICY "Students can view own attendance" ON public.attendance
  FOR SELECT USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.sessions ses
      JOIN public.sections sec ON ses.section_id = sec.id
      JOIN public.courses c ON sec.course_id = c.id
      WHERE ses.id = session_id AND (c.instructor_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supervisor'))
    )
  );

-- يمكن للطلاب إدراج حضورهم
DROP POLICY IF EXISTS "Students can insert own attendance" ON public.attendance;
CREATE POLICY "Students can insert own attendance" ON public.attendance
  FOR INSERT WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  );

-- يمكن للمعلمين إدارة الحضور
DROP POLICY IF EXISTS "Teachers can manage attendance" ON public.attendance;
CREATE POLICY "Teachers can manage attendance" ON public.attendance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.sessions ses
      JOIN public.sections sec ON ses.section_id = sec.id
      JOIN public.courses c ON sec.course_id = c.id
      WHERE ses.id = session_id AND (c.instructor_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supervisor'))
    )
  );

-- ============================================
-- الدوال Functions
-- ============================================

-- دالة لمعالجة المستخدم الجديد
-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, student_number)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    NEW.raw_user_meta_data->>'student_number'
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        role = COALESCE(EXCLUDED.role, 'student'),
        student_number = EXCLUDED.student_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- المُطلق للمستخدم الجديد
-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- بيانات تجريبية للاختبار
-- Sample Data for Testing
-- ============================================

-- إدراج الطلاب المسموح لهم
-- Insert allowed students
INSERT INTO public.allowed_students (student_number, full_name, active) VALUES
  ('442100001', 'خالد أحمد السالم', true),
  ('442100002', 'سارة محمد القحطاني', true),
  ('442100003', 'عبدالله علي الشهري', true),
  ('442100004', 'فاطمة حسن العمري', true),
  ('442100005', 'محمد عبدالرحمن الغامدي', true)
ON CONFLICT (student_number) DO NOTHING;

-- ============================================
-- رسالة النجاح
-- Success Message
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ تم إنشاء قاعدة البيانات بنجاح!';
  RAISE NOTICE '✅ Database Setup Completed Successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 الخطوات التالية / Next Steps:';
  RAISE NOTICE '';
  RAISE NOTICE '1️⃣ سجّل حسابات المستخدمين عبر الموقع:';
  RAISE NOTICE '   Register user accounts through the website:';
  RAISE NOTICE '   - مشرف: admin@kku.edu.sa (role: supervisor)';
  RAISE NOTICE '   - معلم: teacher@kku.edu.sa (role: teacher)';
  RAISE NOTICE '   - طالب: student@kku.edu.sa (role: student)';
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣ بعد التسجيل، شغّل السكربت التالي لإضافة بيانات تجريبية:';
  RAISE NOTICE '   After registration, run /SAMPLE-DATA.sql for test data';
  RAISE NOTICE '';
  RAISE NOTICE '3️⃣ تأكد من تعطيل Email Confirmation في Supabase:';
  RAISE NOTICE '   Make sure Email Confirmation is disabled in Supabase:';
  RAISE NOTICE '   🔗 https://supabase.com/dashboard/project/bscxhshnubkhngodruuj/settings/auth';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;
