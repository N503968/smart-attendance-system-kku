#!/bin/bash

# ============================================
# 🚀 أوامر نشر نظام الحضور بالبصمة
# Smart Attendance System - KKU
# ============================================

echo "============================================"
echo "🎓 جامعة الملك خالد - نظام الحضور الذكي"
echo "🔐 نشر نظام WebAuthn للحضور بالبصمة"
echo "============================================"
echo ""

# 1. تثبيت Supabase CLI
echo "📦 الخطوة 1: تثبيت Supabase CLI..."
echo "تنفيذ: npm install -g supabase"
echo ""
echo "💡 إذا فشل التثبيت، جرب:"
echo "   - على Windows: scoop install supabase"
echo "   - على macOS: brew install supabase/tap/supabase"
echo ""
read -p "اضغط Enter بعد تثبيت CLI..."
echo ""

# 2. تسجيل الدخول
echo "============================================"
echo "🔑 الخطوة 2: تسجيل الدخول إلى Supabase"
echo "============================================"
echo ""
echo "تنفيذ: supabase login"
echo ""
echo "💡 سيفتح المتصفح لتسجيل الدخول"
echo ""
read -p "اضغط Enter بعد تسجيل الدخول..."
supabase login
echo ""

# 3. ربط المشروع
echo "============================================"
echo "🔗 الخطوة 3: ربط المشروع"
echo "============================================"
echo ""
echo "تنفيذ الأمر التالي:"
echo ""
echo "supabase link --project-ref bscxhshnubkhngodruuj"
echo ""
read -p "اضغط Enter لتنفيذ الأمر..."
supabase link --project-ref bscxhshnubkhngodruuj
echo ""

# 4. إضافة Service Role Key
echo "============================================"
echo "🔐 الخطوة 4: إضافة Service Role Key"
echo "============================================"
echo ""
echo "⚠️  مطلوب: Service Role Key من Supabase Dashboard"
echo ""
echo "📍 الخطوات:"
echo "1. افتح: https://supabase.com/dashboard/project/bscxhshnubkhngodruuj/settings/api"
echo "2. انسخ 'service_role' key (secret key - NOT anon key)"
echo "3. الصق هنا عند الطلب"
echo ""
read -p "هل حصلت على Service Role Key؟ (اضغط Enter للمتابعة)" 
echo ""
echo "💡 الصق الـ Key بعد علامة = مباشرة (بدون مسافات)"
echo ""
read -p "الصق Service Role Key هنا: " SERVICE_KEY

if [ -z "$SERVICE_KEY" ]; then
    echo "❌ خطأ: لم يتم إدخال Key"
    echo ""
    echo "يمكنك إضافته يدوياً لاحقاً بتنفيذ:"
    echo "supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-key-here>"
else
    echo ""
    echo "تنفيذ: supabase secrets set SUPABASE_SERVICE_ROLE_KEY=***"
    supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$SERVICE_KEY"
    echo ""
    echo "✅ تم إضافة Service Role Key بنجاح!"
fi

echo ""
read -p "اضغط Enter للمتابعة..."
echo ""

# 5. نشر Edge Functions
echo "============================================"
echo "🚀 الخطوة 5: نشر Edge Functions"
echo "============================================"
echo ""
echo "سيتم نشر 4 Edge Functions:"
echo "  1. webauthn-register-challenge"
echo "  2. webauthn-register-verify"
echo "  3. webauthn-assert-challenge"
echo "  4. webauthn-assert-verify"
echo ""
read -p "اضغط Enter لبدء النشر..."
echo ""

echo "📤 نشر webauthn-register-challenge..."
supabase functions deploy webauthn-register-challenge
echo ""

echo "📤 نشر webauthn-register-verify..."
supabase functions deploy webauthn-register-verify
echo ""

echo "📤 نشر webauthn-assert-challenge..."
supabase functions deploy webauthn-assert-challenge
echo ""

echo "📤 نشر webauthn-assert-verify..."
supabase functions deploy webauthn-assert-verify
echo ""

# 6. التحقق من النشر
echo "============================================"
echo "✅ الخطوة 6: التحقق من النشر"
echo "============================================"
echo ""
echo "تنفيذ: supabase functions list"
echo ""
supabase functions list
echo ""

echo "============================================"
echo "🎉 انتهى النشر!"
echo "============================================"
echo ""
echo "✅ إذا ظهرت جميع Functions أعلاه، النظام جاهز للعمل!"
echo ""
echo "📝 الخطوات التالية:"
echo "  1. افتح الموقع في المتصفح"
echo "  2. سجل دخول كطالب"
echo "  3. اذهب إلى 'تسجيل الحضور'"
echo "  4. اضغط 'تفعيل البصمة'"
echo "  5. اتبع التعليمات"
echo ""
echo "📚 للمساعدة، راجع:"
echo "  - QUICK-START-WEBAUTHN.md"
echo "  - database/BIOMETRIC-USER-GUIDE-AR.md"
echo ""
echo "💚 بالتوفيق لجامعة الملك خالد! 🎓"
echo "============================================"
