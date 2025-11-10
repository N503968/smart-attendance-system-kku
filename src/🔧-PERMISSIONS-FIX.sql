-- ==========================================
-- 🔧 إصلاح الصلاحيات والأداء
-- PERMISSIONS & PERFORMANCE FIX
-- نفذ هذا في Supabase SQL Editor
-- ==========================================

-- تفعيل UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1️⃣ إصلاح RLS Policies - المشرف
-- ==========================================

-- profiles: المشرف يرى ويدير الجميع
DROP POLICY IF EXISTS "Supervisors can view all profiles" ON public.profiles;
CREATE POLICY "Supervisors can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supervisor')
    OR auth.uid() = id
  );

DROP POLICY IF EXISTS "Supervisors can create users" ON public.profiles;
CREATE POLICY "Supervisors can create users"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supervisor')
  );

DROP POLICY IF EXISTS "Supervisors can update users" ON public.profiles;
CREATE POLICY "Supervisors can update users"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supervisor')
    OR auth.uid() = id
  );

DROP POLICY IF EXISTS "Supervisors can delete users" ON public.profiles;
CREATE POLICY "Supervisors can delete users"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supervisor')
  );

-- ==========================================
-- 2️⃣ إصلاح RLS Policies - المدرس
-- ==========================================

-- courses: المدرس يُنشئ ويدير مواده
DROP POLICY IF EXISTS "Teachers manage own courses" ON public.courses;
CREATE POLICY "Teachers manage own courses"
  ON public.courses FOR ALL
  TO authenticated
  USING (
    instructor_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supervisor')
  )
  WITH CHECK (
    instructor_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supervisor')
  );

-- sections: المدرس يُنشئ شعب لمواده
DROP POLICY IF EXISTS "Teachers manage sections" ON public.sections;
CREATE POLICY "Teachers manage sections"
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
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = sections.course_id 
      AND (courses.instructor_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supervisor'
      ))
    )
  );

-- schedules: المدرس يُنشئ جداول لشعبه
DROP POLICY IF EXISTS "Teachers manage schedules" ON public.schedules;
CREATE POLICY "Teachers manage schedules"
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
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sections
      JOIN public.courses ON courses.id = sections.course_id
      WHERE sections.id = schedules.section_id
      AND (courses.instructor_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supervisor'
      ))
    )
  );

-- sessions: المدرس يُنشئ جلسات لمواده
DROP POLICY IF EXISTS "Teachers manage sessions" ON public.sessions;
CREATE POLICY "Teachers manage sessions"
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
  )
  WITH CHECK (
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
-- 3️⃣ إصلاح RLS Policies - الطالب
-- ==========================================

-- enrollments: الطالب يرى تسجيلاته فقط
DROP POLICY IF EXISTS "Students view own enrollments" ON public.enrollments;
CREATE POLICY "Students view own enrollments"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'supervisor'))
  );

-- attendance: الطالب يرى حضوره فقط ويسجله
DROP POLICY IF EXISTS "Students view own attendance" ON public.attendance;
CREATE POLICY "Students view own attendance"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'supervisor'))
  );

DROP POLICY IF EXISTS "Students mark own attendance" ON public.attendance;
CREATE POLICY "Students mark own attendance"
  ON public.attendance FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

-- ==========================================
-- 4️⃣ تحسينات الأداء - Indexes
-- ==========================================

-- Indexes على profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role_email ON public.profiles(role, email);
CREATE INDEX IF NOT EXISTS idx_profiles_student_number ON public.profiles(student_id) WHERE role = 'student';

-- Indexes على courses
CREATE INDEX IF NOT EXISTS idx_courses_instructor_semester ON public.courses(instructor_id, semester);

