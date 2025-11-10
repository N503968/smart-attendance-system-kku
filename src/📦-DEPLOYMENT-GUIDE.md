# 📦 دليل النشر على Vercel - Deployment Guide

<div align="center" dir="rtl">

# نشر النظام على Vercel

![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)

**من Zero إلى Production في 10 دقائق**

</div>

---

## 🎯 نظرة عامة

<div dir="rtl">

هذا الدليل يشرح كيفية نشر نظام الحضور الذكي على Vercel من البداية.

**الوقت المتوقع:** 10-15 دقيقة  
**الصعوبة:** سهل 🟢

</div>

---

## 📋 المتطلبات

<div dir="rtl">

قبل البدء، تأكد من:

</div>

```
✅ حساب GitHub
✅ حساب Vercel (مجاني)
✅ المشروع موجود على GitHub
✅ Supabase Project جاهز
✅ تنفيذ Migrations (🔧-PERMISSIONS-FIX.sql)
```

---

## 🚀 الخطوات

### 1️⃣ رفع الكود على GitHub

<div dir="rtl">

إذا لم يكن المشروع على GitHub بعد:

</div>

```bash
# 1. أنشئ Repository جديد على GitHub:
# https://github.com/new

# 2. في Terminal المحلي:
git init
git add .
git commit -m "Initial commit: Smart Attendance System"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/kku-attendance.git
git push -u origin main
```

---

### 2️⃣ ربط Vercel مع GitHub

<div dir="rtl">

1. **اذهب إلى Vercel:**
   ```
   https://vercel.com
   ```

2. **سجل دخول أو أنشئ حساب:**
   - اختر "Continue with GitHub"
   - امنح Vercel الصلاحيات

3. **أنشئ Project جديد:**
   - اضغط "Add New..."
   - اختر "Project"

4. **استورد Repository:**
   - ابحث عن: `kku-attendance` (أو اسم مشروعك)
   - اضغط "Import"

</div>

---

### 3️⃣ إعداد Project Settings

<div dir="rtl">

في صفحة الإعداد:

**Framework Preset:**
```
Vite
```

**Root Directory:**
```
./
```

**Build Command:**
```
npm run build
```
أو
```
vite build --minify
```

**Output Directory:**
```
dist
```

**Install Command:**
```
npm install
```

</div>

---

### 4️⃣ إضافة Environment Variables

<div dir="rtl">

**مهم جداً!** أضف المتغيرات التالية:

</div>

| Variable Name | Value |
|---------------|-------|
| `VITE_SUPABASE_URL` | `https://bscxhshnubkhngodruuj.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzY3hoc2hudWJraG5nb2RydXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MDgzODUsImV4cCI6MjA3ODI4NDM4NX0._cszwMx3Yty-pl0Ip6IKlSctk7HxBJ4pN6ehLpkAEqY` |

<div dir="rtl">

**خطوات الإضافة:**

1. في صفحة الإعداد → "Environment Variables"
2. اكتب اسم المتغير
3. الصق القيمة (بدون مسافات زائدة!)
4. اختر البيئات:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. اضغط "Add"
6. كرر للمتغير الثاني

</div>

---

### 5️⃣ Deploy!

<div dir="rtl">

1. **بعد إضافة Environment Variables:**
   - اضغط "Deploy"

2. **انتظر...**
   ```
   Building... (1-2 دقيقة)
   ├─ Installing dependencies
   ├─ Building application
   ├─ Optimizing output
   └─ Deploying...
   
   ✅ Deployment ready!
   ```

3. **افتح الموقع:**
   - اضغط "Visit"
   - أو انسخ الرابط

</div>

---

### 6️⃣ إعداد Supabase للموقع الجديد

<div dir="rtl">

