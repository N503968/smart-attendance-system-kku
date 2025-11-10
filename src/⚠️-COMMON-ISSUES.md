# ⚠️ المشاكل الشائعة وحلولها - Common Issues

<div align="center" dir="rtl">

# دليل حل المشاكل السريع

</div>

---

## 🔥 المشاكل الأكثر شيوعاً

### 1️⃣ "جاري التحميل..." اللانهائي

<div dir="rtl">

**الأعراض:**
- الموقع يعرض "جاري التحميل..." ولا يتوقف
- بعد F5 نفس المشكلة
- Console لا يعرض أخطاء

**الحل السريع:**

</div>

```bash
# 1. افتح Console (F12)
# 2. اكتب:
localStorage.clear()
sessionStorage.clear()

# 3. F5 (Refresh)
```

<div dir="rtl">

**الحل الكامل:**

1. تحقق من Vercel Environment Variables
2. تأكد من وجود:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Redeploy من Vercel
4. انتظر 2-3 دقائق

**راجع:** [`🔧-VERCEL-DEPLOYMENT-FIX.md`](🔧-VERCEL-DEPLOYMENT-FIX.md)

</div>

---

### 2️⃣ "فشل في تحميل البيانات"

<div dir="rtl">

**الأعراض:**
- Dashboard فارغ
- رسالة "فشل في تحميل البيانات"
- أو "Failed to load data"

**الحل:**

</div>

```sql
-- 1. افتح Supabase SQL Editor
-- 2. نفّذ:
SELECT * FROM profiles WHERE id = auth.uid();

-- إذا رجع خطأ ← RLS غير مفعّل
-- نفّذ:
```

```bash
# في Terminal المحلي:
# افتح ملف: 🔧-PERMISSIONS-FIX.sql
# انسخ المحتوى كاملاً
# الصق في Supabase SQL Editor
# اضغط Run
```

<div dir="rtl">

**راجع:** [`🚀-START-HERE.md`](🚀-START-HERE.md) → قسم "Migration"

</div>

---

### 3️⃣ بعد Refresh يسجل خروج

<div dir="rtl">

**الأعراض:**
- تسجيل دخول ناجح
- بعد F5 يرجع لصفحة Login

**الحل:**

</div>

```javascript
// 1. افتح Console (F12)
// 2. تحقق من:
localStorage.getItem('kku-attendance-auth-token')

// إذا null:
// المشكلة في persistSession

// الحل:
```

```typescript
// تأكد من /lib/supabase.ts:
export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,  // ✅ يجب أن يكون true
  }
});
```

<div dir="rtl">

**إذا لم يعمل:**
- احذف localStorage: `localStorage.clear()`
- سجل دخول مرة أخرى
- تحقق من Cookies (F12 → Application → Cookies)

</div>

---

### 4️⃣ "Access Denied" للمشرف

<div dir="rtl">

**الأعراض:**
- المشرف لا يستطيع إضافة مستخدمين
- رسالة "غير مصرح لك"

**الحل:**

</div>

```sql
-- 1. تحقق من دور المستخدم:
SELECT id, email, role FROM profiles 
WHERE email = 'your-email@kku.edu.sa';

-- 2. إذا الدور ليس 'supervisor':
UPDATE profiles 
SET role = 'supervisor' 
WHERE email = 'your-email@kku.edu.sa';

-- 3. تحقق من RLS Policies:
SELECT * FROM pg_policies 
WHERE tablename = 'profiles' 
AND policyname LIKE '%supervisor%';

-- إذا لا توجد policies:
-- نفّذ: 🔧-PERMISSIONS-FIX.sql
```

---

### 5️⃣ المدرس لا يرى زر "إضافة مادة"

<div dir="rtl">

**الأعراض:**
- المدرس في Dashboard
- لا يوجد زر "إضافة مادة جديدة"

**الحل:**

1. **تحقق من الملفات:**
   ```
   ✅ /components/CreateCoursePage.tsx موجود؟
   ✅ /App.tsx محدّث؟
   ✅ /components/InstructorDashboard.tsx محدّث؟
   ```

2. **تحقق من الكود:**
   ```typescript
   // في InstructorDashboard.tsx:
   // يجب أن يكون هناك:
   <Button onClick={() => onNavigate('create-course')}>
     {language === 'ar' ? 'إضافة مادة جديدة' : 'Add New Course'}
   </Button>
   ```

3. **Refresh مع Clear Cache:**
   ```
   Ctrl + Shift + R (Windows)
   Cmd + Shift + R (Mac)
   ```

</div>

---

### 6️⃣ الطالب: "لا توجد مواد مسجلة"

<div dir="rtl">

**الأعراض:**
- الطالب سجل دخول
- رسالة "لا توجد مواد مسجلة"
- لكن يجب أن يكون مسجلاً في مواد

**الحل:**

</div>

```sql
-- 1. تحقق من التسجيلات:
SELECT * FROM enrollments 
WHERE student_id = 'USER_ID_HERE';

-- إذا فارغ ← الطالب غير مسجل فعلاً

-- 2. أضف تسجيل:
INSERT INTO enrollments (student_id, course_id, section_id, status)
VALUES (
  'STUDENT_UUID',
  'COURSE_UUID',
  'SECTION_UUID',
  'active'
);

-- 3. أو استخدم واجهة المشرف لإضافة التسجيلات
```

<div dir="rtl">

**ملاحظة:** هذا طبيعي إذا كان الطالب جديد ولم يُسجّل في مواد بعد.

</div>

---

### 7️⃣ البطء الشديد

