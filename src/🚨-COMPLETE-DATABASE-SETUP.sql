-- ==========================================
-- 🚨 إعداد قاعدة البيانات الكامل
-- COMPLETE DATABASE SETUP
-- نفذ هذا في Supabase SQL Editor
-- ==========================================

-- تفعيل UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1️⃣ جدول profiles (المستخدمين)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'supervisor')),
  student_id TEXT,
  department TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON public.profiles(student_id);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'supervisor'
  ));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ==========================================
-- 2️⃣ جدول courses (المواد الدراسية)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  instructor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  semester TEXT,
  year INTEGER,
  credits INTEGER DEFAULT 3,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_courses_code ON public.courses(code);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON public.courses(instructor_id);

-- RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view courses" ON public.courses;
CREATE POLICY "Anyone can view courses"
  ON public.courses FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Teachers can create own courses" ON public.courses;
CREATE POLICY "Teachers can create own courses"
  ON public.courses FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = instructor_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supervisor')
  );

DROP POLICY IF EXISTS "Teachers can update own courses" ON public.courses;
CREATE POLICY "Teachers can update own courses"
  ON public.courses FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = instructor_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supervisor')
  );

-- ==========================================
-- 3️⃣ جدول sections (الشعب)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  max_students INTEGER DEFAULT 40,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sections_course ON public.sections(course_id);

-- RLS
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view sections" ON public.sections;
CREATE POLICY "Anyone can view sections"
  ON public.sections FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Teachers can manage sections" ON public.sections;
CREATE POLICY "Teachers can manage sections"
  ON public.sections FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = sections.course_id
      AND (courses.instructor_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supervisor'
      ))
    )
  );

-- ==========================================
-- 4️⃣ جدول schedules (الجداول الدراسية)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_schedules_section ON public.schedules(section_id);
CREATE INDEX IF NOT EXISTS idx_schedules_day ON public.schedules(day_of_week);

-- RLS
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view schedules" ON public.schedules;
CREATE POLICY "Anyone can view schedules"
  ON public.schedules FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Teachers can manage schedules" ON public.schedules;
CREATE POLICY "Teachers can manage schedules"
  ON public.schedules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sections
      JOIN public.courses ON courses.id = sections.course_id
      WHERE sections.id = schedules.section_id
      AND (courses.instructor_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supervisor'
      ))
    )
  );

-- ==========================================
-- 5️⃣ جدول sessions (جلسات الحضور)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  starts_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMP,
  location TEXT,
  require_webauthn BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Update existing sessions to have ends_at if missing
UPDATE public.sessions 
SET ends_at = starts_at + INTERVAL '2 hours' 
WHERE ends_at IS NULL AND starts_at IS NOT NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_section ON public.sessions(section_id);
CREATE INDEX IF NOT EXISTS idx_sessions_code ON public.sessions(code);
CREATE INDEX IF NOT EXISTS idx_sessions_starts_at ON public.sessions(starts_at);
CREATE INDEX IF NOT EXISTS idx_sessions_ends_at ON public.sessions(ends_at);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON public.sessions(is_active);

-- RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view sessions" ON public.sessions;
CREATE POLICY "Anyone can view sessions"
  ON public.sessions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Teachers can manage sessions" ON public.sessions;
CREATE POLICY "Teachers can manage sessions"
  ON public.sessions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sections
      JOIN public.courses ON courses.id = sections.course_id
      WHERE sections.id = sessions.section_id
      AND (courses.instructor_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supervisor'
      ))
    )
  );

-- ==========================================
-- 6️⃣ جدول enrollments (التسجيل في المواد)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_section ON public.enrollments(section_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(status);

-- RLS
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own enrollments" ON public.enrollments;
CREATE POLICY "Students can view own enrollments"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (
    auth.uid() = student_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'supervisor'))
  );

DROP POLICY IF EXISTS "Teachers can manage enrollments" ON public.enrollments;
CREATE POLICY "Teachers can manage enrollments"
  ON public.enrollments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = enrollments.course_id
      AND (courses.instructor_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supervisor'
      ))
    )
  );

-- ==========================================
-- 7️⃣ جدول attendance (سجل الحضور)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_at TIMESTAMP DEFAULT NOW(),
  marked_by TEXT,
  verification_method TEXT CHECK (verification_method IN ('code', 'qr', 'webauthn', 'manual')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, session_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON public.attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON public.attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_marked_at ON public.attendance(marked_at);

-- RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own attendance" ON public.attendance;
CREATE POLICY "Students can view own attendance"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (
    auth.uid() = student_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'supervisor'))
  );

DROP POLICY IF EXISTS "Students can mark own attendance" ON public.attendance;
CREATE POLICY "Students can mark own attendance"
  ON public.attendance FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Teachers can manage attendance" ON public.attendance;
CREATE POLICY "Teachers can manage attendance"
  ON public.attendance FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      JOIN public.sections ON sections.id = sessions.section_id
      JOIN public.courses ON courses.id = sections.course_id
      WHERE sessions.id = attendance.session_id
      AND (courses.instructor_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supervisor'
      ))
    )
  );

-- ==========================================
-- 8️⃣ جدول webauthn_credentials (بيانات البصمة)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.webauthn_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  credential_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  counter INTEGER DEFAULT 0,
  device_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webauthn_user ON public.webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credential ON public.webauthn_credentials(credential_id);

-- RLS
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own credentials" ON public.webauthn_credentials;
CREATE POLICY "Users can view own credentials"
  ON public.webauthn_credentials FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own credentials" ON public.webauthn_credentials;
CREATE POLICY "Users can manage own credentials"
  ON public.webauthn_credentials FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- ==========================================
-- ✅ انتهى الإعداد!
-- ==========================================

-- التحقق من الجداول
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- عرض عدد الصفوف في كل جدول
SELECT 
  'profiles' as table_name, COUNT(*)::bigint as row_count FROM public.profiles
UNION ALL
SELECT 'courses', COUNT(*)::bigint FROM public.courses
UNION ALL
SELECT 'sections', COUNT(*)::bigint FROM public.sections
UNION ALL
SELECT 'schedules', COUNT(*)::bigint FROM public.schedules
UNION ALL
SELECT 'sessions', COUNT(*)::bigint FROM public.sessions
UNION ALL
SELECT 'enrollments', COUNT(*)::bigint FROM public.enrollments
UNION ALL
SELECT 'attendance', COUNT(*)::bigint FROM public.attendance
UNION ALL
SELECT 'webauthn_credentials', COUNT(*)::bigint FROM public.webauthn_credentials
ORDER BY table_name;
