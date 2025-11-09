# 🎓 Smart Attendance & Scheduling System - King Khalid University

<div align="center">

![KKU](https://img.shields.io/badge/University-King_Khalid-0B3D2E?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Production_Ready-27AE60?style=for-the-badge)
![License](https://img.shields.io/badge/License-KKU-1ABC9C?style=for-the-badge)

**نظام ذكي متكامل لإدارة الحضور والجداول الدراسية**

[العربية](#ar) • [English](#en)

</div>

---

## 🚨 **ابدأ هنا - START HERE**

### 🎯 **الدليل السريع (8 دقائق):**

<div align="center">

## **[👉 ابدأ من هنا - START-HERE-FIRST.md 👈](./START-HERE-FIRST.md)**

</div>

---

### ⚠️ **لديك خطأ؟**

<div align="center">

## **[🆘 حل الخطأ الآن - ⚠️-FIX-THIS-FIRST.md](./⚠️-FIX-THIS-FIRST.md)**

</div>

---

### 📚 **أدلة مفيدة:**

| الملف | الوصف | الوقت |
|-------|-------|-------|
| **[⚠️-FIX-THIS-FIRST.md](./⚠️-FIX-THIS-FIRST.md)** | حل خطأ Email (سريع جداً) | 1 دقيقة |
| **[🎯-QUICK-START.md](./🎯-QUICK-START.md)** | بدء سريع (3 خطوات) | 8 دقائق |
| **[START-HERE-FIRST.md](./START-HERE-FIRST.md)** | دليل شامل للبدء | 15 دقيقة |
| **[✅-SETUP-CHECKLIST.md](./���-SETUP-CHECKLIST.md)** | قائمة تحقق كاملة | - |
| **[🔧-TROUBLESHOOTING.md](./🔧-TROUBLESHOOTING.md)** | حل جميع الأخطاء | - |
| **[INDEX.md](./INDEX.md)** | فهرس كامل لجميع الملفات | - |

---

### 🔴 **الأخطاء الشائعة:**

```
❌ Email not confirmed
   → الحل: FIX-EMAIL-ERROR-NOW.md

❌ Table not found (PGRST205)
   → الحل: DO-THIS-NOW.md (الخطوة 2)

❌ WebAuthn error
   → الحل: START-HERE-WEBAUTHN.md
```

**📖 دليل شامل:** [🔧-TROUBLESHOOTING.md](./🔧-TROUBLESHOOTING.md)

---

<a name="ar"></a>
## 🇸🇦 نظرة عامة

نظام الحضور الذكي هو مشروع تخرج شامل تم تطويره بواسطة فريق من طالبات جامعة الملك خالد. يهدف المشروع إلى تحديث وتطوير عملية تسجيل الحضور في الجامعة باستخدام أحدث التقنيات.

### ✨ المميزات الرئيسية

#### 🎨 التصميم
- ✅ واجهات حديثة بهوية جامعة الملك خالد
- ✅ خلفيات متدرجة وأنماط هندسية احترافية
- ✅ تصميم متجاوب 100% (Mobile-First)
- ✅ وضع فاتح/داكن (Light/Dark Theme)
- ✅ دعم كامل للغتين العربية والإنجليزية (RTL/LTR)
- ✅ **Glassmorphism و Blur Effects** ✨ **جديد**
- ✅ **Animations متقدمة** ✨ **جديد**
- ✅ **خلفيات مخصصة لكل صفحة** ✨ **جديد**

#### 🔐 الأمان
- ✅ مصادقة بيومترية متقدمة (WebAuthn/Passkeys)
- ✅ نظام حماية متعدد المستويات (Row Level Security)
- ✅ التحكم بالوصول حسب الدور (Role-Based Access Control)
- ✅ تشفير البيانات الحساسة
- ✅ **اختيار الدور عند التسجيل** ✨ **جديد**
- ✅ **التوجيه التلقائي حسب الدور** ✨ **جديد**

#### 👥 الأدوار والصلاحيات

**1. المدير (Admin)**
- إحصائيات شاملة عن النظام
- إدارة المستخدمين (إضافة/تعديل/حذف)
- إدارة المواد الدراسية والأقسام
- عرض جميع التقارير

**2. المدرس (Instructor)**
- عرض المقررات المخصصة
- إنشاء جلسات حضور (Code/QR)
- تقارير الحضور القابلة للتصدير
- تحديثات فورية عند تسجيل الطلاب

**3. الطالب (Student)**
- عرض الجدول اليومي
- تسجيل الحضور بالبصمة البيومترية
- متابعة السجل الشخصي (Present/Absent/Late)
- إشعارات فورية

#### ⚡ التقنيات

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS 4.0
- Shadcn/ui Components
- Lucide Icons
- Recharts (للرسوم البيانية)

**Backend:**
- Supabase (PostgreSQL)
- Row Level Security (RLS)
- Realtime Subscriptions
- Edge Functions

**Authentication:**
- Supabase Auth
- WebAuthn/Passkeys
- Biometric Authentication

---

## 🚀 البدء السريع

### المتطلبات
- Node.js 18+ و npm
- حساب Supabase (مجاني)

### ⚠️ **هام: إعداد قاعدة البيانات أولاً**

**قبل البدء، يجب تطبيق Schema على Supabase:**

```bash
# 1. افتح Supabase Dashboard
https://supabase.com/dashboard/project/bscxhshnubkhngodruuj/sql

# 2. افتح ملف /supabase-schema.sql

# 3. انسخ كل المحتوى والصقه في SQL Editor

# 4. اضغط Run (Ctrl+Enter)

# 5. انتظر رسالة النجاح:
✅ Database schema created successfully!
```

**📖 للتعليمات المفصلة:** اقرأ `/SUPABASE-SETUP.md` أو `/STEP-BY-STEP.md`

---

### التثبيت والتشغيل

```bash
# 1. استنساخ المشروع
git clone https://github.com/your-username/kku-attendance-system.git
cd kku-attendance-system

# 2. تثبيت المكتبات
npm install

# 3. إعداد المتغيرات البيئية
cp .env.example .env
# ثم عدّل .env بمعلومات Supabase الخاصة بك

# 4. تشغيل المشروع
npm run dev

# 5. افتح المتصفح
http://localhost:5173
```

---

### 🔧 إصلاح الأخطاء الشائعة

#### ❌ خطأ PGRST205: "Could not find table 'public.profiles'"
```
السبب: لم يتم تطبيق Schema على قاعدة البيانات
الحل: اتبع الخطوات في /SUPABASE-SETUP.md
سريع: راجع /FIX-ERROR.md أو /APPLY-SCHEMA-NOW.md
```

#### ❌ خطأ في التسجيل
```
1. تأكد من تطبيق Schema
2. تحقق من SUPABASE_URL و ANON_KEY في .env
3. راجع Console (F12) للأخطاء
```

---

## 📁 هيكل المشروع

```
├── /components/           # مكونات React
│   ├── /ui/              # Shadcn UI components
│   ├── HomePage.tsx      # الصفحة الرئيسية
│   ├── AboutPage.tsx     # صفحة الفريق
│   ├── AuthPage.tsx      # تسجيل الدخول/التسجيل
│   ├── AdminDashboard.tsx
│   ├── InstructorDashboard.tsx
│   ├── StudentDashboard.tsx
│   ├── CreateSessionPage.tsx
│   ├── SubmitAttendancePage.tsx
│   ├── ReportsPage.tsx
│   ├── SchedulesPage.tsx
│   ├── UsersPage.tsx
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── BackButton.tsx    # مكون زر الرجوع
│
├── /lib/                 # المكتبات والأدوات
│   ├── supabase.ts       # إعدادات Supabase
│   ├── i18n.ts           # نظام الترجمة
│   └── webauthn.ts       # WebAuthn functions
│
├── /database/            # قاعدة البيانات
│   └── schema.sql        # السكيما الكامل
│
├── /styles/              # الأنماط
│   └── globals.css       # CSS Variables + Tailwind
│
├── App.tsx               # المكون الرئيسي
├── main.tsx             # نقطة الدخول
│
└── /docs/               # الوثائق
    ├── FINAL-SETUP.md
    ├── ACCESS-CONTROL.md
    └── CHECKLIST.md
```

---

## 🎨 الألوان والهوية البصرية

```css
/* جامعة الملك خالد */
--primary: #0B3D2E;        /* أخضر KKU الداكن */
--secondary: #1ABC9C;      /* تركواز حديث */
--background: #F5F7F7;     /* رمادي فاتح */
--success: #27AE60;        /* أخضر */
--destructive: #E74C3C;    /* أحمر */
```

**الخطوط:**
- Cairo للعربية
- Poppins للإنجليزية

---

## 📱 الصفحات الرئيسية

### 1. الصفحة الرئيسية (/)
- Hero Section بخلفية متدرجة
- 6 مميزات رئيسية
- قسم "How It Works"
- CTA Section قوي

### 2. صفحة الفريق (/about)
- المشرفون الأكاديميون
- فريق التطوير (5 أعضاء)
- عن المشروع
- التقنيات المستخدمة

### 3. لوحات التحكم
- Admin Dashboard: إدارة شاملة
- Instructor Dashboard: إنشاء جلسات
- Student Dashboard: تسجيل حضور

---

## 🔒 نظام الحماية

### التحكم بالوصول (Access Control)

| الصفحة | Admin | Instructor | Student |
|--------|:-----:|:----------:|:-------:|
| Dashboard | ✅ | ✅ | ✅ |
| Create Session | ❌ | ✅ | ❌ |
| Submit Attendance | ❌ | ❌ | ✅ |
| Reports | ✅ | ✅* | ✅* |
| Schedules | ✅ | ✅ | ✅ |
| Users Management | ✅ | ❌ | ❌ |

*فقط البيانات الخاصة بالمستخدم

### Row Level Security (RLS)

جميع الجداول محمية بسياسات RLS:
- ✅ profiles: المستخدم يرى بياناته فقط
- ✅ sessions: المدرس يرى جلساته، الطلاب يرون الجلسات المتاحة
- ✅ attendance: فلترة حسب الدور
- ✅ courses, sections, schedules: صلاحيات مخصصة

---

## 🧪 الاختبار

### تسجيل حساب تجريبي

```bash
# الخيار 1: تسجيل مبسط (للاختبار)
Email: test@kku.edu.sa
Password: 123456
Name: Test User
# (الرقم الجامعي اختياري الآن)
```

### اخت��ار الأدوار المختلفة

```sql
-- في Supabase SQL Editor
-- تغيير دور المستخدم:
UPDATE profiles 
SET role = 'admin'  -- أو 'instructor' أو 'student'
WHERE email = 'test@kku.edu.sa';
```

### اختبار المميزات

1. **اللغة والثيم:**
   - اضغط 🌐 لتبديل اللغة
   - اضغط 🌗 لتبديل الوضع

2. **زر الرجوع:**
   - افتح أي صفحة داخلية
   - تأكد من وجود زر الرجوع (◀/▶)

3. **حماية الوصول:**
   - حاول الوصول لصفحة غير مصرح بها
   - تحقق من رسالة الخطأ

---

## 👥 فريق العمل

### المشرف الأكاديمي الرئيسي
**د. أحمد بن محمد**

### المشرفة المساعدة
**د. منال سعيد بن محمد أبو ملحة**

### فريق التطوير

| الاسم | الرقم الجامعي | الدور |
|------|--------------|-------|
| **Nafisah Mohammed Saleh** | 443816488 | Lead Developer |
| **Shatha Mohammed Asiri** | 441807510 | Frontend Developer |
| **Maryam Mahdi Alqahtani** | 441801563 | Database Developer |
| **Fatimah Gharamah Asiri** | 442803560 | UX Designer |
| **Bashaer Mohammed Alshahrani** | 442807848 | Systems Analyst |

---

## 📋 قاعدة البيانات

### الجداول (8 جداول)

1. **profiles** - بيانات المستخدمين
2. **departments** - الأقسام الأكاديمية
3. **courses** - المواد الدراسية
4. **sections** - الشعب الدراسية
5. **schedules** - الجداول الأسبوعية
6. **sessions** - جلسات الحضور
7. **attendance** - سجلات الحضور
8. **webauthn_credentials** - بيانات البصمة البيومترية

### العلاقات
```
departments ─┬─> courses ─┬─> sections ─┬─> schedules
             │            │             │
             │            │             └─> sessions ─> attendance
             │            │
             └─> profiles ├─> webauthn_credentials
                          │
                          └─> sessions (instructor)
                          └─> attendance (student)
```

---

## 📚 الوثائق

| الملف | الوصف |
|------|-------|
| `README.md` | هذا الملف - نظرة عامة شاملة |
| `FINAL-SETUP.md` | دليل الإعداد التفصيلي |
| `ACCESS-CONTROL.md` | شرح نظام الحماية والتحكم |
| `CHECKLIST.md` | قائمة المراجعة النهائية |
| `.env.example` | مثال على المتغيرات البيئية |

---

## 🎯 الميزات المتقدمة

### 1. Realtime Updates
```typescript
// التحديثات الفورية عبر Supabase Realtime
const channel = supabase
  .channel('attendance-updates')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'attendance' },
    (payload) => {
      // تحديث الواجهة تلقائياً
    }
  )
  .subscribe();
```

### 2. WebAuthn Integration
```typescript
// تسجيل البصمة البيومترية
await registerWebAuthn(userId, userName);

// المصادقة
const verified = await authenticateWebAuthn(userId);
```

### 3. Export Reports
```typescript
// تصدير التقارير إلى CSV/Excel
exportToCSV(reportData, 'attendance-report.csv');
```

---

## 🚀 النشر

### Vercel (موصى به)

```bash
# 1. رفع على GitHub
git add .
git commit -m "Production ready"
git push origin main

# 2. الربط مع Vercel
# - افتح vercel.com
# - استورد المشروع من GitHub
# - أضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY
# - Deploy
```

### Netlify

```bash
# 1. Build
npm run build

# 2. رفع مجلد dist/
# أو استخدم Netlify CLI:
netlify deploy --prod
```

### المتغيرات البيئية للنشر

```env
VITE_SUPABASE_URL=https://bscxhshnubkhngodruuj.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

---

## 🔧 التطوير

### الأوامر المتاحة

```bash
npm run dev          # تشغيل التطوير
npm run build        # بناء للإنتاج
npm run preview      # معاينة البناء
npm run lint         # فحص الأكواد
```

### إضافة ميزة جديدة

1. أنشئ مكون جديد في `/components`
2. أضف الترجمات في `/lib/i18n.ts`
3. حدّث التوجيه في `/App.tsx`
4. أضف الأنماط في `/styles/globals.css`

---

## 🐛 حل المشاكل

### المشكلة: لا يمكن تسجيل الدخول
```bash
# الحل:
1. تأكد من تنفيذ schema.sql في Supabase
2. تحقق من المتغيرات البيئية
3. افتح Console للأخطاء
```

### المشكلة: WebAuthn لا يعمل
```bash
# الحل:
1. يجب استخدام HTTPS أو localhost
2. تحقق من دعم المتصفح (Chrome/Edge/Safari)
3. راجع /lib/webauthn.ts
```

### المشكلة: Realtime لا يعمل
```bash
# الحل:
1. تحقق من تفعيل Realtime في Supabase
2. راجع RLS policies
3. تحقق من الاشتراك في القناة الحيحة
```

---

## 📈 الإحصائيات

### الكود
- **10 صفحات React** رئيسية
- **30+ مكون** قابل لإعادة الاستخدام
- **8 جداول** في قاعدة البيانات
- **20+ سياسة RLS** للحماية

### الميزات
- ✅ **100%** متجاوب (Mobile-First)
- ✅ **2 لغات** (عربي/إنجليزي)
- ✅ **2 أوضاع** (فاتح/داكن)
- ✅ **3 أدوار** (Admin/Instructor/Student)
- ✅ **Realtime** Updates
- ✅ **WebAuthn** Biometric

---

## 📝 الترخيص

هذا المشروع تم تطويره كمشروع تخرج لجامعة الملك خالد.

**© 2025 King Khalid University - All Rights Reserved**

---

## 🤝 المساهمة

هذا مشروع أكاديمي مغلق. للاستفسارات:
- Email: support@kku.edu.sa
- Website: www.kku.edu.sa

---

## 🎓 الشكر والتقدير

- **جامعة الملك خالد** - الدعم والإشراف
- **د. أحمد بن محمد** - المشرف الأكاديمي الرئيسي
- **د. منال أبو ملحة** - المشرفة المساعدة
- **فريق التطوير** - التنفيذ والتطوير

---

<a name="en"></a>
## 🇬🇧 Overview

Smart Attendance & Scheduling System is a comprehensive graduation project developed by students at King Khalid University. The project aims to modernize attendance tracking using cutting-edge technologies.

### ✨ Key Features

- ✅ Modern UI with KKU brand identity
- ✅ 100% Responsive design
- ✅ Light/Dark theme
- ✅ Arabic/English support (RTL/LTR)
- ✅ Biometric authentication (WebAuthn)
- ✅ Role-based access control
- ✅ Real-time updates
- ✅ Comprehensive reports
- ✅ Multi-role dashboards

### 🚀 Quick Start

```bash
npm install
npm run dev
```

Visit: `http://localhost:5173`

For detailed documentation, see files in `/docs/`

---

## 📞 Contact

**King Khalid University**
- 📧 Email: support@kku.edu.sa
- 🌐 Website: www.kku.edu.sa
- 📍 Location: Abha, Saudi Arabia

---

<div align="center">

**Made with ❤️ by KKU Students**

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)

**🎓 Smart Attendance System - King Khalid University**  
**© 2025 - Production Ready** ✨

</div>