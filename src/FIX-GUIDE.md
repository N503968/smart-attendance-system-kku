# دليل إصلاح مشكلة العلاقات في قاعدة البيانات

## المشكلة
ظهر خطأ عند تحميل بيانات الطلاب:
```
Could not find a relationship between 'sessions' and 'sections' in the schema cache
```

## السبب
جدول `sessions` كان ينقصه أعمدة مهمة (`starts_at`, `ends_at`, `require_webauthn`) التي يستخدمها الكود.

## ⚡ الحل السريع

### الخطوة 1: افتح Supabase SQL Editor
1. اذهب إلى: https://supabase.com/dashboard
2. اختر مشروعك: `bscxhshnubkhngodruuj`
3. من القائمة الجانبية، اختر "SQL Editor"
4. انقر "+ New query"

### الخطوة 2: نفذ السكربت العاجل
انسخ والصق محتوى الملف `/URGENT-DATABASE-FIX.sql` واضغط "Run"

✅ هذا سيصلح جميع المشاكل تلقائياً!

---

## للمستخدمين الجدد والحاليين

### للمستخدمين الجدد (قاعدة بيانات جديدة)
قم بتشغيل ملف `/supabase-schema.sql` الكامل في Supabase SQL Editor.

### للمستخدمين الحاليين (تحديث قاعدة البيانات الموجودة)
قم بتشغيل ملف `/URGENT-DATABASE-FIX.sql` في Supabase SQL Editor.

---

## التغييرات في الكود

تم تحديث طريقة الاستعلام لتكون متوافقة مع PostgREST:

### StudentDashboard.tsx
```typescript
// الطريقة الصحيحة
.select(`
  *,
  sessions(
    *,
    sections(
      *,
      courses(*)
    )
  )
`)
```

### ActiveSessionsPage.tsx
```typescript
// الطريقة الصحيحة
.select(`
  *,
  sections(
    name,
    courses(name, code)
  )
`)
```

## الأعمدة المضافة لجدول sessions

- `starts_at` (TIMESTAMPTZ): وقت بدء الجلسة
- `ends_at` (TIMESTAMPTZ): وقت انتهاء الجلسة
- `require_webauthn` (BOOLEAN): هل تتطلب الجلسة مصادقة بيومترية

---

## التحقق من الإصلاح

### 1. التحقق من الأعمدة
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sessions'
AND column_name IN ('starts_at', 'ends_at', 'require_webauthn');
```

### 2. التحقق من العلاقات
```sql
SELECT s.code, sec.name, c.name
FROM sessions s
JOIN sections sec ON s.section_id = sec.id
JOIN courses c ON sec.course_id = c.id
LIMIT 1;
```

### 3. اختبر التطبيق
1. سجل الدخول كطالب
2. يجب أن تظهر لوحة التحكم بدون أخطاء
3. تحقق من ظهور بيانات الحضور بشكل صحيح

---

## ملاحظات

- ✅ لن تفقد أي بيانات موجودة
- ✅ السكربت يستخدم `IF NOT EXISTS` لتجنب الأخطاء
- ✅ جميع التحديثات متوافقة مع البيانات الحالية
- ✅ يتم إنشاء الـ Foreign Keys تلقائياً إذا لم تكن موجودة

---

## ملفات إضافية

- `/URGENT-DATABASE-FIX.sql` - **ابدأ من هنا!** إصلاح شامل وسريع
- `/sample-data.sql` - بيانات تجريبية للاختبار
- `/SETUP-INSTRUCTIONS.md` - دليل الإعداد الكامل بالعربية

---

## دعم

إذا واجهت أي مشاكل، تحقق من:
- ✅ صحة اتصالك بقاعدة البيانات
- ✅ صلاحيات المستخدم في Supabase
- ✅ Console logs في المتصفح (F12)
- ✅ Supabase Logs في Dashboard