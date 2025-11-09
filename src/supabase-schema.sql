-- ============================================
-- King Khalid University Smart Attendance System
-- Complete Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('student', 'instructor', 'admin')),
  student_number TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_student_number ON public.profiles(student_number);

-- ============================================
-- 2. COURSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  credits INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_code ON public.courses(code);

-- ============================================
-- 3. SECTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  instructor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  semester TEXT,
  year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sections_course_id ON public.sections(course_id);
CREATE INDEX IF NOT EXISTS idx_sections_instructor_id ON public.sections(instructor_id);

-- ============================================
-- 4. SCHEDULES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedules_section_id ON public.schedules(section_id);
CREATE INDEX IF NOT EXISTS idx_schedules_day_of_week ON public.schedules(day_of_week);

-- ============================================
-- 5. SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_section_id ON public.sessions(section_id);
CREATE INDEX IF NOT EXISTS idx_sessions_code ON public.sessions(code);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON public.sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON public.sessions(is_active);

-- ============================================
-- 6. ATTENDANCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON public.attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON public.attendance(status);

-- ============================================
-- 7. ENROLLMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(section_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_section_id ON public.enrollments(section_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id);

-- ============================================
-- 8. WEBAUTHN_CREDENTIALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.webauthn_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webauthn_user_id ON public.webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credential_id ON public.webauthn_credentials(credential_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Anyone can insert profile (for registration)
CREATE POLICY "Anyone can create profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (true);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update any profile
CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete profiles
CREATE POLICY "Admins can delete profiles"
  ON public.profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- COURSES POLICIES
-- ============================================

-- Everyone can view courses
CREATE POLICY "Anyone can view courses"
  ON public.courses
  FOR SELECT
  USING (true);

-- Admins and instructors can create courses
CREATE POLICY "Admins and instructors can create courses"
  ON public.courses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'instructor')
    )
  );

-- Admins and instructors can update courses
CREATE POLICY "Admins and instructors can update courses"
  ON public.courses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'instructor')
    )
  );

-- Admins can delete courses
CREATE POLICY "Admins can delete courses"
  ON public.courses
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- SECTIONS POLICIES
-- ============================================

-- Everyone can view sections
CREATE POLICY "Anyone can view sections"
  ON public.sections
  FOR SELECT
  USING (true);

-- Admins and instructors can create sections
CREATE POLICY "Admins and instructors can create sections"
  ON public.sections
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'instructor')
    )
  );

-- Admins and section instructors can update sections
CREATE POLICY "Admins and instructors can update sections"
  ON public.sections
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (role = 'admin' OR id = instructor_id)
    )
  );

-- Admins can delete sections
CREATE POLICY "Admins can delete sections"
  ON public.sections
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- SCHEDULES POLICIES
-- ============================================

-- Everyone can view schedules
CREATE POLICY "Anyone can view schedules"
  ON public.schedules
  FOR SELECT
  USING (true);

-- Admins and instructors can manage schedules
CREATE POLICY "Admins and instructors can create schedules"
  ON public.schedules
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'instructor')
    )
  );

CREATE POLICY "Admins and instructors can update schedules"
  ON public.schedules
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'instructor')
    )
  );

CREATE POLICY "Admins and instructors can delete schedules"
  ON public.schedules
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'instructor')
    )
  );

-- ============================================
-- SESSIONS POLICIES
-- ============================================

-- Everyone can view active sessions
CREATE POLICY "Anyone can view sessions"
  ON public.sessions
  FOR SELECT
  USING (true);

-- Instructors can create sessions for their sections
CREATE POLICY "Instructors can create sessions"
  ON public.sessions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.sections s ON s.instructor_id = p.id
      WHERE p.id = auth.uid() AND s.id = section_id
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Instructors can update their sessions
CREATE POLICY "Instructors can update sessions"
  ON public.sessions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.sections s ON s.instructor_id = p.id
      WHERE p.id = auth.uid() AND s.id = section_id
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Instructors and admins can delete sessions
CREATE POLICY "Instructors can delete sessions"
  ON public.sessions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.sections s ON s.instructor_id = p.id
      WHERE p.id = auth.uid() AND s.id = section_id
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- ATTENDANCE POLICIES
-- ============================================

-- Students can view their own attendance
CREATE POLICY "Students can view own attendance"
  ON public.attendance
  FOR SELECT
  USING (auth.uid() = student_id);

-- Instructors can view attendance for their sections
CREATE POLICY "Instructors can view section attendance"
  ON public.attendance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.sections sec ON sec.instructor_id = p.id
      JOIN public.sessions sess ON sess.section_id = sec.id
      WHERE p.id = auth.uid() AND sess.id = session_id
    )
  );

-- Admins can view all attendance
CREATE POLICY "Admins can view all attendance"
  ON public.attendance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Students can mark their own attendance
CREATE POLICY "Students can mark attendance"
  ON public.attendance
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Instructors can mark attendance for their students
CREATE POLICY "Instructors can mark attendance"
  ON public.attendance
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.sections sec ON sec.instructor_id = p.id
      JOIN public.sessions sess ON sess.section_id = sec.id
      WHERE p.id = auth.uid() AND sess.id = session_id
    )
  );

-- Instructors and admins can update attendance
CREATE POLICY "Instructors can update attendance"
  ON public.attendance
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.sections sec ON sec.instructor_id = p.id
      JOIN public.sessions sess ON sess.section_id = sec.id
      WHERE p.id = auth.uid() AND sess.id = session_id
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- ENROLLMENTS POLICIES
-- ============================================

-- Students can view their own enrollments
CREATE POLICY "Students can view own enrollments"
  ON public.enrollments
  FOR SELECT
  USING (auth.uid() = student_id);

-- Instructors can view enrollments for their sections
CREATE POLICY "Instructors can view section enrollments"
  ON public.enrollments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.sections s ON s.instructor_id = p.id
      WHERE p.id = auth.uid() AND s.id = section_id
    )
  );

-- Admins can view all enrollments
CREATE POLICY "Admins can view all enrollments"
  ON public.enrollments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins and instructors can create enrollments
CREATE POLICY "Admins and instructors can create enrollments"
  ON public.enrollments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'instructor')
    )
  );

-- Admins can delete enrollments
CREATE POLICY "Admins can delete enrollments"
  ON public.enrollments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- WEBAUTHN_CREDENTIALS POLICIES
-- ============================================

-- Users can view their own credentials
CREATE POLICY "Users can view own credentials"
  ON public.webauthn_credentials
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own credentials
CREATE POLICY "Users can create own credentials"
  ON public.webauthn_credentials
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own credentials
CREATE POLICY "Users can update own credentials"
  ON public.webauthn_credentials
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own credentials
CREATE POLICY "Users can delete own credentials"
  ON public.webauthn_credentials
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sections_updated_at BEFORE UPDATE ON public.sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON public.schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webauthn_credentials_updated_at BEFORE UPDATE ON public.webauthn_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert sample courses
INSERT INTO public.courses (code, name, description, credits) VALUES
  ('CS101', 'Introduction to Computer Science', 'Basic programming concepts', 3),
  ('CS201', 'Data Structures', 'Advanced data structures and algorithms', 4),
  ('MATH101', 'Calculus I', 'Introduction to calculus', 3),
  ('ENG101', 'English Composition', 'Academic writing skills', 2)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- END OF SCHEMA
-- ============================================

-- Display success message
DO $$
BEGIN
  RAISE NOTICE '✅ Database schema created successfully!';
  RAISE NOTICE '✅ All tables, indexes, and RLS policies are ready.';
  RAISE NOTICE '✅ You can now use the application.';
END $$;
