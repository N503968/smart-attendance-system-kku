import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { supabase, Profile } from '../lib/supabase';
import { GraduationCap, Mail, Lock, User, IdCard, Globe, UserCog, Sparkles } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Language, useTranslation } from '../lib/i18n';

interface AuthPageProps {
  onLogin: (user: Profile) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export function AuthPage({ onLogin, language, onLanguageChange }: AuthPageProps) {
  const { t } = useTranslation(language);
  const [isLoading, setIsLoading] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerFullName, setRegisterFullName] = useState('');
  const [registerStudentNumber, setRegisterStudentNumber] = useState('');
  const [registerRole, setRegisterRole] = useState<'student' | 'instructor' | 'admin'>('student');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Sign in with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (authError) {
        // Handle specific auth errors
        if (authError.message.includes('Email not confirmed')) {
          toast.error(
            language === 'ar'
              ? '⚠️ البريد الإلكتروني غير مؤكد. يرجى تعطيل Email Confirmation في Supabase'
              : '⚠️ Email not confirmed. Please disable Email Confirmation in Supabase',
            { duration: 6000 }
          );
          console.error('\n\n❌ EMAIL CONFIRMATION ERROR\n');
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.error('📖 Solution: Open /DO-THIS-NOW.md');
          console.error('🔗 Or go to: https://supabase.com/dashboard/project/bscxhshnubkhngodruuj/settings/auth');
          console.error('⚙️  Find: "Enable email confirmations" and turn it OFF');
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n');
          return;
        }
        throw authError;
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      toast.success(language === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Login successful');
      onLogin(profile);
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(
        language === 'ar'
          ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
          : 'Invalid email or password'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simplified registration - no student number check for testing
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registerEmail,
        password: registerPassword,
        options: {
          data: {
            full_name: registerFullName,
            role: registerRole,
          },
        },
      });

      if (authError) throw authError;

      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user!.id,
        full_name: registerFullName,
        email: registerEmail,
        role: registerRole,
        student_number: registerRole === 'student' && registerStudentNumber ? registerStudentNumber : null,
      });

      if (profileError) {
        // Handle PGRST205 error (table not found)
        if (profileError.code === 'PGRST205') {
          toast.error(
            language === 'ar'
              ? '⚠️ قاعدة البيانات غير جاهزة. يرجى تطبيق Schema من ملف /DO-THIS-NOW.md'
              : '⚠️ Database not ready. Please apply Schema from /DO-THIS-NOW.md',
            { duration: 8000 }
          );
          console.error('\n\n❌ DATABASE SCHEMA ERROR (PGRST205)\n');
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.error('📖 Solution: Open /DO-THIS-NOW.md');
          console.error('🔗 Or go to: https://supabase.com/dashboard/project/bscxhshnubkhngodruuj/sql');
          console.error('📝 Copy content of /supabase-schema.sql and paste it in SQL Editor');
          console.error('▶️  Click Run (Ctrl+Enter)');
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n');
          
          // Delete the auth user since profile creation failed
          await supabase.auth.admin.deleteUser(authData.user!.id);
          return;
        }
        
        // If profile creation fails, delete the auth user
        await supabase.auth.admin.deleteUser(authData.user!.id);
        throw profileError;
      }

      toast.success(
        language === 'ar'
          ? 'تم إنشاء الحساب بنجاح. يمكنك الآن تسجيل الدخول'
          : 'Account created successfully. You can now login'
      );

      // Clear form
      setRegisterEmail('');
      setRegisterPassword('');
      setRegisterFullName('');
      setRegisterStudentNumber('');
      setRegisterRole('student');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Provide helpful error messages
      let errorMessage = error.message;
      
      if (error.code === 'PGRST205') {
        errorMessage = language === 'ar' 
          ? 'قاعدة البيانات غير جاهزة - راجع /QUICK-FIX.md'
          : 'Database not ready - See /QUICK-FIX.md';
      } else if (error.message?.includes('already registered')) {
        errorMessage = language === 'ar'
          ? 'هذا البريد مسجل مسبقاً'
          : 'Email already registered';
      }
      
      toast.error(errorMessage || (language === 'ar' ? 'فشل إنشاء الحساب' : 'Registration failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B3D2E] via-[#1ABC9C] to-[#27AE60]">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-secondary rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-primary rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>
        
        {/* Geometric Patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 border-2 border-white rotate-45"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 border-2 border-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 border-2 border-white"></div>
        </div>
      </div>

      {/* Language Toggle */}
      <div className="absolute top-6 left-6 z-10">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onLanguageChange(language === 'ar' ? 'en' : 'ar')}
          className="gap-2 bg-white/90 hover:bg-white backdrop-blur-sm shadow-lg"
        >
          <Globe className="w-4 h-4" />
          {language === 'ar' ? 'English' : 'العربية'}
        </Button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-2xl border-0 bg-white/95 backdrop-blur-md">
          <CardHeader className="text-center space-y-4 pb-8">
            {/* KKU Logo */}
            <div className="mx-auto relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-full blur-xl opacity-50"></div>
              <div className="relative bg-gradient-to-br from-primary to-secondary rounded-full w-24 h-24 flex items-center justify-center shadow-xl">
                <GraduationCap className="w-14 h-14 text-white" />
              </div>
            </div>
            
            <div>
              <CardTitle className="text-3xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {t('systemTitle')}
              </CardTitle>
              <CardDescription className="mt-2 text-base">
                {t('universityName')}
              </CardDescription>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Sparkles className="w-4 h-4 text-secondary" />
                <span className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'نظام ذكي متطور' : 'Smart Advanced System'}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                <TabsTrigger value="login" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white">
                  {t('login')}
                </TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white">
                  {t('register')}
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="mt-6">
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      {t('email')}
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="h-12 border-2 focus:border-primary transition-colors"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-primary" />
                      {t('password')}
                    </Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder={language === 'ar' ? 'أدخل كلمة المرور' : 'Enter your password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="h-12 border-2 focus:border-primary transition-colors"
                      disabled={isLoading}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all shadow-lg text-base" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {t('loading')}
                      </div>
                    ) : (
                      t('login')
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register" className="mt-6">
                <form onSubmit={handleRegister} className="space-y-5">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="register-name" className="flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      {t('fullName')}
                    </Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder={language === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                      value={registerFullName}
                      onChange={(e) => setRegisterFullName(e.target.value)}
                      required
                      className="h-12 border-2 focus:border-primary transition-colors"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      {t('email')}
                    </Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                      className="h-12 border-2 focus:border-primary transition-colors"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Role Selector */}
                  <div className="space-y-2">
                    <Label htmlFor="register-role" className="flex items-center gap-2">
                      <UserCog className="w-4 h-4 text-primary" />
                      {language === 'ar' ? 'نوع المستخدم' : 'User Role'}
                    </Label>
                    <Select value={registerRole} onValueChange={(value: any) => setRegisterRole(value)}>
                      <SelectTrigger className="h-12 border-2 focus:border-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">
                          {language === 'ar' ? '👨‍🎓 طالب' : '👨‍🎓 Student'}
                        </SelectItem>
                        <SelectItem value="instructor">
                          {language === 'ar' ? '👨‍🏫 مدرس' : '👨‍🏫 Instructor'}
                        </SelectItem>
                        <SelectItem value="admin">
                          {language === 'ar' ? '👤 مشرف' : '👤 Admin'}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {language === 'ar' 
                        ? 'اختر الدور المناسب - سيتم توجيهك للوحة التحكم الخاصة بك'
                        : 'Choose your role - You will be directed to your dashboard'
                      }
                    </p>
                  </div>

                  {/* Student Number (Optional - only for students) */}
                  {registerRole === 'student' && (
                    <div className="space-y-2">
                      <Label htmlFor="register-student-number" className="flex items-center gap-2">
                        <IdCard className="w-4 h-4 text-primary" />
                        {t('studentNumber')} 
                        <span className="text-xs text-muted-foreground">
                          ({language === 'ar' ? 'اختياري' : 'Optional'})
                        </span>
                      </Label>
                      <Input
                        id="register-student-number"
                        type="text"
                        placeholder={language === 'ar' ? 'أدخل رقمك الجامعي (اختياري)' : 'Enter student number (optional)'}
                        value={registerStudentNumber}
                        onChange={(e) => setRegisterStudentNumber(e.target.value)}
                        className="h-12 border-2 focus:border-primary transition-colors"
                        disabled={isLoading}
                      />
                    </div>
                  )}

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-primary" />
                      {t('password')}
                    </Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder={language === 'ar' ? 'أدخل كلمة المرور (6 أحرف على الأقل)' : 'Enter password (min 6 characters)'}
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-12 border-2 focus:border-primary transition-colors"
                      disabled={isLoading}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all shadow-lg text-base" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {t('loading')}
                      </div>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        {t('register')}
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border border-primary/20">
              <p className="text-sm text-center text-muted-foreground">
                {language === 'ar' 
                  ? '🔒 جميع بياناتك محمية ومشفرة بأمان عالي'
                  : '🔒 All your data is protected and encrypted securely'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add animation styles */}
      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}