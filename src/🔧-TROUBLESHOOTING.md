# 🔧 استكشاف الأخطاء وإصلاحها - Troubleshooting Guide

<div align="center">

# **دليل شامل لحل جميع المشاكل**

</div>

---

## 📋 جدول المحتويات:

1. [❌ Email Confirmation Error](#-email-confirmation-error)
2. [❌ Database Schema Error (PGRST205)](#-database-schema-error-pgrst205)
3. [❌ Registration Errors](#-registration-errors)
4. [❌ Login Errors](#-login-errors)
5. [❌ WebAuthn/Biometric Errors](#-webauthnbiometric-errors)
6. [✅ حالة النظام](#-حالة-النظام)

---

## ❌ Email Confirmation Error

### المشكلة:

```
AuthApiError: Email not confirmed
Email link is invalid or has expired
```

### السبب:

Supabase يطلب تأكيد البريد الإلكتروني قبل السماح بتسجيل الدخول.

### ✅ الحل السريع (دقيقة واحدة):

```
1. افتح: https://supabase.com/dashboard/project/bscxhshnubkhngodruuj/settings/auth
2. ابحث عن: "Enable email confirmations"
3. اطفئه (OFF)
4. احفظ (Save)
```

### 📖 مزيد من التفاصيل:

- [FIX-EMAIL-ERROR-NOW.md](./FIX-EMAIL-ERROR-NOW.md) - حل سريع
- [VISUAL-FIX-GUIDE.md](./VISUAL-FIX-GUIDE.md) - دليل مرئي
- [DISABLE-EMAIL-CONFIRMATION.md](./DISABLE-EMAIL-CONFIRMATION.md) - دليل مفصّل

---

## ❌ Database Schema Error (PGRST205)

### المشكلة:

```
Could not find table 'public.profiles'
PGRST205: relation "public.profiles" does not exist
```

### السبب:

جداول قاعدة البيانات غير موجودة في Supabase.

### ✅ الحل السريع (5 دقائق):

```
1. افتح: https://supabase.com/dashboard/project/bscxhshnubkhngodruuj/sql
2. اضغط "New query"
3. افتح ملف /supabase-schema.sql في مشروعك
4. انسخ كل المحتوى (Ctrl+A → Ctrl+C)
5. الصق في SQL Editor (Ctrl+V)
6. اضغط Run (أو Ctrl+Enter)
7. انتظر رسالة النجاح
```

### 📖 مزيد من التفاصيل:

- [DO-THIS-NOW.md](./DO-THIS-NOW.md) - دليل كامل للخطوتين
- [QUICK-FIX.md](./QUICK-FIX.md) - إصلاح سريع
- [SUPABASE-SETUP.md](./SUPABASE-SETUP.md) - إعداد شامل

---

## ❌ Registration Errors

### المشكلة 1: "Email already registered"

```
User already registered
```

**الحل:**

```
استخدم بريد إلكتروني مختلف
أو سجل دخول بالحساب الموجود
```

### المشكلة 2: "Password too weak"

```
Password should be at least 6 characters
```

**الحل:**

```
استخدم كلمة مرور قوية:
- 6 أحرف على الأقل
- مثال: Test123!
```

### المشكلة 3: "Invalid email format"

```
Invalid email
```

**الحل:**

```
استخدم صيغة بريد صحيحة:
✅ user@example.com
✅ test@kku.edu.sa
❌ user@
❌ @example.com
```

---

## ❌ Login Errors

### المشكلة 1: "Invalid credentials"

```
Invalid login credentials
```

**الحل:**

```
تحقق من:
✅ البريد الإلكتروني صحيح
✅ كلمة المرور صحيحة
✅ لا توجد مسافات زائدة
```

### المشكلة 2: "Email not confirmed"

```
Email not confirmed
```

**الحل:**

انظر [Email Confirmation Error](#-email-confirmation-error) أعلاه

---

## ❌ WebAuthn/Biometric Errors

### المشكلة 1: "WebAuthn not supported"

```
WebAuthn is not supported in this browser
```

**الحل:**

```
✅ استخدم متصفح حديث:
   - Chrome 67+
   - Firefox 60+
   - Safari 13+
   - Edge 18+

✅ استخدم HTTPS (للإنتاج)
✅ localhost يعمل بدون HTTPS (للتطوير)
```

### المشكلة 2: "Edge Functions not deployed"

```
Edge Functions not found
Failed to call WebAuthn function
```

**الحل:**

```
يجب نشر Edge Functions:

1. ثبّت Supabase CLI:
   npm install -g supabase

2. سجل دخول:
   supabase login

3. اربط المشروع:
   supabase link --project-ref bscxhshnubkhngodruuj

4. انشر Functions:
   supabase functions deploy webauthn-register-challenge
   supabase functions deploy webauthn-register-verify
   supabase functions deploy webauthn-assert-challenge
   supabase functions deploy webauthn-assert-verify
```

### 📖 مزيد من التفاصيل:

- [START-HERE-WEBAUTHN.md](./START-HERE-WEBAUTHN.md) - دليل WebAuthn
- [WEBAUTHN-DEPLOYMENT-GUIDE.md](./database/WEBAUTHN-DEPLOYMENT-GUIDE.md) - دليل النشر
- [BIOMETRIC-USER-GUIDE-AR.md](./database/BIOMETRIC-USER-GUIDE-AR.md) - دليل المستخدم

---

## ✅ حالة النظام

### قائمة التحقق الكاملة:

#### 🔧 إعدادات Supabase:

- [ ] Email Confirmation معطّل (OFF)
- [ ] Database Schema منشور
- [ ] RLS Policies مفعّلة
- [ ] Edge Functions منشورة (للبصمة)

#### 💻 التطبيق:

- [ ] التسجيل يعمل
- [ ] تسجيل الدخول يعمل
- [ ] Dashboard يظهر
- [ ] الحضور بالبصمة يعمل (إن وُجدت جلسة)

#### 🧪 الاختبار:

```bash
# 1. شغّل المشروع
npm run dev

# 2. افتح المتصفح
http://localhost:5173

# 3. سجّل حساب جديد
الاسم: Test User
البريد: test@example.com
الدور: طالب
كلمة المرور: Test123!

# 4. النتيجة المتوقعة
✅ تسجيل ناجح
✅ دخول تلقائي
✅ Dashboard يظهر
```

---

## 🆘 دعم إضافي

### 📚 الملفات المرجعية:

#### بدء سريع:

- [⚠️-FIX-THIS-FIRST.md](./⚠️-FIX-THIS-FIRST.md) - ابدأ هنا
- [DO-THIS-NOW.md](./DO-THIS-NOW.md) - خطوتين رئيسيتين
- [QUICK-FIX.md](./QUICK-FIX.md) - إصلاح سريع

#### إعداد شامل:

- [START-HERE.md](./START-HERE.md) - دليل البداية
- [SUPABASE-SETUP.md](./SUPABASE-SETUP.md) - إعداد Supabase
- [DEPLOYMENT.md](./DEPLOYMENT.md) - دليل النشر

#### ميزات متقدمة:

- [WEBAUTHN-COMPLETE.md](./WEBAUTHN-COMPLETE.md) - نظام البصمة
- [ACCESS-CONTROL.md](./ACCESS-CONTROL.md) - التحكم بالصلاحيات
- [NEW-FEATURES.md](./NEW-FEATURES.md) - الميزات الجديدة

#### دليل المستخدم:

- [USER-GUIDE-AR.md](./USER-GUIDE-AR.md) - دليل المستخدم بالعربية
- [BIOMETRIC-USER-GUIDE-AR.md](./database/BIOMETRIC-USER-GUIDE-AR.md) - دليل البصمة

---

## 🔍 استكشاف أخطاء أخرى

### المشكلة: التطبيق لا يعمل بعد كل الخطوات

**الحل:**

```
1. أغلق المتصفح تماماً
2. امسح Cache:
   - Chrome: Ctrl+Shift+Delete
   - Firefox: Ctrl+Shift+Delete
   - Safari: Cmd+Option+E
3. افتح المتصفح من جديد
4. جرب مرة أخرى
```

### المشكلة: خطأ في Console

**الحل:**

```
1. افتح Developer Tools (F12)
2. اذهب إلى Console
3. ابحث عن الخطأ
4. انسخ الخطأ الكامل
5. ابحث عنه في هذا الملف
```

### المشكلة: لا توجد Edge Functions

**الحل:**

```
راجع: START-HERE-WEBAUTHN.md
Edge Functions اختيارية للبصمة فقط
النظام الأساسي يعمل بدونها
```

---

## ⏱️ الوقت المتوقع للإصلاح:

```
┌─────────────────────────────────────┐
│  Email Confirmation:     1 دقيقة   │
│  Database Schema:        5 دقائق   │
│  الاختبار:              2 دقيقة   │
│  Edge Functions:        15 دقيقة   │
│  ────────────────────────────────   │
│  المجموع (بدون Edge):   8 دقائق   │
│  المجموع (كامل):       23 دقيقة   │
└─────────────────────────────────────┘
```

---

<div align="center">

# 🎯 **خطة الإصلاح الموصى بها:**

```
1️⃣ ابدأ بإصلاح Email Confirmation (1 دقيقة)
        ⬇️
2️⃣ طبّق Database Schema (5 دقائق)
        ⬇️
3️⃣ اختبر النظام (2 دقيقة)
        ⬇️
4️⃣ إذا احتجت البصمة، انشر Edge Functions (15 دقيقة)
        ⬇️
✅ نظام جاهز للعمل!
```

---

## 🔗 **روابط سريعة:**

### [Auth Settings](https://supabase.com/dashboard/project/bscxhshnubkhngodruuj/settings/auth)

### [SQL Editor](https://supabase.com/dashboard/project/bscxhshnubkhngodruuj/sql)

### [Table Editor](https://supabase.com/dashboard/project/bscxhshnubkhngodruuj/editor)

---

# 🚀 **ابدأ الآن!**

**افتح [⚠️-FIX-THIS-FIRST.md](./⚠️-FIX-THIS-FIRST.md)** 

</div>
