# 🚀 إعداد Supabase - Quick Setup Guide

## ❌ الخطأ الحالي:
```json
{
  "code": "PGRST205",
  "message": "Could not find the table 'public.profiles' in the schema cache"
}
```

**السبب:** جدول `profiles` غير موجود في قاعدة البيانات.

---

## ✅ الحل: تطبيق Schema الكامل

### الطريقة 1️⃣: عبر Supabase Dashboard (موصى به)

#### الخطوات:

1. **افتح Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/bscxhshnubkhngodruuj
   ```

2. **انتقل إلى SQL Editor:**
   - من القائمة الجانبية، اختر **SQL Editor**
   - أو اذهب مباشرة:
     ```
     https://supabase.com/dashboard/project/bscxhshnubkhngodruuj/sql
     ```

3. **افتح ملف Schema:**
   - افتح ملف `/supabase-schema.sql` من المشروع
   - انسخ **كل المحتوى**

4. **الصق وشغّل:**
   - الصق الكود في SQL Editor
   - اضغط **Run** (أو Ctrl+Enter)
   - انتظر حتى ينتهي التنفيذ (قد يستغرق 10-20 ثانية)

5. **تحقق من النجاح:**
   - يجب أن ترى رسالة:
     ```
     ✅ Database schema created successfully!
     ✅ All tables, indexes, and RLS policies are ready.
     ```
   - أو تحقق من قسم **Table Editor** للتأكد من وجود الجداول

---

### الطريقة 2️⃣: عبر Supabase CLI

#### المتطلبات:
```bash
# تثبيت Supabase CLI
npm install -g supabase

# أو باستخدام Homebrew (Mac)
brew install supabase/tap/supabase
```

#### الخطوات:

1. **تسجيل الدخول:**
   ```bash
   supabase login
   ```

2. **ربط المشروع:**
   ```bash
   supabase link --project-ref bscxhshnubkhngodruuj
   ```

3. **تطبيق Schema:**
   ```bash
   supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.bscxhshnubkhngodruuj.supabase.co:5432/postgres"
   ```

---

## 📊 الجداول التي سيتم إنشاؤها:

### 1. **profiles** - ملفات المستخدمين
```sql
- id (UUID) - معرف المستخدم
- full_name (TEXT) - الاسم الكامل
- email (TEXT) - البريد الإلكتروني
- role (TEXT) - الدور (student/instructor/admin)
- student_number (TEXT) - الرقم الجامعي (للطلاب)
- created_at, updated_at
```

### 2. **courses** - المواد الدراسية
```sql
- id (UUID)
- code (TEXT) - كود المادة
- name (TEXT) - اسم المادة
- description (TEXT)
- credits (INTEGER)
```

### 3. **sections** - الأقسام
```sql
- id (UUID)
- course_id (UUID) → courses
- name (TEXT)
- instructor_id (UUID) → profiles
- semester, year
```

### 4. **schedules** - الجداول
```sql
- id (UUID)
- section_id (UUID) → sections
- day_of_week (INTEGER) - 0-6
- start_time, end_time
- location
```

### 5. **sessions** - الجلسات
```sql
- id (UUID)
- section_id (UUID) → sections
- date (DATE)
- code (TEXT) - كود الحضور
- is_active (BOOLEAN)
```

### 6. **attendance** - سجلات الحضور
```sql
- id (UUID)
- session_id (UUID) → sessions
- student_id (UUID) → profiles
- status (TEXT) - present/absent/late/excused
- marked_at
```

### 7. **enrollments** - التسجيل في المواد
```sql
- id (UUID)
- section_id (UUID) → sections
- student_id (UUID) → profiles
- enrolled_at
```

### 8. **webauthn_credentials** - بيانات البصمة
```sql
- id (UUID)
- user_id (UUID) → profiles
- credential_id (TEXT)
- public_key (TEXT)
- counter (BIGINT)
```

---

## 🔐 سياسات الأمان (RLS)

تم تطبيق Row Level Security على جميع الجداول مع سياسات:

### للطلاب:
```
✅ قراءة ملفهم الشخصي
✅ قراءة المواد والجداول
✅ تسجيل حضورهم
✅ قراءة سجلات حضورهم
```

### للمدرسين:
```
✅ إنشاء وإدارة الجلسات
✅ قراءة حضور طلابهم
✅ إدارة موادهم
✅ تعديل سجلات الحضور
```

### للمشرفين:
```
✅ الوصول الكامل لجميع الجداول
✅ إضافة/تعديل/حذف المستخدمين
✅ إدارة المواد والأقسام
✅ عرض جميع التقارير
```

---

## 🧪 اختبار بعد التطبيق

### 1. تحقق من الجداول:

في **Table Editor** يجب أن ترى:
```
✅ profiles
✅ courses
✅ sections
✅ schedules
✅ sessions
✅ attendance
✅ enrollments
✅ webauthn_credentials
```

### 2. جرب التسجيل:

```bash
# شغّل المشروع
npm run dev

