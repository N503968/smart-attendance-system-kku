# 📚 دليل الإعداد الشامل - Complete Setup Guide

<div dir="rtl" align="center">

# 🎓 نظام الحضور الذكي - جامعة الملك خالد

## دليل الإعداد الكامل والتطبيق

![Version](https://img.shields.io/badge/Version-2.0-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge)
![Database](https://img.shields.io/badge/Database-Supabase-green?style=for-the-badge)

</div>

---

## 📑 جدول المحتويات

1. [المتطلبات الأساسية](#-المتطلبات-الأساسية)
2. [إعداد قاعدة البيانات](#-إعداد-قاعدة-البيانات-supabase)
3. [تطبيق الـ Migrations](#-تطبيق-الـ-migrations)
4. [إعدادات البيئة](#-إعدادات-البيئة-environment-variables)
5. [تشغيل النظام محلياً](#-تشغيل-النظام-محلياً)
6. [الرفع على Vercel](#-الرفع-على-vercel)
7. [إضافة بيانات تجريبية](#-إضافة-بيانات-تجريبية)
8. [اختبار النظام](#-اختبار-النظام)
9. [حل المشاكل الشائعة](#-حل-المشاكل-الشائعة)

---

## 🔧 المتطلبات الأساسية

### البرمجيات المطلوبة:
```bash
✅ Node.js v18 أو أحدث
✅ npm أو yarn أو pnpm
✅ Git
✅ حساب Supabase (مجاني)
✅ حساب Vercel (مجاني - اختياري)
```

### التحقق من الإصدارات:
```bash
node --version    # يجب أن يكون >= 18.0.0
npm --version     # يجب أن يكون >= 9.0.0
```

---

## 🗄️ إعداد قاعدة البيانات (Supabase)

### الخطوة 1: إنشاء مشروع Supabase

1. **افتح** [https://supabase.com](https://supabase.com)
2. **سجّل الدخول** أو أنشئ حساب جديد
3. **اضغط** على "New Project"
4. **أدخل المعلومات**:
   ```
   Project Name: KKU Attendance System
   Database Password: [كلمة مرور قوية - احفظها!]
   Region: Singapore (الأقرب للسعودية)
   ```
5. **انتظر** حتى يتم إنشاء المشروع (2-3 دقائق)

### الخطوة 2: احصل على معلومات الاتصال

بعد إنشاء المشروع:

1. **اذهب إلى**: Settings → API
2. **انسخ**:
   ```
   Project URL: https://[YOUR-PROJECT-ID].supabase.co
   anon public key: eyJhbGc...
   ```

**ملاحظة مهمة**: احفظ هذه المعلومات في مكان آمن!

---

## 📝 تطبيق الـ Migrations

### الطريقة 1: من خلال Supabase Dashboard (موصى بها)

1. **افتح** Supabase Dashboard
2. **اذهب إلى**: SQL Editor
3. **افتح الملف**: `/supabase-migrations.sql` من المشروع
4. **انسخ** محتوى الملف بالكامل
5. **الصق** في SQL Editor
6. **اضغط** على "Run" أو اضغط `Ctrl/Cmd + Enter`

**يجب أن ترى**:
```
✅ Success. No rows returned
```

### التحقق من نجاح التطبيق:

```sql
-- قم بتشغيل هذا الاستعلام للتحقق
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

**يجب أن ترى الجداول التالية**:
```
✅ profiles
✅ courses
✅ sections
✅ schedules
✅ sessions
✅ attendance
✅ enrollments (جديد!)
✅ webauthn_credentials
✅ allowed_students
```

### الطريقة 2: باستخدام Supabase CLI (متقدم)

```bash
# تثبيت Supabase CLI
npm install -g supabase

# تسجيل الدخول
supabase login

# ربط المشروع
supabase link --project-ref [YOUR-PROJECT-ID]

# تطبيق migrations
supabase db push
```

---

## 🌐 إعدادات البيئة (Environment Variables)

### محلياً (Local Development):

أنشئ ملف `.env.local` في جذر المشروع:

```bash
# .env.local
VITE_SUPABASE_URL=https://bscxhshnubkhngodruuj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzY3hoc2hudWJraG5nb2RydXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MDgzODUsImV4cCI6MjA3ODI4NDM4NX0._cszwMx3Yty-pl0Ip6IKlSctk7HxBJ4pN6ehLpkAEqY
```

**ملاحظة**: استبدل بمعلومات مشروعك إذا كنت تستخدم مشروع Supabase مختلف.

### في Vercel:

1. **افتح** مشروعك في Vercel Dashboard
2. **اذهب إلى**: Settings → Environment Variables
3. **أضف** المتغيرات:
   ```
   Key: VITE_SUPABASE_URL
   Value: https://bscxhshnubkhngodruuj.supabase.co
   
   Key: VITE_SUPABASE_ANON_KEY
   Value: eyJhbGc...
   ```
4. **احفظ** التغييرات
5. **أعد** نشر التطبيق

---

## 💻 تشغيل النظام محلياً

### 1. تثبيت الحزم:

```bash
# استخدم أحد الأوامر التالية:
npm install
# أو
yarn install
# أو
pnpm install
```

### 2. تشغيل خادم التطوير:

```bash
npm run dev
# أو
yarn dev
# أو
pnpm dev
```

**يجب أن ترى**:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### 3. افتح المتصفح:

```
http://localhost:5173
```

---

## 🚀 الرفع على Vercel

### الطريقة 1: من خلال GitHub (موصى بها)

#### أ. رفع الكود على GitHub:

```bash
# إن��اء مستودع جديد
git init
git add .
git commit -m "Initial commit - KKU Attendance System"

# ربط مع GitHub
git remote add origin https://github.com/[YOUR-USERNAME]/kku-attendance.git
git push -u origin main
```

#### ب. نشر على Vercel:

1. **افتح** [https://vercel.com](https://vercel.com)
2. **اضغط** على "New Project"
3. **استورد** المستودع من GitHub
4. **أضف** Environment Variables:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
5. **اضغط** على "Deploy"

### الطريقة 2: باستخدام Vercel CLI

```bash
# تثبيت Vercel CLI
npm install -g vercel

# تسجيل الدخول
vercel login

# نشر التطبيق
vercel

# للإنتاج
vercel --prod
```

### Build Settings في Vercel:

```
Framework Preset: Vite
Build Command: vite build
Output Directory: dist
Install Command: npm install
```

---

## 🧪 إضافة بيانات تجريبية

### 1. إنشاء مستخدمين تجريبيين:

افتح Supabase SQL Editor وقم بتشغيل:

```sql
-- إضافة مشرف (Supervisor)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
  (uuid_generate_v4(), 'admin@kku.edu.sa', crypt('Admin@123', gen_salt('bf')), NOW(), NOW(), NOW());

-- إضافة Profile للمشرف
INSERT INTO profiles (id, full_name, email, role)
SELECT id, 'مدير النظام', 'admin@kku.edu.sa', 'supervisor'
FROM auth.users WHERE email = 'admin@kku.edu.sa';

-- إضافة مدرس (Teacher)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
  (uuid_generate_v4(), 'teacher@kku.edu.sa', crypt('Teacher@123', gen_salt('bf')), NOW(), NOW(), NOW());

INSERT INTO profiles (id, full_name, email, role)
SELECT id, 'د. محمد أحمد', 'teacher@kku.edu.sa', 'teacher'
FROM auth.users WHERE email = 'teacher@kku.edu.sa';

-- إضافة طالب (Student)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
  (uuid_generate_v4(), 'student@kku.edu.sa', crypt('Student@123', gen_salt('bf')), NOW(), NOW(), NOW());

INSERT INTO profiles (id, full_name, email, role, student_number)
SELECT id, 'أحمد علي', 'student@kku.edu.sa', 'student', '441234567'
FROM auth.users WHERE email = 'student@kku.edu.sa';
```

### 2. إنشاء مادة دراسية:

```sql
-- إنشاء مادة
INSERT INTO courses (id, code, name, instructor_id)
SELECT 
  uuid_generate_v4(),
  'CIS342',
  'نظم قواعد البيانات',
  id
FROM profiles WHERE email = 'teacher@kku.edu.sa';

-- إنشاء شعبة
INSERT INTO sections (id, course_id, name)
SELECT 
  uuid_generate_v4(),
  id,
  'الشعبة 1'
FROM courses WHERE code = 'CIS342';
```

### 3. تسجيل طالب في مادة:

```sql
-- تسجيل الطالب في المادة
INSERT INTO enrollments (student_id, course_id, section_id, status)
SELECT 
  (SELECT id FROM profiles WHERE email = 'student@kku.edu.sa'),
  c.id,
  s.id,
  'active'
FROM courses c
JOIN sections s ON s.course_id = c.id
WHERE c.code = 'CIS342';
```

### 4. إنشاء جدول دراسي:

```sql
-- إضافة جدول (الأحد 10:00 صباحاً)
INSERT INTO schedules (section_id, day_of_week, start_time, end_time, location)
SELECT 
  id,
  0,  -- الأحد
  '10:00',
  '11:50',
  'قاعة A-101'
FROM sections WHERE name = 'الشعبة 1';
```

---

## ✅ اختبار النظام

### 1. اختبار تسجيل الدخول:

| الدور | البريد الإلكتروني | كلمة المرور |
|------|-------------------|-------------|
| مشرف | admin@kku.edu.sa | Admin@123 |
| مدرس | teacher@kku.edu.sa | Teacher@123 |
| طالب | student@kku.edu.sa | Student@123 |

### 2. اختبار لوحة الطالب:

1. ✅ سجل دخول كطالب
2. ✅ تحقق من ظهور المواد المسجلة
3. ✅ تحقق من إحصائيات الحضور
4. ✅ جرب "الجلسات النشطة"

### 3. اختبار لوحة المدرس:

1. ✅ سجل دخول كمدرس
2. ✅ ت��قق من ظهور المواد
3. ✅ جرب "إضافة مادة جديدة"
4. ✅ جرب "إنشاء جلسة حضور"

### 4. اختبار لوحة المشرف:

1. ✅ سجل دخول كمشرف
2. ✅ تحقق من الإحصائيات العامة
3. ✅ تحقق من قائمة المستخدمين
4. ✅ تحقق من قائمة المواد

---

## 🔧 حل المشاكل الشائعة

### مشكلة: "فشل في تحميل البيانات"

**السبب**: لم يتم تطبيق migrations أو لا توجد بيانات

**الحل**:
```sql
-- 1. تحقق من وجود الجداول
SELECT * FROM information_schema.tables WHERE table_schema = 'public';

-- 2. تحقق من وجود بيانات
SELECT * FROM enrollments;

-- 3. إذا كانت فارغة، أضف بيانات تجريبية (انظر الخطوة 7)
```

### مشكلة: "لا توجد مواد مسجلة" للطالب

**السبب**: الطالب غير مسجل في أي مادة

**الحل**:
```sql
-- تسجيل الطالب في مادة
INSERT INTO enrollments (student_id, course_id, section_id, status)
SELECT 
  '[STUDENT_ID]',
  '[COURSE_ID]',
  '[SECTION_ID]',
  'active';
```

### مشكلة: "لا توجد مواد" للمدرس

**السبب**: لم يتم إنشاء مواد للمدرس

**الحل**:
1. سجل دخول كمدرس
2. اضغ�� "إضافة مادة جديدة"
3. أدخل اسم المادة ورمزها
4. اضغط "إنشاء المادة"

### مشكلة: بطء التحميل

**الحل**:
```bash
# 1. تأكد من تفعيل Production build
npm run build
npm run preview

# 2. تحقق من أداء Supabase
# في Dashboard: Performance → Query Performance

# 3. تأكد من وجود indexes
-- في SQL Editor:
SELECT * FROM pg_indexes WHERE schemaname = 'public';
```

### مشكلة: أخطاء CORS

**الحل**:
1. **في Supabase Dashboard**:
   - Settings → API → CORS
   - أضف: `https://your-domain.vercel.app`

### مشكلة: Environment Variables لا تعمل

**الحل في Vercel**:
1. Settings → Environment Variables
2. تأكد من البادئة: `VITE_` للمتغيرات
3. أعد نشر التطبيق بعد التغيير

---

## 📊 مراقبة الأداء

### Supabase Performance:

1. **افتح** Supabase Dashboard
2. **اذهب إلى**: Performance
3. **تحقق من**:
   - Query Performance
   - Database Health
   - API Response Times

### Vercel Analytics (اختياري):

```bash
# تفعيل Analytics
npm install @vercel/analytics

# في App.tsx أضف:
import { Analytics } from '@vercel/analytics/react';

// في return:
<>
  <YourApp />
  <Analytics />
</>
```

---

## 🔐 نصائح الأمان

### 1. كلمات المرور:
```
✅ استخدم كلمات مرور قوية (12+ حرف)
✅ استخدم أحرف كبيرة وصغيرة وأرقام ورموز
✅ لا تشارك كلمات المرور
```

### 2. API Keys:
```
✅ لا تشارك anon public key في مستودعات عامة
✅ استخدم Environment Variables
✅ غيّر المفاتيح دورياً
```

### 3. RLS Policies:
```sql
-- تحقق من تفعيل RLS على جميع الجداول
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- يجب أن تكون rowsecurity = true
```

---

## 📈 خطوات ما بعد الإعداد

### 1. إضافة بيانات حقيقية:
```
□ استورد قائمة الطلاب
□ أضف المدرسين
□ أنشئ المواد الدراسية
□ حدد الجداول الدراسية
```

### 2. تدريب المستخدمين:
```
□ إعداد دليل مستخدم مبسط
□ تدريب المدرسين
□ تدريب الطلاب
□ تدريب الإداريين
```

### 3. المراقبة والصيانة:
```
□ مراقبة الأداء يومياً
□ أخذ نسخ احتياطية أسبوعياً
□ تحديث النظام شهرياً
□ مراجعة الأمان ربع سنوياً
```

---

## 📞 الدعم والمساعدة

### الموارد المفيدة:

- **Supabase Docs**: [https://supabase.com/docs](https://supabase.com/docs)
- **Vite Docs**: [https://vitejs.dev](https://vitejs.dev)
- **React Docs**: [https://react.dev](https://react.dev)
- **Vercel Docs**: [https://vercel.com/docs](https://vercel.com/docs)

### أسئلة شائعة:

**س: هل يمكن تغيير قاعدة البيانات من Supabase إلى غيرها؟**  
ج: نعم، لكن سيتطلب ذلك تعديلات كبيرة في الكود. Supabase توفر Authentication و Realtime مدمجة.

**س: هل النظام يدعم آلاف المستخدمين؟**  
ج: نعم، Supabase مبني على PostgreSQL ويدعم ملايين الصفوف مع indexes صحيحة.

**س: كيف أضيف ميزات إضافية؟**  
ج: الكود modular وسهل التوسع. راجع ملفات المكونات في `/components/`.

---

<div align="center" dir="rtl">

## 🎉 تهانينا!

### نظام الحضور الذكي جاهز الآن للاستخدام! 🚀

**جميع الميزات تعمل بكفاءة:**
- ✅ تسجيل الدخول والخروج
- ✅ لوحات تحكم لجميع الأدوار
- ✅ إنشاء المواد والجلسات
- ✅ تسجيل الحضور
- ✅ التقارير والإحصائيات
- ✅ Realtime updates
- ✅ دعم العربية/الإنجليزية
- ✅ وضع ليلي/نهاري

---

![Success](https://img.shields.io/badge/✅-Setup%20Complete-success?style=for-the-badge)
![Ready](https://img.shields.io/badge/🚀-Production%20Ready-blue?style=for-the-badge)

---

**شكراً لاستخدامكم النظام! 💚**  
**© 2025 جامعة الملك خالد**

</div>
