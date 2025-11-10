import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle, XCircle, Clock, Calendar, ClipboardList, Fingerprint, BarChart3 } from 'lucide-react';
import { Profile, supabase } from '../lib/supabase';
import { Language, useTranslation } from '../lib/i18n';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { toast } from 'sonner@2.0.3';
import { checkUserHasWebAuthn } from '../lib/webauthn';

interface StudentDashboardProps {
  user: Profile;
  onNavigate: (page: string) => void;
  language: Language;
}

export function StudentDashboard({ user, onNavigate, language }: StudentDashboardProps) {
  const { t } = useTranslation(language);
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    total: 0,
  });
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [todaySchedules, setTodaySchedules] = useState<any[]>([]);
  const [hasWebAuthn, setHasWebAuthn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudentData();
    checkBiometric();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('student-dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance', filter: `student_id=eq.${user.id}` },
        () => {
          loadStudentData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  const checkBiometric = async () => {
    const hasBio = await checkUserHasWebAuthn(user.id);
    setHasWebAuthn(hasBio);
  };

  const loadStudentData = async () => {
    try {
      setLoading(true);

      // Get student's attendance records
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          *,
          sessions(
            *,
            sections(
              *,
              courses(*)
            )
          )
        `)
        .eq('student_id', user.id)
        .order('marked_at', { ascending: false })
        .limit(10);

      if (attendanceError) {
        console.error('Error loading student data:', attendanceError);
        throw attendanceError;
      }
      setRecentAttendance(attendanceData || []);

      // Calculate stats
      const present = attendanceData?.filter((a) => a.status === 'present').length || 0;
      const absent = attendanceData?.filter((a) => a.status === 'absent').length || 0;
      const late = attendanceData?.filter((a) => a.status === 'late').length || 0;
      const total = attendanceData?.length || 0;

      setStats({ present, absent, late, total });

      // Get today's schedule (would need enrollment table for accurate data)
      const today = new Date().getDay();
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('schedules')
        .select(`
          *,
          sections(
            *,
            courses(*)
          )
        `)
        .eq('day_of_week', today)
        .limit(5);

      if (schedulesError) {
        console.error('Error loading schedules:', schedulesError);
      }

      setTodaySchedules(schedulesData || []);
    } catch (error) {
      console.error('Error loading student data:', error);
      toast.error(language === 'ar' ? 'فشل تحميل البيانات' : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const attendanceData = [
    { name: t('present'), value: stats.present, color: '#27AE60' },
    { name: t('absent'), value: stats.absent, color: '#E74C3C' },
    { name: t('late'), value: stats.late, color: '#F39C12' },
  ].filter(item => item.value > 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'absent':
        return <XCircle className="w-5 h-5 text-destructive" />;
      case 'late':
        return <Clock className="w-5 h-5 text-chart-4" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present':
        return t('present');
      case 'absent':
        return t('absent');
      case 'late':
        return t('late');
      case 'excused':
        return t('excused');
      default:
        return status;
    }
  };

  const getDayName = (dayNumber: number) => {
    const days = {
      ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
      en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    };
    return days[language][dayNumber];
  };

  const attendancePercentage = stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0;

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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1>
            {language === 'ar' ? `مرحباً، ${user.full_name}` : `Welcome, ${user.full_name}`}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'لوحة التحكم الخاصة بك' : 'Your Dashboard'}
          </p>
        </div>
        <Button onClick={() => onNavigate('submit-attendance')} className="gap-2">
          <ClipboardList className="w-4 h-4" />
          {t('submitAttendance')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">{t('present')}</CardTitle>
            <div className="bg-success p-2 rounded-lg">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{stats.present}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'ar' ? 'مرة حضور' : 'times present'}
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">{t('absent')}</CardTitle>
            <div className="bg-destructive p-2 rounded-lg">
              <XCircle className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{stats.absent}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'ar' ? 'مرة غياب' : 'times absent'}
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">{t('late')}</CardTitle>
            <div className="bg-chart-4 p-2 rounded-lg">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{stats.late}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'ar' ? 'مرة تأخير' : 'times late'}
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">
              {language === 'ar' ? 'نسبة الحضور' : 'Attendance Rate'}
            </CardTitle>
            <div className="bg-chart-1 p-2 rounded-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{attendancePercentage}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'ar' ? `من ${stats.total} محاضرة` : `out of ${stats.total}`}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('statistics')}</CardTitle>
            <CardDescription>
              {language === 'ar' ? 'توزيع حضورك' : 'Your attendance distribution'}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {attendanceData.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">
                  {language === 'ar' ? 'لا توجد بيانات حضور بعد' : 'No attendance data yet'}
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) =>
                      `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {attendanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'ar' ? 'جدول اليوم' : "Today's Schedule"}
            </CardTitle>
            <CardDescription>
              {getDayName(new Date().getDay())}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todaySchedules.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    {language === 'ar' ? 'لا توجد محاضرات اليوم' : 'No classes today'}
                  </p>
                </div>
              ) : (
                todaySchedules.map((schedule) => (
                  <div key={schedule.id} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{schedule.sections?.courses?.name || (language === 'ar' ? 'غير محدد' : 'Unknown')}</p>
                        <p className="text-sm text-muted-foreground">
                          {schedule.sections?.name || ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        {schedule.start_time} - {schedule.end_time}
                      </span>
                      <span>•</span>
                      <span>{schedule.location || (language === 'ar' ? 'غير محدد' : 'TBA')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {!hasWebAuthn && (
        <Card className="border-chart-4 bg-chart-4/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Fingerprint className="w-8 h-8 text-chart-4" />
              <div>
                <CardTitle>
                  {language === 'ar' ? 'فعّل المصادقة البيومترية' : 'Enable Biometric Auth'}
                </CardTitle>
                <CardDescription>
                  {language === 'ar'
                    ? 'سجّل بصمتك لتسجيل حضور أسرع وأكثر أماناً'
                    : 'Register your fingerprint for faster and more secure attendance'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={() => onNavigate('submit-attendance')} variant="secondary">
              {t('enrollBiometric')}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {language === 'ar' ? 'سجل الحضور الأخير' : 'Recent Attendance'}
          </CardTitle>
          <CardDescription>
            {language === 'ar' ? 'آخر 10 سجلات حضور' : 'Last 10 attendance records'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAttendance.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  {language === 'ar' ? 'لا توجد سجلات حضور بعد' : 'No attendance records yet'}
                </p>
                <Button
                  onClick={() => onNavigate('submit-attendance')}
                  variant="outline"
                  className="mt-4"
                >
                  {t('submitAttendance')}
                </Button>
              </div>
            ) : (
              recentAttendance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(record.status)}
                    <div>
                      <p className="font-medium">
                        {record.sessions?.sections?.courses?.name || (language === 'ar' ? 'غير محدد' : 'Unknown')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(record.marked_at).toLocaleDateString(language, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs ${
                      record.status === 'present'
                        ? 'bg-success/10 text-success'
                        : record.status === 'absent'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-chart-4/10 text-chart-4'
                    }`}
                  >
                    {getStatusLabel(record.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}