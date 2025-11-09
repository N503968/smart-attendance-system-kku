import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Clock, Calendar, MapPin, Fingerprint, CheckCircle, XCircle } from 'lucide-react';
import { Profile, supabase } from '../lib/supabase';
import { Language, useTranslation } from '../lib/i18n';
import { toast } from 'sonner@2.0.3';
import { BackButton } from './BackButton';
import { BiometricAttendance } from './BiometricAttendance';

interface ActiveSessionsPageProps {
  user: Profile;
  onNavigate: (page: string) => void;
  language: Language;
}

interface SessionWithDetails {
  id: string;
  code: string;
  starts_at: string;
  ends_at: string;
  require_webauthn: boolean;
  section: {
    name: string;
    course: {
      name: string;
      code: string;
    };
  };
  schedule: {
    location: string;
  };
  hasAttended?: boolean;
  attendanceStatus?: string;
}

export function ActiveSessionsPage({ user, onNavigate, language }: ActiveSessionsPageProps) {
  const { t } = useTranslation(language);
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<SessionWithDetails | null>(null);

  useEffect(() => {
    loadActiveSessions();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('active-sessions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions' },
        () => {
          loadActiveSessions();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance', filter: `student_id=eq.${user.id}` },
        () => {
          loadActiveSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  const loadActiveSessions = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      // Get today's active sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          *,
          section:sections(
            name,
            course:courses(name, code)
          )
        `)
        .gte('ends_at', now.toISOString())
        .gte('starts_at', todayStart.toISOString())
        .order('starts_at', { ascending: true });

      if (sessionsError) throw sessionsError;

      // Check attendance for each session
      const sessionsWithAttendance = await Promise.all(
        (sessionsData || []).map(async (session) => {
          const { data: attendance } = await supabase
            .from('attendance')
            .select('id, status')
            .eq('session_id', session.id)
            .eq('student_id', user.id)
            .single();

          return {
            ...session,
            hasAttended: !!attendance,
            attendanceStatus: attendance?.status,
          };
        })
      );

      setSessions(sessionsWithAttendance);
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast.error(language === 'ar' ? 'فشل تحميل الجلسات' : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const getSessionStatus = (session: SessionWithDetails) => {
    const now = new Date();
    const start = new Date(session.starts_at);
    const end = new Date(session.ends_at);

    if (now < start) {
      return { label: language === 'ar' ? 'قادمة' : 'Upcoming', color: 'text-chart-1' };
    } else if (now >= start && now <= end) {
      return { label: language === 'ar' ? 'نشطة الآن' : 'Active Now', color: 'text-success' };
    } else {
      return { label: language === 'ar' ? 'منتهية' : 'Ended', color: 'text-muted-foreground' };
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(language, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <BackButton onClick={() => onNavigate('dashboard')} language={language} />
        <div>
          <h1>{language === 'ar' ? 'الجلسات النشطة' : 'Active Sessions'}</h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'سجل حضورك في الجلسات المتاحة' : 'Mark your attendance in available sessions'}
          </p>
        </div>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="mb-2">
              {language === 'ar' ? 'لا توجد جلسات نشطة' : 'No Active Sessions'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {language === 'ar'
                ? 'لا توجد جلسات متاحة للحضور في الوقت الحالي'
                : 'There are no sessions available for attendance at this time'}
            </p>
            <Button onClick={() => onNavigate('submit-attendance')} variant="outline">
              {language === 'ar' ? 'أدخل كود الحضور يدوياً' : 'Enter Attendance Code Manually'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sessions.map((session) => {
            const status = getSessionStatus(session);
            const isActive = status.label === (language === 'ar' ? 'نشطة الآن' : 'Active Now');

            return (
              <Card
                key={session.id}
                className={`${
                  isActive && !session.hasAttended
                    ? 'border-success shadow-lg'
                    : session.hasAttended
                    ? 'border-muted bg-muted/20'
                    : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="mb-1">
                        {session.section?.course?.name || language === 'ar' ? 'غير محدد' : 'Unknown'}
                      </CardTitle>
                      <CardDescription>
                        {session.section?.course?.code} - {session.section?.name}
                      </CardDescription>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        isActive
                          ? 'bg-success/10 text-success'
                          : session.hasAttended
                          ? 'bg-chart-1/10 text-chart-1'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {status.label}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>
                        {formatTime(session.starts_at)} - {formatTime(session.ends_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{language === 'ar' ? 'القاعة' : 'Room'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'كود الحضور:' : 'Attendance Code:'}
                    </span>
                    <span className="font-mono font-bold text-xl">{session.code}</span>
                  </div>

                  {session.require_webauthn && (
                    <div className="flex items-center gap-2 text-xs text-chart-4">
                      <Fingerprint className="w-4 h-4" />
                      <span>
                        {language === 'ar'
                          ? 'هذه الجلسة تتطلب التحقق بالبصمة'
                          : 'This session requires biometric verification'}
                      </span>
                    </div>
                  )}

                  {session.hasAttended ? (
                    <div className="bg-success/10 border border-success p-4 rounded-lg flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-success" />
                      <div>
                        <p className="font-medium text-success">
                          {language === 'ar' ? 'تم تسجيل حضورك' : 'Attendance Marked'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {language === 'ar' ? 'الحالة:' : 'Status:'}{' '}
                          {session.attendanceStatus === 'present'
                            ? language === 'ar'
                              ? 'حاضر'
                              : 'Present'
                            : language === 'ar'
                            ? 'متأخر'
                            : 'Late'}
                        </p>
                      </div>
                    </div>
                  ) : isActive ? (
                    <div className="space-y-2">
                      {selectedSession?.id === session.id ? (
                        <BiometricAttendance
                          user={user}
                          sessionId={session.id}
                          sessionCode={session.code}
                          language={language}
                          onSuccess={() => {
                            setSelectedSession(null);
                            loadActiveSessions();
                          }}
                        />
                      ) : (
                        <Button
                          onClick={() => setSelectedSession(session)}
                          className="w-full"
                        >
                          <Fingerprint className="w-4 h-4 ml-2" />
                          {language === 'ar' ? 'تسجيل الحضور بالبصمة' : 'Mark Attendance with Biometric'}
                        </Button>
                      )}
                      <Button
                        onClick={() => onNavigate('submit-attendance')}
                        variant="outline"
                        className="w-full"
                      >
                        {language === 'ar' ? 'تسجيل بالكود' : 'Mark with Code'}
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-muted/50 border border-muted p-4 rounded-lg flex items-center gap-3">
                      <XCircle className="w-6 h-6 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar'
                          ? 'لا يمكن تسجيل الحضور في الوقت الحالي'
                          : 'Cannot mark attendance at this time'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
