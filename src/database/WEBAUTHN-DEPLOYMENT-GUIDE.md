# 🔐 دليل نشر نظام الحضور بالبصمة (WebAuthn)

## 📋 نظرة عامة
تم إنشاء 4 Edge Functions في مجلد `/supabase/functions/` لتفعيل نظام الحضور بالبصمة باستخدام WebAuthn/Passkeys.

---

## 🗂️ الملفات المُنشأة

### Edge Functions
1. **webauthn-register-challenge** - توليد Challenge للتسجيل
2. **webauthn-register-verify** - التحقق من البصمة وحفظها
3. **webauthn-assert-challenge** - توليد Challenge للمصادقة
4. **webauthn-assert-verify** - التحقق من البصمة وتسجيل الحضور

---

## 🚀 خطوات النشر

### الخطوة 1: تثبيت Supabase CLI

```bash
# على Windows (PowerShell)
scoop install supabase

# أو على macOS/Linux
brew install supabase/tap/supabase

# أو عبر npm
npm install -g supabase
```

### الخطوة 2: تسجيل الدخول إلى Supabase

```bash
supabase login
```

### الخطوة 3: ربط المشروع

```bash
supabase link --project-ref bscxhshnubkhngodruuj
```

### الخطوة 4: نشر Edge Functions

```bash
# نشر جميع الـ Functions دفعة واحدة
supabase functions deploy webauthn-register-challenge
supabase functions deploy webauthn-register-verify
supabase functions deploy webauthn-assert-challenge
supabase functions deploy webauthn-assert-verify
```

**أو نشرها جميعاً مرة واحدة:**

```bash
supabase functions deploy
```

---

## 🔑 إضافة Service Role Key (مهم جداً!)

بعض Functions تحتاج إلى `SUPABASE_SERVICE_ROLE_KEY` للوصول إلى قاعدة البيانات.

### طريقة إضافة Secret:

1. **افتح Supabase Dashboard:**
   - https://supabase.com/dashboard/project/bscxhshnubkhngodruuj

2. **اذهب إلى:**
   - Settings → API

3. **انسخ `service_role` key** (secret key)

4. **أضف Secret عبر CLI:**

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**أو عبر Dashboard:**
- Settings → Edge Functions → Secrets → Add Secret
- Name: `SUPABASE_SERVICE_ROLE_KEY`
- Value: (الصق الـ key)

---

## ✅ التحقق من النشر

بعد النشر، تحقق من أن Functions تعمل:

```bash
supabase functions list
```

يجب أن ترى:
```
✓ webauthn-register-challenge
✓ webauthn-register-verify
✓ webauthn-assert-challenge
✓ webauthn-assert-verify
```

---

## 🧪 اختبار النظام

### 1. من واجهة الطالب:

1. سجل دخول كطالب
2. اذهب إلى "تسجيل الحضور"
3. اضغط على "تفعيل البصمة"
4. اتبع إرشادات المتصفح لتسجيل البصمة

### 2. تسجيل الحضور بالبصمة:

1. أدخل كود الجلسة
2. إذا كانت الجلسة تتطلب WebAuthn، سيُطلب منك البصمة تلقائياً
3. ضع بصمتك/Face ID
4. سيتم تسجيل حضورك بنجاح ✅

---

## 🔍 استكشاف الأخطاء

### خطأ: "No credentials found"
**الحل:** يجب على الطالب تسجيل البصمة أولاً من صفحة "تسجيل الحضور"

### خطأ: "Browser does not support biometric"
**الحل:** استخدم متصفح حديث (Chrome 67+, Safari 14+, Edge 18+) على جهاز يدعم البصمة

### خطأ: "Challenge verification failed"
**الحل:** تأكد من أن التوقيت بين الجهاز والخادم متزامن

### خطأ: "Unauthorized"
**الحل:** تأكد من أن المستخدم مسجل دخول وأن Token صالح

---

## 📊 كيفية عمل النظام

### عملية التسجيل (Registration):
```
Student → Frontend → webauthn-register-challenge
                   ← Challenge
Browser Biometric Prompt
                   → webauthn-register-verify
Database ← Store Credential
                   ← Success ✅
```

### عملية المصادقة (Authentication):
```
Student → Frontend → webauthn-assert-challenge
                   ← Challenge
Browser Biometric Prompt
                   → webauthn-assert-verify
Verify Credential
Database ← Mark Attendance
                   ← Success ✅
```

---

## 🔐 الأمان

- ✅ كل طلب يتحقق من هوية المستخدم عبر JWT
- ✅ التحقق من أن المستخدم يسجل لنفسه فقط
- ✅ Challenge عشوائي لكل عملية (منع إعادة الهجوم)
- ✅ Counter يزداد مع كل استخدام (منع Replay Attacks)
- ✅ لا يتم تخزين البصمة، فقط المفتاح العام
- ✅ Service Role Key لا يُرسل للواجهة الأمامية

---

## 🎯 الميزات

- 🆔 تسجيل حضور بالبصمة/Face ID/Passkey
- ⚡ أسرع من إدخال الكود
- 🔒 أكثر أماناً من الطرق التقليدية
- 📱 يعمل على الهواتف والحواسيب
- 🌐 متوافق مع معيار FIDO2/WebAuthn العالمي
- 📊 تتبع لحظي للحضور

---

## 📱 المتصفحات المدعومة

| المتصفح | الإصدار الأدنى | ملاحظات |
|---------|----------------|----------|
| Chrome | 67+ | ✅ دعم كامل |
| Safari | 14+ | ✅ دعم كامل (iOS 14+) |
| Edge | 18+ | ✅ دعم كامل |
| Firefox | 60+ | ⚠️ محدود على بعض الأجهزة |

---

## 🎓 الاستخدام في جامعة الملك خالد

هذا النظام يجعل **جامعة الملك خالد** أول جامعة سعودية تستخدم:
- ✅ الحضور السحابي بالبصمة (WebAuthn)
- ✅ نظام Passkeys للمصادقة
- ✅ تقنية FIDO2 المعتمدة عالمياً

---

## 📞 الدعم

إذا واجهت أي مشكلة:
1. تحقق من Logs في Supabase Dashboard → Edge Functions → Logs
2. تأكد من أن جميع الـ Secrets مضبوطة
3. تحقق من أن Schema منشور في قاعدة البيانات
4. راجع دليل الأخطاء أعلاه

---

## ✨ التحديثات المستقبلية

- [ ] دعم مفاتيح أمان خارجية (USB Security Keys)
- [ ] إحصائيات استخدام البصمة
- [ ] تنبيهات للطلاب لتفعيل البصمة
- [ ] دعم تسجيل أكثر من بصمة لنفس المستخدم

---

**تم بناء النظام بواسطة:** Figma Make AI  
**التاريخ:** 2025  
**المشروع:** Smart Attendance System - King Khalid University  

🚀 **جاهز للانطلاق!**
