import { Profile } from '../lib/supabase';
import { Language, useTranslation } from '../lib/i18n';
import { Button } from './ui/button';
import { LogOut, Moon, Sun, GraduationCap, Globe, Menu, X, Home, Users as UsersIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

interface NavbarProps {
  user?: Profile | null;
  onLogout?: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onNavigate?: (page: string) => void;
}

export function Navbar({ user, onLogout, language, onLanguageChange, onNavigate }: NavbarProps) {
  const { t } = useTranslation(language);
  const [isDark, setIsDark] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedTheme = localStorage.getItem('theme');
    const shouldBeDark = storedTheme === 'dark' || (!storedTheme && prefersDark);
    setIsDark(shouldBeDark);
    
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    
    if (newIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const getRoleLabel = (role: string) => {
    if (language === 'ar') {
      switch (role) {
        case 'admin': return 'مدير';
        case 'instructor': return 'مدرس';
        case 'student': return 'طالب';
        default: return role;
      }
    } else {
      switch (role) {
        case 'admin': return 'Admin';
        case 'instructor': return 'Instructor';
        case 'student': return 'Student';
        default: return role;
      }
    }
  };

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm backdrop-blur-sm bg-card/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate?.('home')}>
            <div className="bg-primary rounded-lg p-2">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg leading-tight">{t('systemTitle')}</h1>
              <p className="text-xs text-muted-foreground">{t('universityName')}</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          {!user && (
            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => onNavigate?.('home')}
                className="text-sm hover:text-primary transition-colors flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                {language === 'ar' ? 'الرئيسية' : 'Home'}
              </button>
              <button
                onClick={() => onNavigate?.('about')}
                className="text-sm hover:text-primary transition-colors flex items-center gap-2"
              >
                <UsersIcon className="w-4 h-4" />
                {language === 'ar' ? 'الفريق' : 'Team'}
              </button>
            </div>
          )}

          {/* User Info & Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {user && (
              <div className="text-right hidden sm:block">
                <p className="font-medium text-sm">{user.full_name}</p>
                <p className="text-xs text-muted-foreground">{getRoleLabel(user.role)}</p>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onLanguageChange(language === 'ar' ? 'en' : 'ar')}
              title={language === 'ar' ? 'English' : 'العربية'}
            >
              <Globe className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={isDark ? (language === 'ar' ? 'وضع نهاري' : 'Light mode') : (language === 'ar' ? 'وضع ليلي' : 'Dark mode')}
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>

            {user ? (
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="w-4 h-4 ml-2" />
                <span className="hidden sm:inline">{t('logout')}</span>
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate?.('login')}
                  className="hidden sm:inline-flex"
                >
                  {language === 'ar' ? 'دخول' : 'Login'}
                </Button>
                <Button
                  size="sm"
                  onClick={() => onNavigate?.('register')}
                  className="hidden sm:inline-flex"
                >
                  {language === 'ar' ? 'تسجيل' : 'Register'}
                </Button>
              </>
            )}

            {/* Mobile Menu Button */}
            {!user && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {!user && isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  onNavigate?.('home');
                  setIsMobileMenuOpen(false);
                }}
                className="text-left px-4 py-2 hover:bg-muted rounded-lg transition-colors flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                {language === 'ar' ? 'الرئيسية' : 'Home'}
              </button>
              <button
                onClick={() => {
                  onNavigate?.('about');
                  setIsMobileMenuOpen(false);
                }}
                className="text-left px-4 py-2 hover:bg-muted rounded-lg transition-colors flex items-center gap-2"
              >
                <UsersIcon className="w-4 h-4" />
                {language === 'ar' ? 'الفريق' : 'Team'}
              </button>
              <button
                onClick={() => {
                  onNavigate?.('login');
                  setIsMobileMenuOpen(false);
                }}
                className="text-left px-4 py-2 hover:bg-muted rounded-lg transition-colors"
              >
                {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
              </button>
              <button
                onClick={() => {
                  onNavigate?.('register');
                  setIsMobileMenuOpen(false);
                }}
                className="text-left px-4 py-2 bg-primary text-primary-foreground rounded-lg transition-colors"
              >
                {language === 'ar' ? 'إنشاء حساب' : 'Register'}
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}