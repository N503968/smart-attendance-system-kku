# ⚡ حل سريع لخطأ قاعدة البيانات | Quick Database Fix

## 🚨 المشكلة | Problem
```
Error: Could not find a relationship between 'sessions' and 'sections'
```

## ✅ الحل في 3 خطوات | Solution in 3 Steps

### 1. افتح Supabase SQL Editor
📍 https://supabase.com/dashboard/project/bscxhshnubkhngodruuj/sql

### 2. شغّل هذا السكربت | Run This Script
افتح الملف: **`/URGENT-DATABASE-FIX.sql`**
- انسخ المحتوى كاملاً
- الصق في SQL Editor
- اضغط **Run** ▶️

### 3. أعد تحميل التطبيق | Reload App
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

---

## 📚 ملفات قاعدة البيانات | Database Files

| الملف | متى تستخدمه |
|------|-------------|
| **`URGENT-DATABASE-FIX.sql`** | ⭐ **ابدأ من هنا!** إصلاح المشكلة الحالية |
| `supabase-schema.sql` | إعداد قاعدة بيانات جديدة من الصفر |
| `sample-data.sql` | إضافة بيانات تجريبية للاختبار |
| `SETUP-INSTRUCTIONS.md` | دليل الإعداد الكامل |

---

## 🧪 اختبار سريع | Quick Test

بعد تشغيل السكربت:

```sql
-- اختبر هذا في SQL Editor
SELECT 
  s.code,
  sec.name as section,
  c.name as course
FROM sessions s
JOIN sections sec ON s.section_id = sec.id
JOIN courses c ON sec.course_id = c.id
LIMIT 1;
```

✅ **إذا نجح بدون أخطاء، فالإصلاح تم بنجاح!**

---

## 🎯 خطوات تالية | Next Steps

1. ✅ شغّل `/URGENT-DATABASE-FIX.sql`
2. ✅ أعد تحميل التطبيق
3. ⭐ (اختياري) شغّل `/sample-data.sql` للبيانات التجريبية
4. ⭐ سجل دخول كطالب واختبر النظام

---

## 📞 المساعدة | Need Help?

- 📖 دليل كامل: `/SETUP-INSTRUCTIONS.md`
- 🔧 تفاصيل الإصلاح: `/FIX-GUIDE.md`
- 💻 تفاصيل تقنية: `/DATABASE-FIX.md`

---

## ✅ تم الإصلاح | Fixed Issues

- ✅ إضافة أعمدة مفقودة (`starts_at`, `ends_at`, `require_webauthn`)
- ✅ التحقق من العلاقات (Foreign Keys)
- ✅ إنشاء الـ Indexes
- ✅ تحديث الكود ليتوافق مع PostgREST
- ✅ إصلاح queries في StudentDashboard و ActiveSessionsPage

---

**آخر تحديث:** 2024-11-10 | **الحالة:** ✅ جاهز للاستخدام