-- Indexes على enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_student_status ON public.enrollments(student_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_status ON public.enrollments(course_id, status);

-- Indexes على attendance
CREATE INDEX IF NOT EXISTS idx_attendance_student_marked ON public.attendance(student_id, marked_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_session_status ON public.attendance(session_id, status);

-- Indexes على sessions
CREATE INDEX IF NOT EXISTS idx_sessions_section_active ON public.sessions(section_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sessions_dates ON public.sessions(starts_at, ends_at);

-- ==========================================
-- 5️⃣ تحسينات الأداء - Views
-- ==========================================

-- View لعرض المواد مع تفاصيل المدرس
CREATE OR REPLACE VIEW public.courses_with_instructor AS
SELECT 
  c.id,
  c.code,
  c.name,
  c.description,
  c.semester,
  c.year,
  c.credits,
  c.instructor_id,
  p.full_name as instructor_name,
  p.email as instructor_email,
  c.created_at,
  c.updated_at
FROM public.courses c
LEFT JOIN public.profiles p ON p.id = c.instructor_id;

-- View لعرض التسجيلات مع تفاصيل الطالب والمادة
CREATE OR REPLACE VIEW public.enrollments_detailed AS
SELECT 
  e.id,
  e.student_id,
  e.course_id,
  e.section_id,
  e.status,
  e.enrolled_at,
  p.full_name as student_name,
  p.email as student_email,
  p.student_id as student_number,
  c.code as course_code,
  c.name as course_name,
  s.name as section_name
FROM public.enrollments e
JOIN public.profiles p ON p.id = e.student_id
JOIN public.courses c ON c.id = e.course_id
LEFT JOIN public.sections s ON s.id = e.section_id;

-- View للحضور مع التفاصيل
CREATE OR REPLACE VIEW public.attendance_detailed AS
SELECT 
  a.id,
  a.student_id,
  a.session_id,
  a.status,
  a.marked_at,
  a.verification_method,
  p.full_name as student_name,
  p.student_id as student_number,
  sess.code as session_code,
  sess.starts_at,
  sect.name as section_name,
  c.code as course_code,
  c.name as course_name
FROM public.attendance a
JOIN public.profiles p ON p.id = a.student_id
JOIN public.sessions sess ON sess.id = a.session_id
JOIN public.sections sect ON sect.id = sess.section_id
JOIN public.courses c ON c.id = sect.course_id;

-- ==========================================
-- 6️⃣ Functions مساعدة
-- ==========================================

-- Function للحصول على إحصائيات الطالب
CREATE OR REPLACE FUNCTION public.get_student_stats(student_uuid UUID)
RETURNS TABLE (
  total_sessions BIGINT,
  present_count BIGINT,
  absent_count BIGINT,
  late_count BIGINT,
  attendance_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_sessions,
    COUNT(*) FILTER (WHERE status = 'present') as present_count,
    COUNT(*) FILTER (WHERE status = 'absent') as absent_count,
    COUNT(*) FILTER (WHERE status = 'late') as late_count,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE status = 'present')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
      ELSE 0
    END as attendance_rate
  FROM public.attendance
  WHERE student_id = student_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function للحصول على إحصائيات المادة
CREATE OR REPLACE FUNCTION public.get_course_stats(course_uuid UUID)
RETURNS TABLE (
  total_students BIGINT,
  total_sections BIGINT,
  total_sessions BIGINT,
  average_attendance NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.enrollments WHERE course_id = course_uuid AND status = 'active') as total_students,
    (SELECT COUNT(*) FROM public.sections WHERE course_id = course_uuid) as total_sections,
    (SELECT COUNT(*) FROM public.sessions 
     JOIN public.sections ON sections.id = sessions.section_id 
     WHERE sections.course_id = course_uuid) as total_sessions,
    (SELECT 
      CASE 
        WHEN COUNT(*) > 0 THEN 
          ROUND((COUNT(*) FILTER (WHERE a.status = 'present')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
        ELSE 0
      END
     FROM public.attendance a
     JOIN public.sessions sess ON sess.id = a.session_id
     JOIN public.sections sect ON sect.id = sess.section_id
     WHERE sect.course_id = course_uuid) as average_attendance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 7️⃣ إعدادات Realtime
-- ==========================================

-- تفعيل Realtime على الجداول المهمة
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.enrollments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;

-- ==========================================
-- 8️⃣ تنظيف البيانات القديمة
-- ==========================================

-- حذف الجلسات القديمة جداً (أكثر من 6 أشهر)
-- DELETE FROM public.sessions 
-- WHERE ends_at < NOW() - INTERVAL '6 months';

-- ==========================================
-- ✅ التحقق من النجاح
-- ==========================================

-- عرض جميع الـ policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- عرض جميع الـ indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- عرض جميع الـ views
SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- عرض جميع الـ functions
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  t.typname as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_type t ON p.prorettype = t.oid
WHERE n.nspname = 'public'
AND p.prokind = 'f'
ORDER BY function_name;

-- ==========================================
-- 🎉 انتهى!
-- ==========================================
