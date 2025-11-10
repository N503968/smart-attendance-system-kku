import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { BookOpen, Calendar, Users, ClipboardList, Plus } from 'lucide-react';
import { Profile, supabase } from '../lib/supabase';
import { Language, useTranslation } from '../lib/i18n';
import { toast } from 'sonner@2.0.3';

interface InstructorDashboardProps {
  user: Profile;
  onNavigate: (page: string) => void;
  language: Language;
}

export function InstructorDashboard({ user, onNavigate, language }: InstructorDashboardProps) {
  const { t } = useTranslation(language);
  const [courses, setCourses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [todaySchedules, setTodaySchedules] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    activeSessions: 0,
    totalStudents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInstructorData();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('instructor-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => {
        loadInstructorData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
        loadInstructorData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  const loadInstructorData = async () => {
    try {
      setLoading(true);

      // Get instructor's courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('instructor_id', user.id);

      if (coursesError) throw coursesError;
      setCourses(coursesData || []);

      const courseIds = coursesData?.map(c => c.id) || [];

      // Get sections for instructor's courses
      let sectionsData: any[] = [];
      if (courseIds.length > 0) {
        const { data: sectionsList, error: sectionsError } = await supabase
          .from('sections')
          .select('id, course_id, name')
          .in('course_id', courseIds);

        if (sectionsError) throw sectionsError;
        sectionsData = sectionsList || [];
      }

      const sectionIds = sectionsData.map(s => s.id);

      // Get active sessions for instructor's sections
      let sessionsData: any[] = [];
      if (sectionIds.length > 0) {
        const { data: sessionsList, error: sessionsError } = await supabase
          .from('sessions')
          .select('*')
          .in('section_id', sectionIds)
          .gte('ends_at', new Date().toISOString())
          .order('starts_at', { ascending: false })
          .limit(5);

        if (sessionsError) throw sessionsError;
        
        // Manually join with sections and courses data
        sessionsData = (sessionsList || []).map(session => {
          const section = sectionsData.find(s => s.id === session.section_id);
          const course = coursesData?.find(c => c.id === section?.course_id);
          return {
            ...session,
            section: section ? {
              ...section,
              course: course || null
            } : null
          };
        });
      }

      setSessions(sessionsData);

      // Get today's schedules
      const today = new Date().getDay();
      let schedulesData: any[] = [];
      if (sectionIds.length > 0) {
        const { data: schedulesList, error: schedulesError } = await supabase
          .from('schedules')
          .select('*')
          .in('section_id', sectionIds)
          .eq('day_of_week', today);

        if (schedulesError) throw schedulesError;
        
        // Manually join with sections and courses data
        schedulesData = (schedulesList || []).map(schedule => {
          const section = sectionsData.find(s => s.id === schedule.section_id);
          const course = coursesData?.find(c => c.id === section?.course_id);
          return {
            ...schedule,
            section: section ? {
              ...section,
              course: course || null
            } : null
          };
        });
      }

      setTodaySchedules(schedulesData);

      // Calculate stats
      const activeSessions = sessionsData?.filter(
        (s) => new Date(s.ends_at) > new Date()
      ).length || 0;

      setStats({
        totalCourses: coursesData?.length || 0,
        activeSessions,
        totalStudents: 0, // Would need enrollment table
      });
    } catch (error) {
      console.error('Error loading instructor data:', error);
      toast.error(language === 'ar' ? 'فشل تحميل البيانات' : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (dayNumber: number) => {
    const days = {
      ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
      en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    };
    return days[language][dayNumber];
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1>
            {language === 'ar' ? `مرحباً، ${user.full_name}` : `Welcome, ${user.full_name}`}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'لوحة تحكم المدرس' : 'Instructor Dashboard'}
          </p>
        </div>
        <Button onClick={() => onNavigate('create-session')} className="gap-2">
          <Plus className="w-4 h-4" />
          {t('createSession')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onNavigate('schedules')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">{t('courses')}</CardTitle>
            <div className="bg-chart-1 p-2 rounded-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'ar' ? 'المواد التي تدرسها' : 'Your courses'}
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">{t('activeSession')}</CardTitle>
            <div className="bg-chart-2 p-2 rounded-lg">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{stats.activeSessions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'ar' ? 'الجلسات النشطة حالياً' : 'Currently active'}
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onNavigate('reports')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">
              {language === 'ar' ? 'الجداول' : 'Schedules'}
            </CardTitle>
            <div className="bg-chart-3 p-2 rounded-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{todaySchedules.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'ar' ? 'محاضرات اليوم' : "Today's classes"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'ar' ? 'جلسات الحضور النشطة' : 'Active Sessions'}
            </CardTitle>
            <CardDescription>
              {language === 'ar'
                ? 'الجلسات المفتوحة حالياً لتسجيل الحضور'
                : 'Currently open for attendance'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessions.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    {language === 'ar'
                      ? 'لا توجد جلسات نشطة حالياً'
                      : 'No active sessions'}
                  </p>
                  <Button
                    onClick={() => onNavigate('create-session')}
                    variant="outline"
                    className="mt-4"
                  >
                    {t('createSession')}
                  </Button>
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-4 bg-muted/50 rounded-lg border-r-4 border-success"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{session.section?.course?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {session.section?.name}
                        </p>
                      </div>
                      <div className="px-3 py-1 bg-success/10 text-success rounded-full text-xs">
                        {language === 'ar' ? 'نشط' : 'Active'}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="font-mono bg-background px-2 py-1 rounded">
                        {session.code}
                      </span>
                      <span>
                        {new Date(session.starts_at).toLocaleTimeString(language, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
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
                    {language === 'ar'
                      ? 'لا توجد محاضرات اليوم'
                      : 'No classes today'}
                  </p>
                </div>
              ) : (
                todaySchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{schedule.section?.course?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {schedule.section?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{schedule.start_time} - {schedule.end_time}</span>
                      <span>•</span>
                      <span>{schedule.location}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'مواد التدريس' : 'Teaching Courses'}</CardTitle>
          <CardDescription>
            {language === 'ar'
              ? 'قائمة المواد التي تقوم بتدريسها'
              : 'List of courses you teach'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {language === 'ar'
                  ? 'لم يتم تعيين مواد لك بعد'
                  : 'No courses assigned yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="p-4 bg-muted/50 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onNavigate('reports')}
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{course.name}</p>
                      <p className="text-sm text-muted-foreground">{course.code}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}