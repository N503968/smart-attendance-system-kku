# ⚡ أوامر سريعة | Quick Commands

> للنسخ واللصق المباشر - For Direct Copy & Paste

---

## 📋 بيانات المستخدمين التجريبيين | Test User Credentials

### المشرف | Supervisor
```
البريد / Email: admin@kku.edu.sa
الدور / Role: Supervisor (مشرف)
كلمة المرور / Password: 123456
```

### المعلم | Teacher
```
البريد / Email: teacher@kku.edu.sa
الدور / Role: Teacher (مدرس)
كلمة المرور / Password: 123456
```

### الطالب | Student
```
البريد / Email: student@kku.edu.sa
الدور / Role: Student (طالب)
الرقم الجامعي / Student Number: 442100001
كلمة المرور / Password: 123456
```

---

## 🔗 روابط Supabase | Supabase Links

### Dashboard
```
https://supabase.com/dashboard/project/bscxhshnubkhngodruuj
```

### SQL Editor
```
https://supabase.com/dashboard/project/bscxhshnubkhngodruuj/sql
```

### Auth Settings
```
https://supabase.com/dashboard/project/bscxhshnubkhngodruuj/settings/auth
```

### Database (Tables)
```
https://supabase.com/dashboard/project/bscxhshnubkhngodruuj/editor
```

### Logs
```
https://supabase.com/dashboard/project/bscxhshnubkhngodruuj/logs/edge-logs
```

---

## 🗃️ استعلامات SQL سريعة | Quick SQL Queries

### عرض جميع المستخدمين
```sql
SELECT id, full_name, email, role, student_number 
FROM public.profiles 
ORDER BY role, full_name;
```

### عرض جميع المواد
```sql
SELECT 
  c.code, 
  c.name, 
  p.full_name as instructor_name
FROM public.courses c
LEFT JOIN public.profiles p ON c.instructor_id = p.id
ORDER BY c.code;
```

### عرض الجداول الدراسية
```sql
SELECT 
  c.code,
  c.name as course_name,
  s.name as section_name,
  sch.day_of_week,
  sch.start_time,
  sch.end_time,
  sch.location
FROM public.schedules sch
JOIN public.sections s ON sch.section_id = s.id
JOIN public.courses c ON s.course_id = c.id
ORDER BY c.code, sch.day_of_week, sch.start_time;
```

### عرض الجلسات النشطة
```sql
SELECT 
  ses.code,
  ses.starts_at,
  ses.ends_at,
  c.code as course_code,
  c.name as course_name,
  sec.name as section_name
FROM public.sessions ses
JOIN public.sections sec ON ses.section_id = sec.id
JOIN public.courses c ON sec.course_id = c.id
WHERE ses.ends_at > NOW()
ORDER BY ses.starts_at;
```

### عرض سجلات الحضور
```sql
SELECT 
  p.full_name as student_name,
  c.code as course_code,
  c.name as course_name,
  a.status,
  a.method,
  a.marked_at
FROM public.attendance a
JOIN public.profiles p ON a.student_id = p.id
JOIN public.sessions ses ON a.session_id = ses.id
JOIN public.sections sec ON ses.section_id = sec.id
JOIN public.courses c ON sec.course_id = c.id
ORDER BY a.marked_at DESC;
```

### حذف كل البيانات (⚠️ خطير!)
```sql
-- ⚠️ استخدم بحذر! هذا سيحذف كل البيانات
TRUNCATE TABLE public.attendance CASCADE;
TRUNCATE TABLE public.sessions CASCADE;
TRUNCATE TABLE public.schedules CASCADE;
TRUNCATE TABLE public.sections CASCADE;
TRUNCATE TABLE public.courses CASCADE;
TRUNCATE TABLE public.webauthn_credentials CASCADE;
-- لا تحذف profiles لأنها مرتبطة بـ auth.users
```

---

## 🔧 أوامر تحديث الأدوار | Role Update Commands

### تحديث دور مستخدم إلى مشرف
```sql
UPDATE public.profiles 
SET role = 'supervisor' 
WHERE email = 'admin@kku.edu.sa';
```

### تحديث دور مستخدم إلى معلم
```sql
UPDATE public.profiles 
SET role = 'teacher' 
WHERE email = 'teacher@kku.edu.sa';
```

### تحديث دور مستخدم إلى طالب
```sql
UPDATE public.profiles 
SET role = 'student', 
    student_number = '442100001'
WHERE email = 'student@kku.edu.sa';
```

### تحديث كل الأدوار القديمة (admin → supervisor, instructor → teacher)
```sql
UPDATE public.profiles SET role = 'supervisor' WHERE role = 'admin';
UPDATE public.profiles SET role = 'teacher' WHERE role = 'instructor';
```

---

## 📊 إحصائيات سريعة | Quick Statistics

### عدد المستخدمين لكل دور
```sql
SELECT 
  role,
  COUNT(*) as count
FROM public.profiles
GROUP BY role
ORDER BY role;
```

### عدد المواد لكل معلم
```sql
SELECT 
  p.full_name as instructor,
  COUNT(c.id) as courses_count
FROM public.profiles p
LEFT JOIN public.courses c ON p.id = c.instructor_id
WHERE p.role = 'teacher'
GROUP BY p.full_name
ORDER BY courses_count DESC;
```

### نسبة الحضور لكل طالب
```sql
SELECT 
  p.full_name as student_name,
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE a.status = 'present') as present_count,
  ROUND(
    (COUNT(*) FILTER (WHERE a.status = 'present')::NUMERIC / COUNT(*) * 100), 
    2
  ) as attendance_percentage
FROM public.profiles p
JOIN public.attendance a ON p.id = a.student_id
WHERE p.role = 'student'
GROUP BY p.full_name
ORDER BY attendance_percentage DESC;
```