<div dir="rtl">

**الأعراض:**
- الموقع يستغرق > 5 ثوانٍ للتحميل
- البيانات تظهر ببطء

**الحل:**

</div>

```sql
-- 1. تحقق من Indexes:
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename;

-- يجب أن ترى 20+ indexes

-- إذا أقل:
-- نفّذ: 🔧-PERMISSIONS-FIX.sql
```

```bash
# 2. تحقق من Build في Vercel:
# Settings → General → Build & Development Settings
# Build Command: vite build --minify
# Output Directory: dist
```

<div dir="rtl">

**راجع:** [`✅-SUMMARY.md`](✅-SUMMARY.md) → قسم "الأداء"

</div>

---

### 8️⃣ "Invalid API Key"

<div dir="rtl">

**الأعراض:**
- Console: "Invalid API Key"
- أو "401 Unauthorized"

**الحل:**

</div>

```typescript
// 1. تحقق من /lib/supabase.ts:
const supabaseUrl = 'https://bscxhshnubkhngodruuj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// 2. تأكد من عدم وجود مسافات أو أحرف زائدة

// 3. في Vercel Environment Variables:
// تأكد من نسخ القيمة كاملة بدون spaces
```

---

### 9️⃣ CORS Error

<div dir="rtl">

**الأعراض:**
- Console: "CORS policy blocked"
- أو "Cross-Origin Request Blocked"

**الحل:**

</div>

```bash
# 1. في Supabase Dashboard:
# Authentication → URL Configuration

# 2. أضف:
https://t-attendance-system-kku.vercel.app
https://*.vercel.app

# 3. Site URL:
https://t-attendance-system-kku.vercel.app

# 4. Redirect URLs:
https://t-attendance-system-kku.vercel.app/**
https://*.vercel.app/**

# 5. احفظ
```

---

### 🔟 TypeScript Errors في Build

<div dir="rtl">

**الأعراض:**
- Vercel Build يفشل
- أخطاء TypeScript

**الحل:**

</div>

```typescript
// 1. في tsconfig.json:
{
  "compilerOptions": {
    "skipLibCheck": true,  // أضف هذا
    "strict": false        // مؤقتاً
  }
}

// 2. أو أصلح الأخطاء واحداً تلو الآخر
```

```bash
# 3. تحقق محلياً:
npm run build

# إذا عمل محلياً، المشكلة في Vercel cache
# الحل:
# Vercel Dashboard → Deployments → Redeploy (بدون cache)
```

---

## 🔍 تشخيص عام

### خطوات التشخيص الأساسية:

<div dir="rtl">

1. **افتح Console (F12)**
   ```javascript
   // تحقق من الأخطاء الحمراء
   // ابحث عن keywords:
   // - "error"
   // - "failed"
   // - "denied"
   // - "timeout"
   ```

2. **افتح Network Tab**
   ```
   - رتب حسب Status
   - ابحث عن:
     • 401/403 ← مشكلة صلاحيات
     • 404 ← endpoint غير موجود
     • 500 ← خطأ في السيرفر
     • timeout ← بطء في الاتصال
   ```

3. **تحقق من Supabase Status**
   ```
   https://status.supabase.com
   
   - تأكد أن جميع الخدمات خضراء
   ```

4. **تحقق من Vercel Status**
   ```
   https://www.vercel-status.com
   
   - تأكد من عدم وجود outages
   ```

</div>

---

## 🆘 الحل النهائي (Nuclear Option)

<div dir="rtl">

إذا لم ينفع أي شيء:

</div>

```bash
# 1. نظف كل شيء محلياً:
rm -rf node_modules
rm -rf dist
rm -rf .vercel
npm cache clean --force

# 2. أعد التثبيت:
npm install

# 3. اختبر محلياً:
npm run dev

# إذا عمل:

# 4. في Vercel:
# Settings → General → Delete Project
# ثم أعد ربط المشروع من GitHub

# 5. في Supabase:
# لا تحذف المشروع!
# فقط نفّذ Migrations مرة أخرى:
# - 🚨-COMPLETE-DATABASE-SETUP.sql
# - 🔧-PERMISSIONS-FIX.sql
```

---

## 📞 الدعم

### قبل طلب المساعدة، جهّز:

<div dir="rtl">

```
1. Screenshot من الخطأ
2. Console Logs (كاملة)
3. Network Tab (filtered by supabase)
4. Vercel Build Logs
5. Supabase Logs
6. الخطوات التي قمت بها
7. ما هو المتوقع vs ما حدث فعلاً
```

### الملفات المساعدة:

```
- 🚀-START-HERE.md (البداية)
- 🔧-VERCEL-DEPLOYMENT-FIX.md (مشاكل Vercel)
- 📖-COMPLETE-FIXES-GUIDE.md (دليل شامل)
- 🧪-TESTING-CHECKLIST.md (اختبار)
- ✅-QUICK-VERIFICATION.md (تحقق سريع)
```

</div>

---

<div align="center" dir="rtl">

## 💡 نصيحة أخيرة

**90% من المشاكل تُحل بـ:**

1. ✅ تنفيذ `🔧-PERMISSIONS-FIX.sql`
2. ✅ Redeploy في Vercel
3. ✅ Clear Cache (Ctrl+Shift+R)
4. ✅ تسجيل دخول جديد

---

![Help](https://img.shields.io/badge/🆘-Need%20Help%3F-blue?style=for-the-badge)

**جرّب الحلول أعلاه أولاً قبل طلب المساعدة**

**بالتوفيق! 💚**

</div>
