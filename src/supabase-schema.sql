-- ============================================
-- King Khalid University Smart Attendance System
-- Complete Database Schema - UPDATED ROLES
-- student | teacher | supervisor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE - UPDATED ROLES
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'supervisor')),
  student_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_student_number ON public.profiles(student_number);

-- ============================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- ============================================
-- This function automatically creates a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, student_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    NEW.raw_user_meta_data->>'student_number'
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        email = COALESCE(EXCLUDED.email, profiles.email),
        role = COALESCE(EXCLUDED.role, profiles.role),
        student_number = COALESCE(EXCLUDED.student_number, profiles.student_number);
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  require_webauthn BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_section_id ON public.sessions(section_id);
CREATE INDEX IF NOT EXISTS idx_sessions_code ON public.sessions(code);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON public.sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON public.sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_starts_at ON public.sessions(starts_at);
CREATE INDEX IF NOT EXISTS idx_sessions_ends_at ON public.sessions(ends_at);

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
-- PROFILES POLICIES - UPDATED FOR NEW ROLES
-- ============================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can create profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Supervisors can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Supervisors can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Supervisors can delete profiles" ON public.profiles;

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

-- Supervisors can view all profiles
CREATE POLICY "Supervisors can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'supervisor'
    )
  );

-- Supervisors can update any profile
CREATE POLICY "Supervisors can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'supervisor'
    )
  );

-- Supervisors can delete profiles
CREATE POLICY "Supervisors can delete profiles"
  ON public.profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'supervisor'
    )
  );

-- ============================================
-- COURSES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Anyone can view courses" ON public.courses;
DROP POLICY IF EXISTS "Admins and instructors can create courses" ON public.courses;
DROP POLICY IF EXISTS "Admins and instructors can update courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can delete courses" ON public.courses;
DROP POLICY IF EXISTS "Supervisors and teachers can create courses" ON public.courses;
DROP POLICY IF EXISTS "Supervisors and teachers can update courses" ON public.courses;
DROP POLICY IF EXISTS "Supervisors can delete courses" ON public.courses;

-- Everyone can view courses
CREATE POLICY "Anyone can view courses"
  ON public.courses
  FOR SELECT
  USING (true);

-- Supervisors and teachers can create courses
CREATE POLICY "Supervisors and teachers can create courses"
  ON public.courses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('supervisor', 'teacher')
    )
  );

-- Supervisors and teachers can update courses
CREATE POLICY "Supervisors and teachers can update courses"
  ON public.courses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('supervisor', 'teacher')
    )
  );

-- Supervisors can delete courses
CREATE POLICY "Supervisors can delete courses"
  ON public.courses
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'supervisor'
    )
  );

-- ============================================
-- SECTIONS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Anyone can view sections" ON public.sections;
DROP POLICY IF EXISTS "Admins and instructors can create sections" ON public.sections;
DROP POLICY IF EXISTS "Admins and instructors can update sections" ON public.sections;
DROP POLICY IF EXISTS "Admins can delete sections" ON public.sections;
DROP POLICY IF EXISTS "Supervisors and teachers can create sections" ON public.sections;
DROP POLICY IF EXISTS "Supervisors and teachers can update sections" ON public.sections;
DROP POLICY IF EXISTS "Supervisors can delete sections" ON public.sections;

-- Everyone can view sections
CREATE POLICY "Anyone can view sections"
  ON public.sections
  FOR SELECT
  USING (true);

-- Supervisors and teachers can create sections
CREATE POLICY "Supervisors and teachers can create sections"
  ON public.sections
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('supervisor', 'teacher')
    )
  );

-- Supervisors and section teachers can update sections
CREATE POLICY "Supervisors and teachers can update sections"
  ON public.sections
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (role = 'supervisor' OR id = instructor_id)
    )
  );

-- Supervisors can delete sections
CREATE POLICY "Supervisors can delete sections"
  ON public.sections
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'supervisor'
    )
  );

-- ============================================
-- SCHEDULES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Anyone can view schedules" ON public.schedules;
DROP POLICY IF EXISTS "Admins and instructors can create schedules" ON public.schedules;
DROP POLICY IF EXISTS "Admins and instructors can update schedules" ON public.schedules;
DROP POLICY IF EXISTS "Admins and instructors can delete schedules" ON public.schedules;
DROP POLICY IF EXISTS "Supervisors and teachers can create schedules" ON public.schedules;
DROP POLICY IF EXISTS "Supervisors and teachers can update schedules" ON public.schedules;
DROP POLICY IF EXISTS "Supervisors and teachers can delete schedules" ON public.schedules;

-- Everyone can view schedules
CREATE POLICY "Anyone can view schedules"
  ON public.schedules
  FOR SELECT
  USING (true);

-- Supervisors and teachers can manage schedules
CREATE POLICY "Supervisors and teachers can create schedules"
  ON public.schedules
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('supervisor', 'teacher')
    )
  );

CREATE POLICY "Supervisors and teachers can update schedules"
  ON public.schedules
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('supervisor', 'teacher')
    )
  );

