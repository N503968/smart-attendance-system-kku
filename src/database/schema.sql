-- ============================================
-- Smart Attendance System - Database Schema
-- King Khalid University
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'instructor', 'student')),
  student_number TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allowed students whitelist
CREATE TABLE IF NOT EXISTS public.allowed_students (
  student_number TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email_domain TEXT DEFAULT 'kku.edu.sa',
  active BOOLEAN DEFAULT TRUE
);

-- Courses
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  instructor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sections
CREATE TABLE IF NOT EXISTS public.sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);

-- Schedules
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT NOT NULL
);

-- Sessions (actual class meetings)
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  code TEXT UNIQUE NOT NULL,
  qr_svg TEXT,
  require_webauthn BOOLEAN DEFAULT TRUE
);

-- WebAuthn credentials
CREATE TABLE IF NOT EXISTS public.webauthn_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  credential_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance records
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_at TIMESTAMPTZ DEFAULT NOW(),
  method TEXT NOT NULL CHECK (method IN ('code', 'qr', 'webauthn')),
  UNIQUE(session_id, student_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_student_number ON public.profiles(student_number);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_sections_course ON public.sections(course_id);
CREATE INDEX IF NOT EXISTS idx_schedules_section ON public.schedules(section_id);
CREATE INDEX IF NOT EXISTS idx_sessions_section ON public.sessions(section_id);
CREATE INDEX IF NOT EXISTS idx_sessions_code ON public.sessions(code);
CREATE INDEX IF NOT EXISTS idx_webauthn_user ON public.webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON public.attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance(student_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allowed_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allowed students policies (admin only)
CREATE POLICY "Admins can manage allowed students" ON public.allowed_students
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Courses policies
CREATE POLICY "Everyone can view courses" ON public.courses
  FOR SELECT USING (true);

CREATE POLICY "Instructors can manage own courses" ON public.courses
  FOR ALL USING (
    instructor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Sections policies
CREATE POLICY "Everyone can view sections" ON public.sections
  FOR SELECT USING (true);

CREATE POLICY "Instructors can manage sections" ON public.sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id AND (c.instructor_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

-- Schedules policies
CREATE POLICY "Everyone can view schedules" ON public.schedules
  FOR SELECT USING (true);

CREATE POLICY "Instructors can manage schedules" ON public.schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.sections s
      JOIN public.courses c ON s.course_id = c.id
      WHERE s.id = section_id AND (c.instructor_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

-- Sessions policies
CREATE POLICY "Everyone can view active sessions" ON public.sessions
  FOR SELECT USING (true);

CREATE POLICY "Instructors can manage sessions" ON public.sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.sections s
      JOIN public.courses c ON s.course_id = c.id
      WHERE s.id = section_id AND (c.instructor_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

-- WebAuthn credentials policies
CREATE POLICY "Users can view own credentials" ON public.webauthn_credentials
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own credentials" ON public.webauthn_credentials
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own credentials" ON public.webauthn_credentials
  FOR DELETE USING (user_id = auth.uid());

-- Attendance policies
CREATE POLICY "Students can view own attendance" ON public.attendance
  FOR SELECT USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.sessions ses
      JOIN public.sections sec ON ses.section_id = sec.id
      JOIN public.courses c ON sec.course_id = c.id
      WHERE ses.id = session_id AND (c.instructor_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

CREATE POLICY "Students can insert own attendance" ON public.attendance
  FOR INSERT WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  );

CREATE POLICY "Instructors can manage attendance" ON public.attendance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.sessions ses
      JOIN public.sections sec ON ses.section_id = sec.id
      JOIN public.courses c ON sec.course_id = c.id
      WHERE ses.id = session_id AND (c.instructor_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================

-- Insert allowed students
INSERT INTO public.allowed_students (student_number, full_name, active) VALUES
  ('442100001', 'خالد أحمد السالم', true),
  ('442100002', 'سارة محمد القحطاني', true),
  ('442100003', 'عبدالله علي الشهري', true)
ON CONFLICT (student_number) DO NOTHING;

-- Note: Users should be created via Supabase Auth signup
-- Then profiles will be automatically created via trigger
