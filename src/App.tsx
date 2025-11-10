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
import { UserManagementPage } from './components/UserManagementPage';
import { CreateCoursePage } from './components/CreateCoursePage';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button';
import { toast } from 'sonner';

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
  | 'users'
  | 'create-course';

export default function App() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [language, setLanguage] = useState<Language>(getStoredLanguage());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session with timeout
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.error('Session check timeout');
        setLoadError('timeout');
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout

    checkSession().finally(() => {
      clearTimeout(timeoutId);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session) {
        try {
          await loadUserProfile(session.user.id);
          setCurrentPage('dashboard');
        } catch (error) {
          console.error('Profile load error on sign in:', error);
          toast.error(language === 'ar' ? 'فشل في تحميل بيانات المستخدم' : 'Failed to load user data');
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setCurrentPage('home');
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      }
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Apply language settings
    setStoredLanguage(language);
  }, [language]);

  const checkSession = async () => {
    try {
      setLoadError(null);
      console.log('Checking session...');
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw sessionError;
      }
      
      if (session) {
        console.log('Session found, loading profile...');
        await loadUserProfile(session.user.id);
        setCurrentPage('dashboard');
      } else {
        console.log('No session found');
      }
    } catch (error) {
      console.error('Session check error:', error);
      setLoadError(error instanceof Error ? error.message : 'unknown');
      // Don't block the app, just log the error
      // User can still navigate to login
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('Loading profile for user:', userId);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Profile query error:', error);
        throw error;
      }
      
      if (!profile) {
        throw new Error('Profile not found');
      }
      
      console.log('Profile loaded:', profile.role);
      setCurrentUser(profile);
    } catch (error) {
      console.error('Profile load error:', error);
      // If profile doesn't exist, sign out the user
      await supabase.auth.signOut();
      throw error;
    }
  };

  const handleLogin = (user: Profile) => {
    setCurrentUser(user);
    setCurrentPage('dashboard');
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setCurrentPage('home');
      toast.success(language === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error(language === 'ar' ? 'فشل تسجيل الخروج' : 'Logout failed');
    }
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  // Loading state with timeout error
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-6">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground mb-2">
            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </p>
          <p className="text-sm text-muted-foreground">
            {language === 'ar' 
              ? 'يرجى الانتظار بينما نقوم بتحميل البيانات' 
              : 'Please wait while we load your data'}
          </p>
        </div>
      </div>
    );
  }

  // Error state with retry option
  if (loadError && loadError !== 'timeout') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-6">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">
            {language === 'ar' ? 'خطأ في الاتصال' : 'Connection Error'}
          </h2>
          <p className="text-muted-foreground mb-4">
            {language === 'ar' 
              ? 'فشل الاتصال بقاعدة البيانات. يرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى.' 
              : 'Failed to connect to the database. Please check your internet connection and try again.'}
          </p>
          <Button onClick={() => window.location.reload()}>
            {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
          </Button>
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
          return <UserManagementPage currentUser={currentUser} onBack={() => handleNavigate('dashboard')} language={language} />;
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
      
      case 'create-course':
        // Teachers and supervisors can create courses
        if (currentUser.role === 'teacher' || currentUser.role === 'supervisor') {
          return <CreateCoursePage user={currentUser} onBack={() => handleNavigate('dashboard')} language={language} />;
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