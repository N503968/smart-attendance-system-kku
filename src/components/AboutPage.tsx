import { Card, CardContent } from './ui/card';
import { GraduationCap, Users, Award } from 'lucide-react';
import { Language } from '../lib/i18n';

interface AboutPageProps {
  language: Language;
}

export function AboutPage({ language }: AboutPageProps) {
  const isArabic = language === 'ar';

  const teamMembers = [
    {
      name: isArabic ? 'نفيسة محمد صالح' : 'Nafisah Mohammed Saleh',
      studentNumber: '443816488',
      role: isArabic ? 'مطورة رئيسية' : 'Lead Developer',
      initials: 'NS',
      color: 'from-primary to-primary/80',
    },
    {
      name: isArabic ? 'شذى محمد عسيري' : 'Shatha Mohammed Asiri',
      studentNumber: '441807510',
      role: isArabic ? 'مطورة واجهات' : 'Frontend Developer',
      initials: 'SA',
      color: 'from-secondary to-secondary/80',
    },
    {
      name: isArabic ? 'مريم مهدي القحطاني' : 'Maryam Mahdi Alqahtani',
      studentNumber: '441801563',
      role: isArabic ? 'مطورة قواعد البيانات' : 'Database Developer',
      initials: 'MA',
      color: 'from-chart-2 to-chart-2/80',
    },
    {
      name: isArabic ? 'فاطمة غرامة عسيري' : 'Fatimah Gharamah Asiri',
      studentNumber: '442803560',
      role: isArabic ? 'مصممة تجربة المستخدم' : 'UX Designer',
      initials: 'FA',
      color: 'from-chart-3 to-chart-3/80',
    },
    {
      name: isArabic ? 'بشاير محمد الشهراني' : 'Bashaer Mohammed Alshahrani',
      studentNumber: '442807848',
      role: isArabic ? 'محللة نظم' : 'Systems Analyst',
      initials: 'BS',
      color: 'from-chart-4 to-chart-4/80',
    },
  ];

  const supervisors = [
    {
      name: isArabic ? 'د. أحمد بن محمد' : 'Dr. Ahmed Bin Mohammed',
      title: isArabic ? 'المشرف الأكاديمي الرئيسي' : 'Main Academic Supervisor',
      initials: 'AM',
      color: 'from-primary to-secondary',
    },
    {
      name: isArabic ? 'د. منال سعيد بن محمد أبو ملحة' : 'Dr. Manal Saeed Bin Mohammed Abu Malhah',
      title: isArabic ? 'المشرفة المساعدة' : 'Co-Supervisor',
      initials: 'MM',
      color: 'from-secondary to-primary',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-secondary py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <Users className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-5xl md:text-6xl mb-6">
              {isArabic ? 'فريق العمل' : 'Our Team'}
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              {isArabic
                ? 'فريق متميز من طالبات جامعة الملك خالد يعملن على بناء مستقبل التعليم الرقمي'
                : 'An outstanding team from King Khalid University building the future of digital education'}
            </p>
          </div>
        </div>

        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="currentColor"
              className="text-background"
            />
          </svg>
        </div>
      </section>

      {/* Academic Supervision */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Award className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h2 className="text-3xl md:text-4xl mb-4">
              {isArabic ? 'الإشراف الأكاديمي' : 'Academic Supervision'}
            </h2>
            <p className="text-muted-foreground text-lg">
              {isArabic ? 'تحت إشراف نخبة من الأساتذة المتميزين' : 'Under the supervision of distinguished professors'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {supervisors.map((supervisor, index) => (
              <Card
                key={index}
                className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
              >
                <CardContent className="p-8 text-center">
                  <div className={`w-32 h-32 mx-auto mb-6 bg-gradient-to-br ${supervisor.color} rounded-full flex items-center justify-center text-white text-4xl shadow-xl`}>
                    {supervisor.initials}
                  </div>
                  <h3 className="text-2xl mb-2">{supervisor.name}</h3>
                  <p className="text-primary mb-4">{supervisor.title}</p>
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      {isArabic ? 'جامعة الملك خالد' : 'King Khalid University'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Development Team */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h2 className="text-3xl md:text-4xl mb-4">
              {isArabic ? 'فريق التطوير' : 'Development Team'}
            </h2>
            <p className="text-muted-foreground text-lg">
              {isArabic
                ? 'طالبات متحمسات يعملن على تحويل الأفكار إلى واقع'
                : 'Passionate students turning ideas into reality'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
            {teamMembers.map((member, index) => (
              <Card
                key={index}
                className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group"
              >
                <CardContent className="p-6 text-center">
                  <div className={`w-24 h-24 mx-auto mb-4 bg-gradient-to-br ${member.color} rounded-full flex items-center justify-center text-white text-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                    {member.initials}
                  </div>
                  <h3 className="text-lg mb-2 leading-tight">{member.name}</h3>
                  <p className="text-primary text-sm mb-3">{member.role}</p>
                  <div className="pt-3 border-t border-border">
                    <p className="text-xs font-mono text-muted-foreground">
                      {member.studentNumber}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Project Info */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-primary/20">
              <CardContent className="p-8">
                <h2 className="text-3xl mb-6 text-center">
                  {isArabic ? 'عن المشروع' : 'About the Project'}
                </h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    {isArabic
                      ? 'نظام الحضور الذكي هو مشروع تخرج شامل تم تطويره بواسطة فريق من طالبات جامعة الملك خالد. يهدف المشروع إلى تحديث وتطوير عملية تسجيل الحضور في الجامعة من خلال استخدام أحدث التقنيات.'
                      : 'Smart Attendance System is a comprehensive graduation project developed by a team of students from King Khalid University. The project aims to modernize and enhance the attendance process at the university using the latest technologies.'}
                  </p>
                  <p>
                    {isArabic
                      ? 'يتميز النظام بواجهات مستخدم حديثة، دعم كامل للغتين العربية والإنجليزية، نظام مصادقة بيومترية متقدم، وتقارير تفصيلية قابلة للتصدير.'
                      : 'The system features modern user interfaces, full support for Arabic and English, advanced biometric authentication, and detailed exportable reports.'}
                  </p>
                  <div className="pt-6 grid md:grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-3xl text-primary mb-2">2025</div>
                      <div className="text-sm">{isArabic ? 'سنة التطوير' : 'Development Year'}</div>
                    </div>
                    <div>
                      <div className="text-3xl text-primary mb-2">5</div>
                      <div className="text-sm">{isArabic ? 'أعضاء الفريق' : 'Team Members'}</div>
                    </div>
                    <div>
                      <div className="text-3xl text-primary mb-2">100%</div>
                      <div className="text-sm">{isArabic ? 'الإنجاز' : 'Completion'}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Technologies */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl mb-6">
              {isArabic ? 'التقنيات المستخدمة' : 'Technologies Used'}
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                'React',
                'TypeScript',
                'Tailwind CSS',
                'Supabase',
                'PostgreSQL',
                'WebAuthn',
                'Recharts',
              ].map((tech, index) => (
                <div
                  key={index}
                  className="px-6 py-3 bg-background border-2 border-primary/20 rounded-full hover:border-primary/50 transition-colors"
                >
                  {tech}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
