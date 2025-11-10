import { useState, useEffect } from 'react';
import { Profile, supabase } from './lib/supabase';
import { Language, getStoredLanguage, setStoredLanguage } from './lib/i18n';
import { AuthPage } from './components/AuthPage';
import { HomePage } from './components/HomePage';
import { AboutPage } from './components/AboutPage';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AdminDashboard } from './components/AdminDashboard';
import { InstructorDashboard } from './components/InstructorDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { CreateSessionPage } from './components/CreateSessionPage';
import { SubmitAttendancePage } from './components/SubmitAttendancePage';
import { ActiveSessionsPage } from './components/ActiveSessionsPage';
import { ReportsPage } from './components/ReportsPage';
import { SchedulesPage } from './components/SchedulesPage';
import { UsersPage } from './components/UsersPage';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button';

type Page =
  | 'home'
  | 'about'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'create-session'
  | 'submit-attendance'
  | 'active-sessions'
  | 'reports'
  | 'schedules'
  | 'users';

export default function App() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [language, setLanguage] = useState<Language>(getStoredLanguage());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await loadUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setCurrentPage('home');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Apply language settings
    setStoredLanguage(language);
  }, [language]);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await loadUserProfile(session.user.id);
        setCurrentPage('dashboard');
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setCurrentUser(profile);
    } catch (error) {
      console.error('Profile load error:', error);
    }
  };

  const handleLogin = (user: Profile) => {
    setCurrentUser(user);
    setCurrentPage('dashboard');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setCurrentPage('home');
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    // Public pages
    if (currentPage === 'home') {
      return <HomePage onNavigate={handleNavigate} language={language} />;
    }

    if (currentPage === 'about') {
      return <AboutPage language={language} />;
    }

    if (currentPage === 'login' || currentPage === 'register') {
      return (
        <AuthPage
          onLogin={handleLogin}
          language={language}
          onLanguageChange={handleLanguageChange}
        />
      );
    }

    // Protected pages - require authentication
    if (!currentUser) {
      return (
        <AuthPage
          onLogin={handleLogin}
          language={language}
          onLanguageChange={handleLanguageChange}
        />
      );
    }

    // Dashboard pages with role-based access control
    switch (currentPage) {
      case 'dashboard':
        // Redirect to role-specific dashboard
        if (currentUser.role === 'supervisor') {
          return <AdminDashboard onNavigate={handleNavigate} language={language} />;
        } else if (currentUser.role === 'teacher') {
          return <InstructorDashboard user={currentUser} onNavigate={handleNavigate} language={language} />;
        } else if (currentUser.role === 'student') {
          return <StudentDashboard user={currentUser} onNavigate={handleNavigate} language={language} />;
        } else {
          // Unknown role - show error
          return (
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center p-6">
                <p className="text-destructive mb-4">
                  {language === 'ar' ? 'دور المستخدم غير معروف' : 'Unknown user role'}
                </p>
                <Button onClick={handleLogout}>
                  {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                </Button>
              </div>
            </div>
          );
        }
      
      case 'create-session':
        // Only teachers can access
        if (currentUser.role === 'teacher') {
          return <CreateSessionPage user={currentUser} onNavigate={handleNavigate} language={language} />;
        }
        // Redirect unauthorized users to their dashboard
        handleNavigate('dashboard');
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center p-6">
              <p className="text-destructive mb-4">
                {language === 'ar' ? 'غير مصرح لك بالوصول لهذه الصفحة' : 'Access denied'}
              </p>
              <Button onClick={() => handleNavigate('dashboard')}>
                {language === 'ar' ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
              </Button>
            </div>
          </div>
        );
      
      case 'submit-attendance':
        // Only students can access
        if (currentUser.role === 'student') {
          return <SubmitAttendancePage user={currentUser} onNavigate={handleNavigate} language={language} />;
        }
        // Redirect unauthorized users to their dashboard
        handleNavigate('dashboard');
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center p-6">
              <p className="text-destructive mb-4">
                {language === 'ar' ? 'غير مصرح لك بالوصول لهذه الصفحة' : 'Access denied'}
              </p>
              <Button onClick={() => handleNavigate('dashboard')}>
                {language === 'ar' ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
              </Button>
            </div>
          </div>
        );
      
      case 'active-sessions':
        // All authenticated users can view active sessions (filtered by role)
        return <ActiveSessionsPage user={currentUser} onNavigate={handleNavigate} language={language} />;
      
      case 'reports':
        // All authenticated users can view reports (filtered by role)
        return <ReportsPage user={currentUser} onNavigate={handleNavigate} language={language} />;
      
      case 'schedules':
        // All authenticated users can view schedules (filtered by role)
        return <SchedulesPage user={currentUser} onNavigate={handleNavigate} language={language} />;
      
      case 'users':
        // Only supervisors can access user management
        if (currentUser.role === 'supervisor') {
          return <UsersPage onNavigate={handleNavigate} language={language} />;
        }
        // Redirect unauthorized users to their dashboard
        handleNavigate('dashboard');
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center p-6">
              <p className="text-destructive mb-4">
                {language === 'ar' ? 'هذه الصفحة متاحة للمشرفين فقط' : 'This page is for supervisors only'}
              </p>
              <Button onClick={() => handleNavigate('dashboard')}>
                {language === 'ar' ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
              </Button>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center p-6">
              <p className="text-muted-foreground mb-4">
                {language === 'ar' ? 'الصفحة غير موجودة' : 'Page not found'}
              </p>
              <Button onClick={() => handleNavigate('dashboard')}>
                {language === 'ar' ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
              </Button>
            </div>
          </div>
        );
    }
  };

  const showFooter = currentPage === 'home' || currentPage === 'about' || currentPage === 'login' || currentPage === 'register';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar
        user={currentUser}
        onLogout={handleLogout}
        language={language}
        onLanguageChange={handleLanguageChange}
        onNavigate={handleNavigate}
      />
      <main className="flex-1">
        {renderPage()}
      </main>
      {showFooter && <Footer language={language} onNavigate={handleNavigate} />}
      <Toaster position="top-center" richColors />
    </div>
  );
}