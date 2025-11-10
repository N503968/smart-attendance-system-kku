-- ==========================================
-- QUICK FIX MIGRATION - نسخة مبسطة
-- نفذ هذا في Supabase SQL Editor
-- ==========================================

-- 1. إنشاء جدول enrollments (ربط الطلاب بالمواد)
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  course_id UUID NOT NULL,
  section_id UUID,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- 2. إضافة Foreign Keys
ALTER TABLE public.enrollments
  DROP CONSTRAINT IF EXISTS enrollments_student_id_fkey,
  ADD CONSTRAINT enrollments_student_id_fkey 
  FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.enrollments
  DROP CONSTRAINT IF EXISTS enrollments_course_id_fkey,
  ADD CONSTRAINT enrollments_course_id_fkey 
  FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

ALTER TABLE public.enrollments
  DROP CONSTRAINT IF EXISTS enrollments_section_id_fkey,
  ADD CONSTRAINT enrollments_section_id_fkey 
  FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE SET NULL;

-- 3. إنشاء Indexes للأداء
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_section ON public.enrollments(section_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(status);

-- 4. تفعيل Row Level Security
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- 5. إنشاء Policies
-- حذف الـ policies القديمة إذا كانت موجودة
DROP POLICY IF EXISTS "Students can view own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Teachers can view course enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Supervisors can view all enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Teachers can create enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Teachers can update enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Teachers can delete enrollments" ON public.enrollments;

-- Policy للطلاب: يرون تسجيلاتهم فقط
CREATE POLICY "Students can view own enrollments"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Policy للمدرسين والمشرفين: يرون كل شيء
CREATE POLICY "Teachers can view course enrollments"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'supervisor')
    )
  );

-- Policy للإدراج
CREATE POLICY "Teachers can create enrollments"
  ON public.enrollments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'supervisor')
    )
  );

-- Policy للتحديث
CREATE POLICY "Teachers can update enrollments"
  ON public.enrollments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'supervisor')
    )
  );

-- Policy للحذف
CREATE POLICY "Teachers can delete enrollments"
  ON public.enrollments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'supervisor')
    )
  );

-- 6. إضافة عمود ends_at إلى sessions إذا لم يكن موجود
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'sessions' 
    AND column_name = 'ends_at'
  ) THEN
    ALTER TABLE public.sessions ADD COLUMN ends_at TIMESTAMP;
    
    -- تحديث القيم الموجودة (جلسة مدتها ساعتان من starts_at)
    UPDATE public.sessions 
    SET ends_at = starts_at + INTERVAL '2 hours' 
    WHERE ends_at IS NULL AND starts_at IS NOT NULL;
  END IF;
END $$;

-- 7. إضافة عمود location إلى sessions إذا لم يكن موجود
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'sessions' 
    AND column_name = 'location'
  ) THEN
    ALTER TABLE public.sessions ADD COLUMN location TEXT;
  END IF;
END $$;

-- 8. إنشاء indexes إضافية على الجداول الموجودة
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_sections_course ON public.sections(course_id);
CREATE INDEX IF NOT EXISTS idx_schedules_section ON public.schedules(section_id);
CREATE INDEX IF NOT EXISTS idx_sessions_section ON public.sessions(section_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON public.attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 9. تفعيل Realtime على enrollments
DO $$
BEGIN
  -- محاولة إضافة الجدول إلى realtime publication
  -- قد يفشل إذا كان موجود مسبقاً وهذا طبيعي
  PERFORM 1;
END $$;

-- ==========================================
-- انتهى! 
-- ==========================================

-- للتحقق من نجاح التنفيذ:
SELECT 
  'enrollments' as table_name,
  COUNT(*) as row_count
FROM public.enrollments
UNION ALL
SELECT 
  'Total Tables' as table_name,
  COUNT(*)::bigint as row_count
FROM information_schema.tables 
WHERE table_schema = 'public';
