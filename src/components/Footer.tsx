import { Language } from '../lib/i18n';
import { Mail, MapPin, Globe } from 'lucide-react';

interface FooterProps {
  language: Language;
  onNavigate?: (page: string) => void;
}

export function Footer({ language, onNavigate }: FooterProps) {
  const isArabic = language === 'ar';
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: isArabic ? 'الرئيسية' : 'Home', page: 'home' },
    { label: isArabic ? 'عن الفريق' : 'About Team', page: 'about' },
    { label: isArabic ? 'تسجيل الدخول' : 'Login', page: 'login' },
    { label: isArabic ? 'إنشاء حساب' : 'Register', page: 'register' },
  ];

  const contactInfo = [
    {
      icon: Mail,
      label: 'support@kku.edu.sa',
      href: 'mailto:support@kku.edu.sa',
    },
    {
      icon: MapPin,
      label: isArabic ? 'أبها، المملكة العربية السعودية' : 'Abha, Saudi Arabia',
      href: 'https://maps.google.com',
    },
    {
      icon: Globe,
      label: 'www.kku.edu.sa',
      href: 'https://www.kku.edu.sa',
    },
  ];

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* About Section */}
          <div>
            <h3 className="text-lg mb-4">
              {isArabic ? 'نظام الحضور الذكي' : 'Smart Attendance System'}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {isArabic
                ? 'نظام متكامل لإدارة الحضور والجداول الدراسية في جامعة الملك خالد باستخدام أحدث التقنيات.'
                : 'Complete system for attendance and schedule management at King Khalid University using the latest technologies.'}
            </p>
            <div className="mt-4 flex gap-2">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg mb-4">
              {isArabic ? 'روابط سريعة' : 'Quick Links'}
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => onNavigate?.(link.page)}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg mb-4">
              {isArabic ? 'تواصل معنا' : 'Contact Us'}
            </h3>
            <ul className="space-y-3">
              {contactInfo.map((contact, index) => (
                <li key={index}>
                  <a
                    href={contact.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors text-sm group"
                  >
                    <contact.icon className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span>{contact.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>
              © {currentYear}{' '}
              {isArabic ? 'جامعة الملك خالد. جميع الحقوق محفوظة.' : 'King Khalid University. All rights reserved.'}
            </p>
            <p>
              {isArabic ? 'تم التطوير بواسطة فريق مشروع التخرج' : 'Developed by Graduation Project Team'}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}