### عدد الجلسات لكل مادة
```sql
SELECT 
  c.code,
  c.name,
  COUNT(ses.id) as sessions_count
FROM public.courses c
LEFT JOIN public.sections sec ON c.id = sec.course_id
LEFT JOIN public.sessions ses ON sec.id = ses.section_id
GROUP BY c.code, c.name
ORDER BY sessions_count DESC;
```

---

## 🔐 فحص RLS | Check RLS

### فحص حالة RLS على كل الجداول
```sql
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'courses', 'sections', 'schedules', 
    'sessions', 'attendance', 'webauthn_credentials', 
    'allowed_students'
  )
ORDER BY tablename;
```

### عرض كل سياسات RLS
```sql
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
```

---

## 🧪 بيانات تجريبية إضافية | Additional Test Data

### إضافة مادة جديدة
```sql
INSERT INTO public.courses (code, name, instructor_id)
VALUES (
  'CIS999',
  'مادة تجريبية',
  (SELECT id FROM public.profiles WHERE email = 'teacher@kku.edu.sa')
);
```

### إضافة شعبة جديدة
```sql
INSERT INTO public.sections (course_id, name)
VALUES (
  (SELECT id FROM public.courses WHERE code = 'CIS999'),
  'الشعبة 1'
);
```

### إضافة جدول دراسي
```sql
INSERT INTO public.schedules (section_id, day_of_week, start_time, end_time, location)
VALUES (
  (SELECT s.id FROM public.sections s 
   JOIN public.courses c ON s.course_id = c.id 
   WHERE c.code = 'CIS999' AND s.name = 'الشعبة 1'),
  0, -- الأحد
  '10:00',
  '11:30',
  'قاعة 101'
);
```

### إضافة جلسة حضور
```sql
INSERT INTO public.sessions (section_id, starts_at, ends_at, code, require_webauthn)
VALUES (
  (SELECT s.id FROM public.sections s 
   JOIN public.courses c ON s.course_id = c.id 
   WHERE c.code = 'CIS999' AND s.name = 'الشعبة 1'),
  NOW(),
  NOW() + INTERVAL '2 hours',
  'TEST-' || to_char(NOW(), 'YYYYMMDD-HH24MISS'),
  false
);
```

---

## 🗑️ حذف بيانات محددة | Delete Specific Data

### حذف جلسة معينة
```sql
DELETE FROM public.sessions 
WHERE code = 'كود_الجلسة';
```

### حذف مادة معينة (سيحذف كل ما يتعلق بها)
```sql
DELETE FROM public.courses 
WHERE code = 'CIS999';
```

### حذف سجلات حضور لطالب معين
```sql
DELETE FROM public.attendance 
WHERE student_id = (SELECT id FROM public.profiles WHERE email = 'student@kku.edu.sa');
```

---

## 🔍 فحص المشاكل | Troubleshooting Queries

### البحث عن جداول فارغة
```sql
SELECT 
  'profiles' as table_name, 
  COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 'courses', COUNT(*) FROM public.courses
UNION ALL
SELECT 'sections', COUNT(*) FROM public.sections
UNION ALL
SELECT 'schedules', COUNT(*) FROM public.schedules
UNION ALL
SELECT 'sessions', COUNT(*) FROM public.sessions
UNION ALL
SELECT 'attendance', COUNT(*) FROM public.attendance;
```

### البحث عن علاقات مكسورة
```sql
-- شعب بدون مادة
SELECT * FROM public.sections s
WHERE NOT EXISTS (SELECT 1 FROM public.courses c WHERE c.id = s.course_id);

-- جلسات بدون شعبة
SELECT * FROM public.sessions ses
WHERE NOT EXISTS (SELECT 1 FROM public.sections s WHERE s.id = ses.section_id);

-- حضور بدون طالب
SELECT * FROM public.attendance a
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = a.student_id);
```

### فحص الـ Triggers
```sql
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

---

## 💾 Backup سريع | Quick Backup

### نسخ بيانات الجداول
```sql
-- نسخ المواد
CREATE TABLE courses_backup AS SELECT * FROM public.courses;

-- نسخ المستخدمين
CREATE TABLE profiles_backup AS SELECT * FROM public.profiles;

-- نسخ الحضور
CREATE TABLE attendance_backup AS SELECT * FROM public.attendance;
```

### استرجاع من النسخة الاحتياطية
```sql
-- حذف الجدول الحالي
TRUNCATE TABLE public.courses CASCADE;

-- استرجاع من النسخة
INSERT INTO public.courses 
SELECT * FROM courses_backup;
```

---

## 🎯 اختصارات CLI | CLI Shortcuts

### تشغيل المشروع
```bash
npm run dev
# أو
bun dev
```

### تثبيت الحزم
```bash
npm install
# أو
bun install
```

### بناء المشروع
```bash
npm run build
# أو
bun build
```

---

## 📱 أوامر Git | Git Commands

### حفظ التغييرات
```bash
git add .
git commit -m "إصلاح قاعدة البيانات وربطها مع Supabase"
git push
```

### إنشاء فرع جديد
```bash
git checkout -b database-setup
git add .
git commit -m "إضافة سكربتات SQL والأدلة"
git push -u origin database-setup
```

---

**🚀 نصيحة:** احفظ هذا الملف في المفضلة للوصول السريع للأوامر!

**💡 تذكير:** كل الأوامر آمنة للاستخدام ما عدا أوامر الحذف المميزة بـ ⚠️

---

**صُنع بـ ❤️ لجامعة الملك خالد**
