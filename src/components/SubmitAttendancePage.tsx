import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { CheckCircle, Fingerprint, AlertCircle } from 'lucide-react';
import { Profile, supabase } from '../lib/supabase';
import { Language, useTranslation } from '../lib/i18n';
import { toast } from 'sonner@2.0.3';
import { BackButton } from './BackButton';
import {
  isWebAuthnSupported,
  registerWebAuthn,
  authenticateWebAuthn,
  checkUserHasWebAuthn,
} from '../lib/webauthn';

interface SubmitAttendancePageProps {
  user: Profile;
  onNavigate: (page: string) => void;
  language: Language;
}

export function SubmitAttendancePage({ user, onNavigate, language }: SubmitAttendancePageProps) {
  const { t } = useTranslation(language);
  const [sessionCode, setSessionCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasWebAuthn, setHasWebAuthn] = useState(false);
  const [webAuthnSupported, setWebAuthnSupported] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    checkWebAuthnStatus();
  }, [user.id]);

  const checkWebAuthnStatus = async () => {
    const supported = await isWebAuthnSupported();
    setWebAuthnSupported(supported);

    const hasBio = await checkUserHasWebAuthn(user.id);
    setHasWebAuthn(hasBio);
  };

  const handleEnrollBiometric = async () => {
    if (!webAuthnSupported) {
      toast.error(
        language === 'ar'
          ? 'المتصفح لا يدعم المصادقة البيومترية'
          : 'Browser does not support biometric authentication'
      );
      return;
    }

    setIsEnrolling(true);

    try {
      await registerWebAuthn(user.id, user.full_name);
      toast.success(language === 'ar' ? 'تم تسجيل البصمة بنجاح' : 'Biometric registered successfully');
      setHasWebAuthn(true);
    } catch (error: any) {
      console.error('WebAuthn registration error:', error);
      toast.error(
        language === 'ar'
          ? 'فشل تسجيل البصمة. تأكد من أن جهازك يدعم البصمة'
          : 'Failed to register biometric. Ensure your device supports it'
      );
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleSubmitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionCode.trim()) {
      toast.error(language === 'ar' ? 'يرجى إدخال كود الحضور' : 'Please enter attendance code');
      return;
    }

    setIsLoading(true);

    try {
      // Find session by code
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('code', sessionCode.toUpperCase())
        .single();

      if (sessionError || !session) {
        throw new Error(language === 'ar' ? 'كود غير صحيح' : 'Invalid code');
      }

      // Check if session is still active
      const now = new Date();
      if (new Date(session.ends_at) < now) {
        throw new Error(language === 'ar' ? 'انتهت مدة الجلسة' : 'Session has expired');
      }

      // Check if student already marked attendance
      const { data: existing } = await supabase
        .from('attendance')
        .select('id')
        .eq('session_id', session.id)
        .eq('student_id', user.id)
        .single();

      if (existing) {
        throw new Error(language === 'ar' ? 'تم تسجيل حضورك مسبقاً' : 'Already marked attendance');
      }

      // If session requires WebAuthn, authenticate
      let method = 'code';
      if (session.require_webauthn) {
        if (!hasWebAuthn) {
          throw new Error(
            language === 'ar'
              ? 'يجب تسجيل البصمة أولاً'
              : 'Please enroll biometric first'
          );
        }

        try {
          await authenticateWebAuthn(user.id);
          method = 'webauthn';
        } catch (error) {
          throw new Error(
            language === 'ar'
              ? 'فشلت المصادقة البيومترية'
              : 'Biometric authentication failed'
          );
        }
      }

      // Determine status based on time
      const sessionStart = new Date(session.starts_at);
      const diffMinutes = (now.getTime() - sessionStart.getTime()) / 60000;
      let status = 'present';
      if (diffMinutes > 15) {
        status = 'late';
      }

      // Mark attendance
      const { error: attendanceError } = await supabase.from('attendance').insert({
        session_id: session.id,
        student_id: user.id,
        status,
        method,
        marked_at: now.toISOString(),
      });

      if (attendanceError) throw attendanceError;

      toast.success(
        language === 'ar'
          ? status === 'present'
            ? 'تم تسجيل حضورك بنجاح ✅'
            : 'تم تسجيل حضورك (متأخر) ⚠️'
          : status === 'present'
          ? 'Attendance marked successfully ✅'
          : 'Attendance marked (late) ⚠️'
      );

      setSessionCode('');
      
      // Navigate back to dashboard after 1 second
      setTimeout(() => {
        onNavigate('dashboard');
      }, 1000);
    } catch (error: any) {
      console.error('Attendance submission error:', error);
      toast.error(error.message || (language === 'ar' ? 'فشل تسجيل الحضور' : 'Failed to mark attendance'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <BackButton onClick={() => onNavigate('dashboard')} language={language} />
        <div>
          <h1>{language === 'ar' ? 'تسجيل الحضور' : 'Mark Attendance'}</h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'سجل حضورك باستخدام الكود' : 'Mark your attendance using the code'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmitAttendance} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'كود الحضور' : 'Attendance Code'}</CardTitle>
            <CardDescription>
              {language === 'ar'
                ? 'أدخل الكود الذي أعطاه لك المدرس'
                : 'Enter the code provided by your instructor'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">
                {language === 'ar' ? 'كود الجلسة' : 'Session Code'}
              </Label>
              <Input
                id="code"
                type="text"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                className="text-center text-2xl font-mono tracking-widest"
                maxLength={6}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground text-center">
                {language === 'ar'
                  ? 'الكود مكون من 6 أحرف أو أرقام'
                  : 'Code consists of 6 characters or numbers'}
              </p>
            </div>

            <Button type="submit" className="w-full h-12" disabled={isLoading || !sessionCode}>
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                  {language === 'ar' ? 'جاري التسجيل...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 ml-2" />
                  {language === 'ar' ? 'تأكيد الحضور' : 'Confirm Attendance'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {webAuthnSupported && (
          <Card className={hasWebAuthn ? 'border-success' : 'border-chart-4'}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Fingerprint className={`w-8 h-8 ${hasWebAuthn ? 'text-success' : 'text-chart-4'}`} />
                <div>
                  <CardTitle>
                    {language === 'ar' ? 'المصادقة البيومترية' : 'Biometric Authentication'}
                  </CardTitle>
                  <CardDescription>
                    {hasWebAuthn
                      ? language === 'ar'
                        ? 'تم تفعيل البصمة على حسابك ✅'
                        : 'Biometric enabled on your account ✅'
                      : language === 'ar'
                      ? 'سجّل بصمتك لحضور أسرع وأكثر أماناً'
                      : 'Register your fingerprint for faster attendance'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {hasWebAuthn ? (
                <div className="bg-success/10 border border-success p-4 rounded-lg flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-success" />
                  <div>
                    <p className="font-medium text-success">
                      {language === 'ar' ? 'البصمة مفعلة' : 'Biometric Active'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar'
                        ? 'سيُطلب منك التحقق بالبصمة في الجلسات المحمية'
                        : 'You will be asked to verify for protected sessions'}
                    </p>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  onClick={handleEnrollBiometric}
                  disabled={isEnrolling}
                  variant="outline"
                  className="w-full"
                >
                  {isEnrolling ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin ml-2" />
                      {language === 'ar' ? 'جاري التسجيل...' : 'Enrolling...'}
                    </>
                  ) : (
                    <>
                      <Fingerprint className="w-5 h-5 ml-2" />
                      {t('enrollBiometric')}
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {!webAuthnSupported && (
          <Card className="border-chart-4 bg-chart-4/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-chart-4" />
                <div>
                  <CardTitle>
                    {language === 'ar' ? 'البصمة غير مدعومة' : 'Biometric Not Supported'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'ar'
                      ? 'المتصفح أو الجهاز لا يدعم المصادقة البيومترية'
                      : 'Your browser or device does not support biometric authentication'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {language === 'ar'
                  ? 'للاستفادة من هذه الميزة، استخدم متصفح حديث (Chrome, Edge, Safari) على جهاز يدعم البصمة'
                  : 'To use this feature, use a modern browser (Chrome, Edge, Safari) on a device with biometric support'}
              </p>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
}