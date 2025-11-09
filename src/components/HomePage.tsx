import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { 
  GraduationCap, 
  Fingerprint, 
  BarChart3, 
  Shield, 
  Zap, 
  Users,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Calendar,
  Clock
} from 'lucide-react';
import { Language } from '../lib/i18n';

interface HomePageProps {
  onNavigate: (page: string) => void;
  language: Language;
}

export function HomePage({ onNavigate, language }: HomePageProps) {
  const isArabic = language === 'ar';

  const features = [
    {
      icon: Fingerprint,
      title: isArabic ? 'بصمة بيومترية' : 'Biometric Authentication',
      description: isArabic 
        ? 'تسجيل حضور آمن باستخدام تقنية WebAuthn المتقدمة'
        : 'Secure attendance using advanced WebAuthn technology',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Zap,
      title: isArabic ? 'تحديثات فورية' : 'Real-time Updates',
      description: isArabic
        ? 'متابعة الحضور والجداول بشكل مباشر ولحظي'
        : 'Monitor attendance and schedules instantly',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: BarChart3,
      title: isArabic ? 'تقارير ذكية' : 'Smart Reports',
      description: isArabic
        ? 'تحليلات شامل�� وتقارير قابلة للتصدير'
        : 'Comprehensive analytics and exportable reports',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Shield,
      title: isArabic ? 'أمان عالي' : 'High Security',
      description: isArabic
        ? 'حماية متعددة المستويات لجميع البيانات'
        : 'Multi-level protection for all data',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Users,
      title: isArabic ? 'إدارة متقدمة' : 'Advanced Management',
      description: isArabic
        ? 'لوحات تحكم مخصصة لكل دور (طالب، مدرس، مشرف)'
        : 'Custom dashboards for each role (Student, Instructor, Admin)',
      color: 'from-red-500 to-rose-500'
    },
    {
      icon: Calendar,
      title: isArabic ? 'جداول ذكية' : 'Smart Schedules',
      description: isArabic
        ? 'إدارة وعرض الجداول الدراسية بسهولة'
        : 'Easy management and display of academic schedules',
      color: 'from-indigo-500 to-blue-500'
    },
  ];

  const stats = [
    { value: '99.9%', label: isArabic ? 'وقت التشغيل' : 'Uptime' },
    { value: '<2s', label: isArabic ? 'وقت التحميل' : 'Load Time' },
    { value: '24/7', label: isArabic ? 'الإتاحة' : 'Availability' },
  ];

  const steps = [
    {
      number: '1',
      title: isArabic ? 'التسجيل' : 'Register',
      description: isArabic ? 'أنشئ حسابك واختر دورك' : 'Create account and choose your role',
      icon: Users
    },
    {
      number: '2',
      title: isArabic ? 'الإعداد' : 'Setup',
      description: isArabic ? 'فعّل البصمة البيومترية' : 'Activate biometric authentication',
      icon: Fingerprint
    },
    {
      number: '3',
      title: isArabic ? 'الاستخدام' : 'Use',
      description: isArabic ? 'سجل الحضور بسهولة وأمان' : 'Mark attendance easily and securely',
      icon: CheckCircle
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-secondary/10">
      {/* Hero Section with Advanced Design */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0B3D2E] via-[#1ABC9C] to-[#27AE60] text-white">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
            <div className="absolute top-20 left-20 w-32 h-32 border border-white/20 rotate-45 animate-spin-slow"></div>
            <div className="absolute bottom-20 right-20 w-40 h-40 border border-white/20 rounded-full animate-pulse"></div>
            <div className="absolute top-1/3 right-1/4 w-24 h-24 border border-white/20 animate-bounce-slow"></div>
          </div>
        </div>

        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Logo */}
            <div className="inline-flex">
              <div className="relative">
                <div className="absolute inset-0 bg-white/30 rounded-full blur-2xl"></div>
                <div className="relative bg-white/20 backdrop-blur-md rounded-full p-6 border border-white/30">
                  <GraduationCap className="w-20 h-20" />
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl leading-tight">
                {isArabic ? 'نظام الحضور الذكي' : 'Smart Attendance System'}
              </h1>
              <p className="text-xl md:text-2xl text-white/90">
                {isArabic ? 'جامعة الملك خالد' : 'King Khalid University'}
              </p>
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                <p className="text-lg text-white/80">
                  {isArabic ? 'تقنية متقدمة • أمان عالي • سهولة استخدام' : 'Advanced Tech • High Security • Easy to Use'}
                </p>
                <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto pt-8">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all">
                  <div className="text-3xl md:text-4xl mb-2">{stat.value}</div>
                  <div className="text-sm text-white/80">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button
                size="lg"
                onClick={() => onNavigate('register')}
                className="bg-white text-primary hover:bg-white/90 shadow-2xl h-14 px-8 text-lg group"
              >
                <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                {isArabic ? 'إنشاء حساب' : 'Create Account'}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                onClick={() => onNavigate('login')}
                variant="outline"
                className="bg-transparent border-2 border-white text-white hover:bg-white/20 h-14 px-8 text-lg backdrop-blur-sm"
              >
                {isArabic ? 'تسجيل الدخول' : 'Login'}
              </Button>
            </div>
          </div>
        </div>

        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-20">
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="currentColor"
              className="text-background"
            />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">{isArabic ? 'المميزات' : 'Features'}</span>
            </div>
            <h2 className="text-3xl md:text-5xl">
              {isArabic ? 'لماذا نظامنا؟' : 'Why Our System?'}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {isArabic
                ? 'نقدم أحدث التقنيات لإدارة الحضور والجداول الدراسية'
                : 'We provide the latest technologies for managing attendance and academic schedules'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/50 overflow-hidden"
              >
                <CardContent className="p-6 space-y-4">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.color} shadow-lg group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl group-hover:text-primary transition-colors">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{isArabic ? 'كيف يعمل' : 'How It Works'}</span>
            </div>
            <h2 className="text-3xl md:text-5xl">
              {isArabic ? 'ابدأ في 3 خطوات بسيطة' : 'Get Started in 3 Simple Steps'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="relative group">
                <Card className="h-full hover:shadow-xl transition-all hover:-translate-y-1 border-2">
                  <CardContent className="p-8 text-center space-y-6">
                    <div className="relative inline-flex">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                      <div className="relative bg-gradient-to-br from-primary to-secondary rounded-full w-20 h-20 flex items-center justify-center text-white shadow-xl">
                        <step.icon className="w-10 h-10" />
                      </div>
                      <div className="absolute -top-2 -right-2 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg border-2 border-primary">
                        <span className="text-primary">{step.number}</span>
                      </div>
                    </div>
                    <h3 className="text-xl">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </CardContent>
                </Card>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-8 h-8 text-primary" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary via-secondary to-[#27AE60] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-white rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
        </div>
        
        <div className="container mx-auto text-center relative z-10 max-w-3xl">
          <div className="space-y-8">
            <Sparkles className="w-16 h-16 mx-auto animate-bounce" />
            <h2 className="text-3xl md:text-5xl">
              {isArabic ? 'جاهز للبدء؟' : 'Ready to Get Started?'}
            </h2>
            <p className="text-xl text-white/90">
              {isArabic
                ? 'انضم إلى آلاف الطلاب والمدرسين الذين يستخدمون نظامنا يومياً'
                : 'Join thousands of students and instructors using our system daily'}
            </p>
            <Button
              size="lg"
              onClick={() => onNavigate('register')}
              className="bg-white text-primary hover:bg-white/90 shadow-2xl h-16 px-12 text-lg group"
            >
              <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
              {isArabic ? 'ابدأ الآن مجاناً' : 'Start Now for Free'}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}