1. **افتح Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/bscxhshnubkhngodruuj
   ```

2. **اذهب إلى:**
   ```
   Authentication → URL Configuration
   ```

3. **أضف Vercel URL:**
   
   **Site URL:**
   ```
   https://your-project-name.vercel.app
   ```

   **Redirect URLs:**
   ```
   https://your-project-name.vercel.app/**
   https://*.vercel.app/**
   ```

4. **احفظ التغييرات**

</div>

---

## ✅ التحقق من النشر

### اختبار سريع (5 دقائق):

<div dir="rtl">

1. **افتح الموقع:**
   ```
   https://your-project-name.vercel.app
   ```

2. **تحقق من الصفحة الرئيسية:**
   - ✅ تظهر بدون أخطاء
   - ✅ الشعار واضح
   - ✅ الألوان صحيحة

3. **سجل دخول:**
   ```
   البريد: supervisor@kku.edu.sa
   (أو أنشئ حساب جديد)
   ```

4. **تحقق من Dashboard:**
   - ✅ البيانات تُحمّل
   - ✅ لا "جاري التحميل..." لا نهائي
   - ✅ الأزرار تعمل

5. **حدّث الصفحة (F5):**
   - ✅ يبقى مسجل دخول
   - ✅ لا يرجع لصفحة Login

6. **افتح Console (F12):**
   - ✅ لا أخطاء حمراء
   - ✅ ترى: "Supabase Config: ..."

</div>

---

## 🔧 إعدادات إضافية (اختيارية)

### Domain مخصص:

<div dir="rtl">

1. **في Vercel Dashboard:**
   ```
   Settings → Domains
   ```

2. **أضف Domain:**
   ```
   attendance.kku.edu.sa
   ```
   (إذا تملك هذا الدومين)

3. **اتبع التعليمات لإعداد DNS**

</div>

---

### Auto Deployments:

<div dir="rtl">

**افتراضياً، Vercel ينشر تلقائياً عند:**
- ✅ Push إلى `main` branch
- ✅ Pull Request جديد (Preview deployment)

**لتعطيل Auto Deploy:**
```
Settings → Git → Auto Deploy
```

</div>

---

### Performance Settings:

<div dir="rtl">

1. **Regions:**
   ```
   Settings → Functions → Region
   ← اختر أقرب region لمستخدميك
   (مثال: Frankfurt - fra1 للسعودية)
   ```

2. **Analytics:**
   ```
   Analytics → Enable
   ← لمراقبة الأداء
   ```

3. **Speed Insights:**
   ```
   Speed Insights → Enable
   ← لتحليل السرعة
   ```

</div>

---

## 🔄 التحديثات المستقبلية

### عند تحديث الكود:

<div dir="rtl">

**الطريقة الأوتوماتيكية:**

</div>

```bash
# 1. عدّل الكود محلياً
# 2. اختبر محلياً:
npm run dev

# 3. إذا كل شيء يعمل:
git add .
git commit -m "Update: description of changes"
git push origin main

# 4. Vercel ستنشر تلقائياً!
# 5. راقب الـ Deploy في Dashboard
# 6. بعد النجاح، اختبر الموقع
```

<div dir="rtl">

**الطريقة اليدوية:**

</div>

```bash
# في Vercel Dashboard:
Deployments → [...] → Redeploy

# اختر:
☑️ Use existing Build Cache (للسرعة)
☐ Clear cache (إذا كانت مشكلة)

