# ============================================
# 🚀 أوامر نشر نظام الحضور بالبصمة
# Smart Attendance System - KKU
# PowerShell Script for Windows
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🎓 جامعة الملك خالد - نظام الحضور الذكي" -ForegroundColor Green
Write-Host "🔐 نشر نظام WebAuthn للحضور بالبصمة" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 1. تثبيت Supabase CLI
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "📦 الخطوة 1: تثبيت Supabase CLI" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "تنفيذ: npm install -g supabase" -ForegroundColor White
Write-Host ""
Write-Host "💡 إذا فشل التثبيت، جرب:" -ForegroundColor Cyan
Write-Host "   - scoop install supabase" -ForegroundColor Gray
Write-Host "   - أو استخدم npm كما في الأعلى" -ForegroundColor Gray
Write-Host ""
Read-Host "اضغط Enter بعد تثبيت CLI"
Write-Host ""

# 2. تسجيل الدخول
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🔑 الخطوة 2: تسجيل الدخول إلى Supabase" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "تنفيذ: supabase login" -ForegroundColor White
Write-Host ""
Write-Host "💡 سيفتح المتصفح لتسجيل الدخول" -ForegroundColor Cyan
Write-Host ""
Read-Host "اضغط Enter بعد تسجيل الدخول"
supabase login
Write-Host ""

# 3. ربط المشروع
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🔗 الخطوة 3: ربط المشروع" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "تنفيذ الأمر التالي:" -ForegroundColor White
Write-Host ""
Write-Host "supabase link --project-ref bscxhshnubkhngodruuj" -ForegroundColor Green
Write-Host ""
Read-Host "اضغط Enter لتنفيذ الأمر"
supabase link --project-ref bscxhshnubkhngodruuj
Write-Host ""

# 4. إضافة Service Role Key
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🔐 الخطوة 4: إضافة Service Role Key" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  مطلوب: Service Role Key من Supabase Dashboard" -ForegroundColor Red
Write-Host ""
Write-Host "📍 الخطوات:" -ForegroundColor Cyan
Write-Host "1. افتح: https://supabase.com/dashboard/project/bscxhshnubkhngodruuj/settings/api" -ForegroundColor Gray
Write-Host "2. انسخ 'service_role' key (secret key - NOT anon key)" -ForegroundColor Gray
Write-Host "3. الصق هنا عند الطلب" -ForegroundColor Gray
Write-Host ""
Read-Host "هل حصلت على Service Role Key؟ (اضغط Enter للمتابعة)" 
Write-Host ""
Write-Host "💡 الصق الـ Key بعد الطلب (بدون مسافات)" -ForegroundColor Cyan
Write-Host ""
$SERVICE_KEY = Read-Host "الصق Service Role Key هنا"

if ([string]::IsNullOrWhiteSpace($SERVICE_KEY)) {
    Write-Host "❌ خطأ: لم يتم إدخال Key" -ForegroundColor Red
    Write-Host ""
    Write-Host "يمكنك إضافته يدوياً لاحقاً بتنفيذ:" -ForegroundColor Yellow
    Write-Host "supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-key-here>" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "تنفيذ: supabase secrets set SUPABASE_SERVICE_ROLE_KEY=***" -ForegroundColor White
    supabase secrets set SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY
    Write-Host ""
    Write-Host "✅ تم إضافة Service Role Key بنجاح!" -ForegroundColor Green
}

Write-Host ""
Read-Host "اضغط Enter للمتابعة"
Write-Host ""

# 5. نشر Edge Functions
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🚀 الخطوة 5: نشر Edge Functions" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "سيتم نشر 4 Edge Functions:" -ForegroundColor White
Write-Host "  1. webauthn-register-challenge" -ForegroundColor Gray
Write-Host "  2. webauthn-register-verify" -ForegroundColor Gray
Write-Host "  3. webauthn-assert-challenge" -ForegroundColor Gray
Write-Host "  4. webauthn-assert-verify" -ForegroundColor Gray
Write-Host ""
Read-Host "اضغط Enter لبدء النشر"
Write-Host ""

Write-Host "📤 نشر webauthn-register-challenge..." -ForegroundColor Yellow
supabase functions deploy webauthn-register-challenge
Write-Host ""

Write-Host "📤 نشر webauthn-register-verify..." -ForegroundColor Yellow
supabase functions deploy webauthn-register-verify
Write-Host ""

Write-Host "📤 نشر webauthn-assert-challenge..." -ForegroundColor Yellow
supabase functions deploy webauthn-assert-challenge
Write-Host ""

Write-Host "📤 نشر webauthn-assert-verify..." -ForegroundColor Yellow
supabase functions deploy webauthn-assert-verify
Write-Host ""

# 6. التحقق من النشر
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ الخطوة 6: التحقق من النشر" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "تنفيذ: supabase functions list" -ForegroundColor White
Write-Host ""
supabase functions list
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🎉 انتهى النشر!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ إذا ظهرت جميع Functions أعلاه، النظام جاهز للعمل!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 الخطوات التالية:" -ForegroundColor Yellow
Write-Host "  1. افتح الموقع في المتصفح" -ForegroundColor Gray
Write-Host "  2. سجل دخول كطالب" -ForegroundColor Gray
Write-Host "  3. اذهب إلى 'تسجيل الحضور'" -ForegroundColor Gray
Write-Host "  4. اضغط 'تفعيل البصمة'" -ForegroundColor Gray
Write-Host "  5. اتبع التعليمات" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 للمساعدة، راجع:" -ForegroundColor Cyan
Write-Host "  - QUICK-START-WEBAUTHN.md" -ForegroundColor Gray
Write-Host "  - database/BIOMETRIC-USER-GUIDE-AR.md" -ForegroundColor Gray
Write-Host ""
Write-Host "💚 بالتوفيق لجامعة الملك خالد! 🎓" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "اضغط Enter للإنهاء"