CREATE POLICY "Supervisors and teachers can delete schedules"
  ON public.schedules
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('supervisor', 'teacher')
    )
  );

-- ============================================
-- SESSIONS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Anyone can view sessions" ON public.sessions;
DROP POLICY IF EXISTS "Instructors can create sessions" ON public.sessions;
DROP POLICY IF EXISTS "Instructors can update sessions" ON public.sessions;
DROP POLICY IF EXISTS "Instructors can delete sessions" ON public.sessions;
DROP POLICY IF EXISTS "Teachers can create sessions" ON public.sessions;
DROP POLICY IF EXISTS "Teachers can update sessions" ON public.sessions;
DROP POLICY IF EXISTS "Teachers can delete sessions" ON public.sessions;

-- Everyone can view active sessions
CREATE POLICY "Anyone can view sessions"
  ON public.sessions
  FOR SELECT
  USING (true);

-- Teachers can create sessions for their sections
CREATE POLICY "Teachers can create sessions"
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
      WHERE id = auth.uid() AND role = 'supervisor'
    )
  );

-- Teachers can update their sessions
CREATE POLICY "Teachers can update sessions"
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
      WHERE id = auth.uid() AND role = 'supervisor'
    )
  );

-- Teachers and supervisors can delete sessions
CREATE POLICY "Teachers can delete sessions"
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
      WHERE id = auth.uid() AND role = 'supervisor'
    )
  );

-- ============================================
-- ATTENDANCE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Students can view own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Instructors can view section attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admins can view all attendance" ON public.attendance;
DROP POLICY IF EXISTS "Students can mark attendance" ON public.attendance;
DROP POLICY IF EXISTS "Instructors can mark attendance" ON public.attendance;
DROP POLICY IF EXISTS "Instructors can update attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers can view section attendance" ON public.attendance;
DROP POLICY IF EXISTS "Supervisors can view all attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers can mark attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers can update attendance" ON public.attendance;

-- Students can view their own attendance
CREATE POLICY "Students can view own attendance"
  ON public.attendance
  FOR SELECT
  USING (auth.uid() = student_id);

-- Teachers can view attendance for their sections
CREATE POLICY "Teachers can view section attendance"
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

-- Supervisors can view all attendance
CREATE POLICY "Supervisors can view all attendance"
  ON public.attendance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'supervisor'
    )
  );

-- Students can mark their own attendance
CREATE POLICY "Students can mark attendance"
  ON public.attendance
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Teachers can mark attendance for their students
CREATE POLICY "Teachers can mark attendance"
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

-- Teachers and supervisors can update attendance
CREATE POLICY "Teachers can update attendance"
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
      WHERE id = auth.uid() AND role = 'supervisor'
    )
  );

-- ============================================
-- ENROLLMENTS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Students can view own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Instructors can view section enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins and instructors can create enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can delete enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Teachers can view section enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Supervisors can view all enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Supervisors and teachers can create enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Supervisors can delete enrollments" ON public.enrollments;

-- Students can view their own enrollments
CREATE POLICY "Students can view own enrollments"
  ON public.enrollments
  FOR SELECT
  USING (auth.uid() = student_id);

-- Teachers can view enrollments for their sections
CREATE POLICY "Teachers can view section enrollments"
  ON public.enrollments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.sections s ON s.instructor_id = p.id
      WHERE p.id = auth.uid() AND s.id = section_id
    )
  );

-- Supervisors can view all enrollments
CREATE POLICY "Supervisors can view all enrollments"
  ON public.enrollments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'supervisor'
    )
  );

-- Supervisors and teachers can create enrollments
CREATE POLICY "Supervisors and teachers can create enrollments"
  ON public.enrollments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('supervisor', 'teacher')
    )
  );

-- Supervisors can delete enrollments
CREATE POLICY "Supervisors can delete enrollments"
  ON public.enrollments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'supervisor'
    )
  );

-- ============================================
-- WEBAUTHN_CREDENTIALS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own credentials" ON public.webauthn_credentials;
DROP POLICY IF EXISTS "Users can create own credentials" ON public.webauthn_credentials;
DROP POLICY IF EXISTS "Users can update own credentials" ON public.webauthn_credentials;
DROP POLICY IF EXISTS "Users can delete own credentials" ON public.webauthn_credentials;

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

-- Drop old triggers if they exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
DROP TRIGGER IF EXISTS update_sections_updated_at ON public.sections;
DROP TRIGGER IF EXISTS update_schedules_updated_at ON public.schedules;
DROP TRIGGER IF EXISTS update_sessions_updated_at ON public.sessions;
DROP TRIGGER IF EXISTS update_attendance_updated_at ON public.attendance;
DROP TRIGGER IF EXISTS update_enrollments_updated_at ON public.enrollments;
DROP TRIGGER IF EXISTS update_webauthn_credentials_updated_at ON public.webauthn_credentials;

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
  RAISE NOTICE '✅ Roles updated: student | teacher | supervisor';
  RAISE NOTICE '✅ Auto-profile creation trigger installed.';
  RAISE NOTICE '✅ You can now use the application.';
END $$;