# افتح المتصفح
http://localhost:5173

# أنشئ حساب جديد:
الاسم: أحمد محمد
البريد: ahmad@test.com
الدور: طالب
كلمة المرور: 123456
```

**النتيجة المتوقعة:**
```
✅ تسجيل ناجح
✅ لا توجد أخطاء PGRST205
✅ تم إنشاء سجل في جدول profiles
```

### 3. تحقق من البيانات:

في **Table Editor** → **profiles**:
```
يجب أن ترى السجل الجديد:
- id: [uuid]
- full_name: أحمد محمد
- email: ahmad@test.com
- role: student
- student_number: null (اختياري)
```

---

## 🔧 استكشاف الأخطاء

### إذا استمر الخطأ بعد تطبيق Schema:

#### 1. تحديث Schema Cache:
```sql
-- في SQL Editor
NOTIFY pgrst, 'reload schema';
```

#### 2. إعادة تشغيل Supabase:
- اذهب إلى **Project Settings** → **General**
- اضغط **Restart project**
- انتظر دقيقة واحدة

#### 3. تحقق من RLS:
```sql
-- تأكد من تفعيل RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

**يجب أن يكون:**
```
rowsecurity = true لجميع الجداول
```

#### 4. تحقق من Policies:
```sql
-- عرض السياسات
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

**يجب أن ترى عدة سياسات لكل جدول**

---

## 📝 بيانات تجريبية (اختياري)

إذا أردت إضافة بيانات تجريبية:

### 1. إنشاء مستخدم admin يدوياً:

```sql
-- بعد التسجيل عبر الواجهة، قم بتحديث الدور:
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-email@test.com';
```

### 2. إضافة مواد دراسية:

```sql
INSERT INTO public.courses (code, name, description, credits) VALUES
  ('CS101', 'مقدمة في علوم الحاسب', 'أساسيات البرمجة', 3),
  ('MATH201', 'حساب التفاضل والتكامل', 'الرياضيات المتقدمة', 4);
```

### 3. إنشاء قسم:

```sql
-- احصل على course_id و instructor_id من الجداول أولاً
INSERT INTO public.sections (course_id, name, instructor_id, semester, year)
VALUES 
  ('course-uuid-here', 'Section A', 'instructor-uuid-here', 'Fall', 2025);
```

---

## ✅ قائمة التحقق النهائية

بعد تطبيق Schema، تأكد من:

- [x] جدول `profiles` موجود
- [x] جدول `courses` موجود
- [x] جدول `sessions` موجود
- [x] جدول `attendance` موجود
- [x] RLS مفعل على جميع الجداول
- [x] Policies موجودة وصحيحة
- [x] التسجيل يعمل بدون أخطاء
- [x] تسجيل الدخول يعمل
- [x] Realtime subscriptions تعمل

---

## 🎯 الخطوات التالية

بعد تطبيق Schema بنجاح:

### 1. اختبر التسجيل:
```
✅ أنشئ حساب طالب
✅ أنشئ حساب مدرس
✅ أنشئ حساب مشرف
```

### 2. اختبر لوحات التحكم:
```
✅ سجل دخول كطالب
✅ سجل دخول كمدرس
✅ سجل دخول كمشرف
```

### 3. اختبر الميزات:
```
✅ إنشاء جلسة (مدرس)
✅ تسجيل حضور (طالب)
✅ عرض التقارير (الجميع)
```

---

## 📞 الدعم

إذا واجهت مشاكل:

### تحقق من:
```
1. ✅ Project ID صحيح: bscxhshnubkhngodruuj
2. ✅ ANON_KEY صحيح في .env
3. ✅ Schema تم تطبيقه بالكامل
4. ✅ لا توجد أخطاء في Console
```

### لوجات مفيدة:
```javascript
// في المتصفح Console (F12)
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('User:', await supabase.auth.getUser());
```

---

## 🎉 النتيجة المتوقعة

بعد تطبيق Schema:

```
╔════════════════════════════════════════╗
║  ✅ DATABASE READY                     ║
║  ──────────────────────────────        ║
║                                        ║
║  📊 8 Tables Created                   ║
║  🔐 RLS Enabled                        ║
║  🛡️ Policies Applied                   ║
║  🔄 Triggers Active                    ║
║  📝 Indexes Created                    ║
║                                        ║
║  ✅ Registration: WORKING              ║
║  ✅ Login: WORKING                     ║
║  ✅ No Errors: PGRST205 FIXED          ║
║                                        ║
║  🚀 READY TO USE!                      ║
║                                        ║
╚════════════════════════════════════════╝
```

---

<div align="center">

**🎓 Smart Attendance System - King Khalid University**  
**© 2025 - Database Setup Complete** ✅

**قاعدة البيانات جاهزة للاستخدام!** 🚀

</div>
