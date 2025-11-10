import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { BookOpen, Calendar, Users, ClipboardList, Plus, RefreshCw } from 'lucide-react';
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
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: '',
    code: '',
  });

  useEffect(() => {
    loadInstructorData();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('instructor-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => {
        loadInstructorData();
      })
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
        .eq('instructor_id', user.id)
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;
      setCourses(coursesData || []);

      const courseIds = coursesData?.map(c => c.id) || [];

      // Get enrollments count for these courses
      let totalStudents = 0;
      if (courseIds.length > 0) {
        const { count, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select('*', { count: 'exact', head: true })
          .in('course_id', courseIds)
          .eq('status', 'active');

        if (!enrollmentsError) {
          totalStudents = count || 0;
        }
      }

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
          .order('starts_at', { ascending: false })
          .limit(5);

        if (sessionsError) throw sessionsError;
        
        // Filter active sessions (check if ends_at exists)
        const now = new Date();
        const filteredSessions = (sessionsList || []).filter(s => {
          if (s.ends_at) {
            return new Date(s.ends_at) > now;
          }
          // If no ends_at, assume 2 hours from starts_at
          if (s.starts_at) {
            const estimatedEnd = new Date(s.starts_at);
            estimatedEnd.setHours(estimatedEnd.getHours() + 2);
            return estimatedEnd > now;
          }
          return true; // Include if we can't determine
        });
        
        // Manually join with sections and courses data
        sessionsData = filteredSessions.map(session => {
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

      // Calculate stats - count sessions that are active
      const activeSessions = sessionsData.length; // Already filtered above

      setStats({
        totalCourses: coursesData?.length || 0,
        activeSessions,
        totalStudents,
      });
    } catch (error) {
      console.error('Error loading instructor data:', error);
      toast.error(language === 'ar' ? 'فشل تحميل البيانات' : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!newCourse.name.trim() || !newCourse.code.trim()) {
      toast.error(language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
      return;
    }

    try {
      setIsCreating(true);

      // Insert course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert({
          name: newCourse.name.trim(),
          code: newCourse.code.trim().toUpperCase(),
          instructor_id: user.id,
        })
        .select()
        .single();

      if (courseError) {
        if (courseError.code === '23505') {
          toast.error(language === 'ar' ? 'رمز المادة مستخدم بالفعل' : 'Course code already exists');
        } else {
          throw courseError;
        }
        return;
      }

      // Create default section
      const { error: sectionError } = await supabase
        .from('sections')
        .insert({
          course_id: courseData.id,
          name: language === 'ar' ? 'الشعبة 1' : 'Section 1',
        });

      if (sectionError) {
        console.error('Error creating section:', sectionError);
      }

      toast.success(language === 'ar' ? 'تم إنشاء المادة بنجاح' : 'Course created successfully');
      setIsCreateCourseOpen(false);
      setNewCourse({ name: '', code: '' });
      
      // Reload data
      loadInstructorData();
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error(language === 'ar' ? 'فشل إنشاء المادة' : 'Failed to create course');
    } finally {
      setIsCreating(false);
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
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1>
            {language === 'ar' ? `مرحباً، ${user.full_name}` : `Welcome, ${user.full_name}`}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'لوحة تحكم المدرس' : 'Instructor Dashboard'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={loadInstructorData} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            {language === 'ar' ? 'تحديث' : 'Refresh'}
          </Button>
          <Button onClick={() => onNavigate('create-course')} className="gap-2">
            <Plus className="w-4 h-4" />
            {language === 'ar' ? 'إضافة مادة جديدة' : 'Add New Course'}
          </Button>
        </div>
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