# اضغط Redeploy
```

---

## 🐛 استكشاف الأخطاء

### Build Failed:

<div dir="rtl">

**الحل:**

1. **افتح Build Logs:**
   ```
   Deployments → [Failed] → Building
   ```

2. **ابحث عن الخطأ:**
   ```
   - TypeScript errors → أصلح في الكود
   - Module not found → npm install package
   - Out of memory → استخدم vercel.json
   ```

3. **جرّب محلياً:**
   ```bash
   npm run build
   # إذا فشل محلياً، أصلح ثم push
   ```

</div>

---

### Runtime Errors:

<div dir="rtl">

**الحل:**

1. **افتح Runtime Logs:**
   ```
   Deployments → [Latest] → Runtime Logs
   ```

2. **ابحث عن الأخطاء**

3. **تحقق من Environment Variables:**
   ```
   Settings → Environment Variables
   - تأكد من جميع القيم موجودة
   - لا مسافات زائدة
   ```

</div>

---

## 📊 مراقبة الأداء

### في Vercel:

<div dir="rtl">

1. **Analytics:**
   ```
   Analytics → Web Analytics
   - عدد الزوار
   - الصفحات الأكثر زيارة
   - مدة الجلسة
   ```

2. **Speed Insights:**
   ```
   Speed Insights
   - First Contentful Paint
   - Time to Interactive
   - Core Web Vitals
   ```

3. **Logs:**
   ```
   Logs → Realtime
   - أخطاء Runtime
   - Warnings
   - Console logs
   ```

</div>

---

### في Supabase:

<div dir="rtl">

1. **Database:**
   ```
   Database → Usage
   - Database size
   - Requests count
   - Query performance
   ```

2. **API:**
   ```
   API → Logs
   - API calls
   - Slow queries
   - Errors
   ```

3. **Auth:**
   ```
   Authentication → Users
   - Active users
   - Sign-ups
   - Sessions
   ```

</div>

---

## 🔐 الأمان

### Best Practices:

<div dir="rtl">

1. **Environment Variables:**
   - ✅ استخدم دائماً للـ secrets
   - ❌ لا تضع في الكود
   - ✅ غيّر Keys بعد التسريب

2. **RLS Policies:**
   - ✅ فعّل على جميع الجداول
   - ✅ اختبر الصلاحيات
   - ❌ لا تعطّل أبداً في Production

3. **CORS:**
   - ✅ حدد Domains المسموحة فقط
   - ❌ لا تستخدم wildcard `*`

4. **Rate Limiting:**
   - ✅ فعّل في Supabase
   - ✅ راقب الـ quota

</div>

---

## 💰 التكلفة

### Vercel Free Tier:

<div dir="rtl">

```
✅ 100 GB Bandwidth/month
✅ Unlimited Deployments
✅ Unlimited Sites
✅ Automatic HTTPS
✅ Analytics (محدود)

⚠️ Limits:
- Serverless Function: 10s timeout
- Build time: 45 min/month
```

**كافٍ للاستخدام الجامعي! ✅**

</div>

---

### Supabase Free Tier:

<div dir="rtl">

```
✅ 500 MB Database
✅ 1 GB File Storage
✅ 2 GB Bandwidth/month
✅ 50,000 Monthly Active Users
✅ Social OAuth

⚠️ Limits:
- Database pauses after 1 week inactivity
- Limited to 2 projects
```

**كافٍ للاستخدام الجامعي! ✅**

</div>

---

## 📞 الدعم

### إذا واجهت مشاكل:

<div dir="rtl">

1. **راجع:**
   - [`⚠️-COMMON-ISSUES.md`](⚠️-COMMON-ISSUES.md)
   - [`🔧-VERCEL-DEPLOYMENT-FIX.md`](🔧-VERCEL-DEPLOYMENT-FIX.md)

2. **Vercel Support:**
   ```
   https://vercel.com/support
   ```

3. **Supabase Support:**
   ```
   https://supabase.com/support
   ```

4. **Community:**
   - Vercel Discord
   - Supabase Discord

</div>

---

## ✅ قائمة التحقق النهائية

<div dir="rtl">

قبل اعتبار النشر ناجحاً:

</div>

```
□ الكود على GitHub
□ Vercel متصل بـ GitHub
□ Environment Variables مضبوطة
□ Build ناجح
□ الموقع يفتح
□ Supabase URLs محدثة
□ تسجيل الدخول يعمل
□ Dashboard يعرض البيانات
□ Refresh لا يسجل خروج
□ لا أخطاء في Console
□ الأداء جيد (< 3s)
□ جميع الأدوار تعمل
□ الموبايل responsive
□ RTL للعربية يعمل
```

---

<div align="center" dir="rtl">

## 🎉 تهانينا!

### موقعك الآن Live على الإنترنت! 🚀

---

![Live](https://img.shields.io/badge/✅-Live%20on%20Vercel-success?style=for-the-badge)
![Fast](https://img.shields.io/badge/⚡-Fast%20CDN-blue?style=for-the-badge)
![Secure](https://img.shields.io/badge/🔒-HTTPS-green?style=for-the-badge)

---

**شارك الرابط:**
```
https://your-project-name.vercel.app
```

**للتحديثات:**
```bash
git push origin main
```

**بالتوفيق! 💚**

</div>
