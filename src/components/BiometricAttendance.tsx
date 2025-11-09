import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Fingerprint, CheckCircle, AlertCircle } from 'lucide-react';
import { Profile, supabase } from '../lib/supabase';
import { Language } from '../lib/i18n';
import { toast } from 'sonner@2.0.3';
import { authenticateWebAuthn, checkUserHasWebAuthn } from '../lib/webauthn';

interface BiometricAttendanceProps {
  user: Profile;
  sessionId: string;
  sessionCode: string;
  language: Language;
  onSuccess: () => void;
}

export function BiometricAttendance({
  user,
  sessionId,
  sessionCode,
  language,
  onSuccess,
}: BiometricAttendanceProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasWebAuthn, setHasWebAuthn] = useState(false);

  useEffect(() => {
    checkBiometric();
  }, [user.id]);

  const checkBiometric = async () => {
    const hasBio = await checkUserHasWebAuthn(user.id);
    setHasWebAuthn(hasBio);
  };

  const handleBiometricAttendance = async () => {
    if (!hasWebAuthn) {
      toast.error(
        language === 'ar'
          ? 'يجب تسجيل البصمة أولاً'
          : 'Please enroll biometric first'
      );
      return;
    }

    setIsProcessing(true);

    try {
      // Authenticate using WebAuthn
      const result = await authenticateWebAuthn(user.id);

      if (!result.success) {
        throw new Error(language === 'ar' ? 'فشلت المصادقة' : 'Authentication failed');
      }

      // Get session details
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        throw new Error(language === 'ar' ? 'الجلسة غير موجودة' : 'Session not found');
      }

      // Check if session is still active
      const now = new Date();
      if (new Date(session.ends_at) < now) {
        throw new Error(language === 'ar' ? 'انتهت مدة الجلسة' : 'Session has expired');
      }

      // Check if already marked
      const { data: existing } = await supabase
        .from('attendance')
        .select('id')
        .eq('session_id', sessionId)
        .eq('student_id', user.id)
        .single();

      if (existing) {
        throw new Error(
          language === 'ar' ? 'تم تسجيل حضورك مسبقاً' : 'Already marked attendance'
        );
      }

      // Determine status based on time
      const sessionStart = new Date(session.starts_at);
      const diffMinutes = (now.getTime() - sessionStart.getTime()) / 60000;
      const status = diffMinutes > 15 ? 'late' : 'present';

      // Mark attendance with WebAuthn method
      const { error: attendanceError } = await supabase.from('attendance').insert({
        session_id: sessionId,
        student_id: user.id,
        status,
        method: 'webauthn',
        marked_at: now.toISOString(),
      });

      if (attendanceError) throw attendanceError;

      toast.success(
        language === 'ar'
          ? status === 'present'
            ? '✅ تم تسجيل حضورك بالبصمة بنجاح'
            : '⚠️ تم تسجيل حضورك (متأخر) بالبصمة'
          : status === 'present'
          ? '✅ Biometric attendance marked successfully'
          : '⚠️ Biometric attendance marked (late)'
      );

      onSuccess();
    } catch (error: any) {
      console.error('Biometric attendance error:', error);
      toast.error(
        error.message ||
          (language === 'ar'
            ? 'فشل تسجيل الحضور بالبصمة'
            : 'Failed to mark biometric attendance')
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (!hasWebAuthn) {
    return null;
  }

  return (
    <Card className="border-success bg-success/5">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="bg-success p-3 rounded-full">
            <Fingerprint className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle>
              {language === 'ar' ? 'تسجيل الحضور بالبصمة' : 'Biometric Attendance'}
            </CardTitle>
            <CardDescription>
              {language === 'ar'
                ? 'سجل حضورك بشكل أسرع وأكثر أماناً'
                : 'Mark your attendance faster and more securely'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {language === 'ar' ? 'كود الجلسة:' : 'Session Code:'}
            </span>
            <span className="font-mono font-bold text-lg">{sessionCode}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {language === 'ar'
              ? 'اضغط على الزر أدناه لتسجيل حضورك بالبصمة'
              : 'Press the button below to mark attendance with biometric'}
          </p>
        </div>

        <Button
          onClick={handleBiometricAttendance}
          disabled={isProcessing}
          className="w-full h-12 bg-success hover:bg-success/90"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
              {language === 'ar' ? 'جاري التحقق من البصمة...' : 'Verifying biometric...'}
            </>
          ) : (
            <>
              <Fingerprint className="w-5 h-5 ml-2" />
              {language === 'ar' ? 'تسجيل الحضور بالبصمة' : 'Mark Attendance with Biometric'}
            </>
          )}
        </Button>

        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
          <p>
            {language === 'ar'
              ? 'لن تحتاج إلى إدخال الكود يدوياً، فقط ضع بصمتك للتحقق'
              : "No need to enter code manually, just verify with your fingerprint"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}