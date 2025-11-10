-- ==========================================
-- King Khalid University - Attendance System
-- Database Migrations & Setup
-- ==========================================

-- 1. Create enrollments table (ربط الطلاب بالمواد)
-- ==========================================
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, course_id, section_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_section ON enrollments(section_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);

-- Enable Row Level Security
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for enrollments
-- Students can view their own enrollments
CREATE POLICY "Students can view own enrollments"
  ON enrollments FOR SELECT
  USING (
    auth.uid() = student_id
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'supervisor')
    )
  );

-- Teachers can view enrollments for their courses
CREATE POLICY "Teachers can view course enrollments"
  ON enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = enrollments.course_id
      AND courses.instructor_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'supervisor'
    )
  );

-- Teachers and supervisors can insert enrollments
CREATE POLICY "Teachers can create enrollments"
  ON enrollments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = enrollments.course_id
      AND courses.instructor_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'supervisor'
    )
  );

-- Teachers and supervisors can update enrollments
CREATE POLICY "Teachers can update enrollments"
  ON enrollments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = enrollments.course_id
      AND courses.instructor_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'supervisor'
    )
  );

-- Teachers and supervisors can delete enrollments
CREATE POLICY "Teachers can delete enrollments"
  ON enrollments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = enrollments.course_id
      AND courses.instructor_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'supervisor'
    )
  );

-- ==========================================
-- 2. Add missing columns to existing tables
-- ==========================================

-- Add location to sessions table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'location'
  ) THEN
    ALTER TABLE sessions ADD COLUMN location TEXT;
  END IF;
END $$;

-- Add more details to courses
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'description'
  ) THEN
    ALTER TABLE courses ADD COLUMN description TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'semester'
  ) THEN
    ALTER TABLE courses ADD COLUMN semester TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'year'
  ) THEN
    ALTER TABLE courses ADD COLUMN year INTEGER;
  END IF;
END $$;

-- ==========================================
-- 3. Create useful views for performance
-- ==========================================

-- View: Student enrollments with course details
CREATE OR REPLACE VIEW student_course_view AS
SELECT 
  e.id AS enrollment_id,
  e.student_id,
  e.course_id,
  e.section_id,
  e.status AS enrollment_status,
  e.enrolled_at,
  c.code AS course_code,
  c.name AS course_name,
  c.instructor_id,
  p.full_name AS instructor_name,
  s.name AS section_name
FROM enrollments e
JOIN courses c ON e.course_id = c.id
LEFT JOIN sections s ON e.section_id = s.id
LEFT JOIN profiles p ON c.instructor_id = p.id
WHERE e.status = 'active';

-- View: Course statistics
CREATE OR REPLACE VIEW course_statistics AS
SELECT 
  c.id AS course_id,
  c.code,
  c.name,
  c.instructor_id,
  COUNT(DISTINCT e.student_id) AS enrolled_students,
  COUNT(DISTINCT s.id) AS total_sections,
  COUNT(DISTINCT sch.id) AS total_schedules
FROM courses c
LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
LEFT JOIN sections s ON c.id = s.course_id
LEFT JOIN schedules sch ON s.id = sch.section_id
GROUP BY c.id, c.code, c.name, c.instructor_id;

-- ==========================================
-- 4. Create functions for common operations
-- ==========================================

-- Function to enroll student in course
CREATE OR REPLACE FUNCTION enroll_student(
  p_student_id UUID,
  p_course_id UUID,
  p_section_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_enrollment_id UUID;
BEGIN
  INSERT INTO enrollments (student_id, course_id, section_id)
  VALUES (p_student_id, p_course_id, p_section_id)
  ON CONFLICT (student_id, course_id, section_id) 
  DO UPDATE SET 
    status = 'active',
    updated_at = NOW()
  RETURNING id INTO v_enrollment_id;
  
  RETURN v_enrollment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get student attendance summary
CREATE OR REPLACE FUNCTION get_student_attendance_summary(p_student_id UUID)
RETURNS TABLE (
  course_id UUID,
  course_name TEXT,
  total_sessions BIGINT,
  attended_sessions BIGINT,
  attendance_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    COUNT(DISTINCT sess.id) AS total_sessions,
    COUNT(DISTINCT CASE WHEN att.status = 'present' THEN att.id END) AS attended_sessions,
    ROUND(
      CAST(COUNT(DISTINCT CASE WHEN att.status = 'present' THEN att.id END) AS NUMERIC) 
      / NULLIF(COUNT(DISTINCT sess.id), 0) * 100, 
      2
    ) AS attendance_rate
  FROM enrollments e
  JOIN courses c ON e.course_id = c.id
  JOIN sections sec ON e.section_id = sec.id
  JOIN sessions sess ON sec.id = sess.section_id
  LEFT JOIN attendance att ON sess.id = att.session_id AND att.student_id = p_student_id
  WHERE e.student_id = p_student_id
    AND e.status = 'active'
  GROUP BY c.id, c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 5. Create triggers for updated_at
-- ==========================================

-- Create function for updating timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to enrollments
DROP TRIGGER IF EXISTS update_enrollments_updated_at ON enrollments;
CREATE TRIGGER update_enrollments_updated_at
  BEFORE UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 6. Insert sample data for testing
-- ==========================================

-- Note: Run this only in development/testing
-- Comment out in production

/*
-- Sample enrollment (if you have existing students and courses)
-- Replace UUIDs with actual IDs from your database
INSERT INTO enrollments (student_id, course_id, section_id, status)
SELECT 
  p.id AS student_id,
  c.id AS course_id,
  s.id AS section_id,
  'active' AS status
FROM profiles p
CROSS JOIN courses c
LEFT JOIN sections s ON s.course_id = c.id
WHERE p.role = 'student'
  AND NOT EXISTS (
    SELECT 1 FROM enrollments e 
    WHERE e.student_id = p.id 
    AND e.course_id = c.id
  )
LIMIT 10;
*/

-- ==========================================
-- 7. Performance optimization indexes
-- ==========================================

-- Add indexes to existing tables if not exists
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_sections_course ON sections(course_id);
CREATE INDEX IF NOT EXISTS idx_schedules_section ON schedules(section_id);
CREATE INDEX IF NOT EXISTS idx_sessions_section ON sessions(section_id);
CREATE INDEX IF NOT EXISTS idx_sessions_dates ON sessions(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ==========================================
-- 8. Enable Realtime for all tables
-- ==========================================

-- Enable realtime on enrollments
ALTER PUBLICATION supabase_realtime ADD TABLE enrollments;

-- Make sure other tables have realtime enabled
ALTER PUBLICATION supabase_realtime ADD TABLE courses;
ALTER PUBLICATION supabase_realtime ADD TABLE sections;
ALTER PUBLICATION supabase_realtime ADD TABLE schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- ==========================================
-- Migration Complete!
-- ==========================================

-- To apply this migration:
-- 1. Go to Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run"
-- 5. Verify tables and policies are created

-- To verify:
-- SELECT * FROM enrollments;
-- SELECT * FROM student_course_view;
-- SELECT * FROM course_statistics;
