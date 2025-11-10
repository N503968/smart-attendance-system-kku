import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle, XCircle, Clock, Calendar, ClipboardList, Fingerprint, BarChart3, RefreshCw, BookOpen, AlertCircle } from 'lucide-react';
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

interface EnrolledCourse {
  id: string;
  course_code: string;
  course_name: string;
  section_name: string;
  instructor_name: string;
}

interface AttendanceRecord {
  id: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  marked_at: string;
  course_name: string;
  course_code: string;
  session_date: string;
}

export function StudentDashboard({ user, onNavigate, language }: StudentDashboardProps) {
  const { t } = useTranslation(language);
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    total: 0,
    attendanceRate: 0,
  });
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [todaySchedules, setTodaySchedules] = useState<any[]>([]);
  const [hasWebAuthn, setHasWebAuthn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStudentData();
    checkBiometric();

    // Subscribe to realtime updates
    const attendanceChannel = supabase
      .channel('student-attendance-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance', filter: `student_id=eq.${user.id}` },
        () => {
          loadStudentData();
        }
      )
      .subscribe();

    const enrollmentsChannel = supabase
      .channel('student-enrollments-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'enrollments', filter: `student_id=eq.${user.id}` },
        () => {
          loadStudentData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(attendanceChannel);
      supabase.removeChannel(enrollmentsChannel);
    };
  }, [user.id]);

  const checkBiometric = async () => {
    const hasBio = await checkUserHasWebAuthn(user.id);
    setHasWebAuthn(hasBio);
  };

  const loadStudentData = async () => {
    try {
      setLoading(true);

      // 1. Try to get student's enrollments (may not exist yet)
      let enrollmentsData: any[] = [];
      let hasEnrollmentsTable = true;
      
      try {
        const { data, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select(`
            id,
            course_id,
            section_id,
            status
          `)
          .eq('student_id', user.id)
          .eq('status', 'active');

        if (enrollmentsError) {
          // Check if table doesn't exist
          if (enrollmentsError.code === 'PGRST205' || enrollmentsError.code === '42P01') {
            console.warn('enrollments table not found - please run migration');
            hasEnrollmentsTable = false;
          } else {
            throw enrollmentsError;
          }
        } else {
          enrollmentsData = data || [];
        }
      } catch (err) {
        console.warn('Error checking enrollments:', err);
        hasEnrollmentsTable = false;
      }

      // If no enrollments table or no data, show empty state
      if (!hasEnrollmentsTable || enrollmentsData.length === 0) {
        setEnrolledCourses([]);
        setRecentAttendance([]);
        setStats({ present: 0, absent: 0, late: 0, total: 0, attendanceRate: 0 });
        setLoading(false);
        return;
      }

      // 2. Get course and section details
      const courseIds = [...new Set(enrollmentsData.map(e => e.course_id))];
      const sectionIds = [...new Set(enrollmentsData.map(e => e.section_id).filter(Boolean))];

      // Get courses
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, code, name, instructor_id')
        .in('id', courseIds);

      // Get sections
      const { data: sectionsData } = await supabase
        .from('sections')
        .select('id, name, course_id')
        .in('id', sectionIds);

      // Get instructors
      const instructorIds = [...new Set(coursesData?.map(c => c.instructor_id) || [])];
      const { data: instructorsData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', instructorIds);

      // Create maps for quick lookup
      const coursesMap = new Map(coursesData?.map(c => [c.id, c]) || []);
      const sectionsMap = new Map(sectionsData?.map(s => [s.id, s]) || []);
      const instructorsMap = new Map(instructorsData?.map(i => [i.id, i.full_name]) || []);

      // Build enrolled courses list
      const enrichedCourses: EnrolledCourse[] = enrollmentsData.map(enrollment => {
        const course = coursesMap.get(enrollment.course_id);
        const section = sectionsMap.get(enrollment.section_id);
        return {
          id: enrollment.id,
          course_code: course?.code || '',
          course_name: course?.name || '',
          section_name: section?.name || language === 'ar' ? 'غير محدد' : 'Not specified',
          instructor_name: instructorsMap.get(course?.instructor_id || '') || language === 'ar' ? 'غير محدد' : 'Not specified',
        };
      });

      setEnrolledCourses(enrichedCourses);

      // 3. Get attendance records
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', user.id)
        .order('marked_at', { ascending: false });

      if (attendanceError) {
        console.error('Error loading attendance:', attendanceError);
        throw attendanceError;
      }

      // Calculate stats
      const present = attendanceData?.filter(a => a.status === 'present').length || 0;
      const absent = attendanceData?.filter(a => a.status === 'absent').length || 0;
      const late = attendanceData?.filter(a => a.status === 'late').length || 0;
      const total = attendanceData?.length || 0;
      const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

      setStats({ present, absent, late, total, attendanceRate });

      // 4. Get recent attendance with session details
      if (attendanceData && attendanceData.length > 0) {
        const recentSessionIds = attendanceData.slice(0, 10).map(a => a.session_id);

        try {
          const { data: sessionsData, error: sessionsError } = await supabase
            .from('sessions')
            .select('id, section_id, starts_at')
            .in('id', recentSessionIds);

          if (sessionsError) {
            console.warn('Error loading sessions:', sessionsError);
            // Continue without session details
            setRecentAttendance(attendanceData.slice(0, 10).map(att => ({
              id: att.id,
              status: att.status,
              marked_at: att.marked_at || '',
              course_name: language === 'ar' ? 'غير محدد' : 'Unknown',
              course_code: '',
              session_date: att.marked_at || '',
            })));
          } else {
            const sessionSectionIds = [...new Set(sessionsData?.map(s => s.section_id) || [])];
            
            const { data: sessionSectionsData } = await supabase
              .from('sections')
              .select('id, name, course_id')
              .in('id', sessionSectionIds);

            const sessionCourseIds = [...new Set(sessionSectionsData?.map(s => s.course_id) || [])];
            
            const { data: sessionCoursesData } = await supabase
              .from('courses')
              .select('id, code, name')
              .in('id', sessionCourseIds);

            // Create maps
            const sessionsMap = new Map(sessionsData?.map(s => [s.id, s]) || []);
            const sessionSectionsMap = new Map(sessionSectionsData?.map(s => [s.id, s]) || []);
            const sessionCoursesMap = new Map(sessionCoursesData?.map(c => [c.id, c]) || []);

            const enrichedAttendance: AttendanceRecord[] = attendanceData.slice(0, 10).map(att => {
              const session = sessionsMap.get(att.session_id);
              const section = sessionSectionsMap.get(session?.section_id || '');
              const course = sessionCoursesMap.get(section?.course_id || '');
              
              return {
                id: att.id,
                status: att.status,
                marked_at: att.marked_at || '',
                course_name: course?.name || language === 'ar' ? 'غير محدد' : 'Unknown',
                course_code: course?.code || '',
                session_date: session?.starts_at || att.marked_at || '',
              };
            });

            setRecentAttendance(enrichedAttendance);
          }
        } catch (err) {
          console.warn('Error enriching attendance:', err);
          // Fallback to basic attendance data
          setRecentAttendance(attendanceData.slice(0, 10).map(att => ({
            id: att.id,
            status: att.status,
            marked_at: att.marked_at || '',
            course_name: language === 'ar' ? 'غير محدد' : 'Unknown',
            course_code: '',
            session_date: att.marked_at || '',
          })));
        }
      } else {
        setRecentAttendance([]);
      }

      // 5. Get today's schedules
      await loadTodaySchedules(sectionIds);

    } catch (error) {
      console.error('Error loading student data:', error);
      toast.error(language === 'ar' ? 'فشل في تحميل البيانات' : 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadTodaySchedules = async (sectionIds: string[]) => {
    if (sectionIds.length === 0) return;

    const today = new Date().getDay();

    const { data: schedulesData } = await supabase
      .from('schedules')
      .select('*, sections(name, course_id, courses(name, code))')
      .in('section_id', sectionIds)
      .eq('day_of_week', today);

    setTodaySchedules(schedulesData || []);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStudentData();
    toast.success(language === 'ar' ? 'تم تحديث البيانات' : 'Data refreshed');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'text-success';
      case 'absent':
        return 'text-destructive';
      case 'late':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-4 h-4" />;
      case 'absent':
        return <XCircle className="w-4 h-4" />;
      case 'late':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present':
        return language === 'ar' ? 'حاضر' : 'Present';
      case 'absent':
        return language === 'ar' ? 'غائب' : 'Absent';
      case 'late':
        return language === 'ar' ? 'متأخر' : 'Late';
      default:
        return status;
    }
  };

  const chartData = [
    { name: language === 'ar' ? 'حاضر' : 'Present', value: stats.present, color: '#10b981' },
    { name: language === 'ar' ? 'غائب' : 'Absent', value: stats.absent, color: '#ef4444' },
    { name: language === 'ar' ? 'متأخر' : 'Late', value: stats.late, color: '#f59e0b' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Empty state - no enrollments
  if (enrolledCourses.length === 0) {
    return (
      <div className="space-y-6 p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2">{language === 'ar' ? 'مرحباً' : 'Welcome'}, {user.full_name}</h1>
            <p className="text-muted-foreground">
              {language === 'ar' ? 'لوحة التحكم الخاصة بالطالب' : 'Student Dashboard'}
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'} ${refreshing ? 'animate-spin' : ''}`} />
            {language === 'ar' ? 'تحديث' : 'Refresh'}
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="mb-2">{language === 'ar' ? 'لا توجد مواد مسجلة' : 'No Enrolled Courses'}</h3>
            <p className="text-muted-foreground text-center mb-6">
              {language === 'ar' 
                ? 'لم يتم تسجيلك في أي مادة بعد. يرجى التواصل مع المدرس أو المشرف لتسجيلك في المواد الدراسية.' 
                : 'You are not enrolled in any courses yet. Please contact your instructor or supervisor to enroll in courses.'}
            </p>
            <Button onClick={() => onNavigate('active-sessions')}>
              <Calendar className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {language === 'ar' ? 'عرض الجلسات النشطة' : 'View Active Sessions'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2">{language === 'ar' ? 'مرحباً' : 'Welcome'}, {user.full_name}</h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'لوحة التحكم الخاصة بالطالب' : 'Student Dashboard'}
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm" disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'} ${refreshing ? 'animate-spin' : ''}`} />
          {language === 'ar' ? 'تحديث' : 'Refresh'}
        </Button>
      </div>

      {/* Enrolled Courses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className={`w-5 h-5 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {language === 'ar' ? 'المواد المسجلة' : 'Enrolled Courses'}
          </CardTitle>
          <CardDescription>
            {language === 'ar' ? `مسجل في ${enrolledCourses.length} مادة` : `Enrolled in ${enrolledCourses.length} courses`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {enrolledCourses.map((course) => (
              <Card key={course.id}>
                <CardHeader>
                  <CardTitle className="text-base">{course.course_code}</CardTitle>
                  <CardDescription>{course.course_name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{language === 'ar' ? 'الشعبة:' : 'Section:'}</span>
                    <span>{course.section_name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{language === 'ar' ? 'المدرس:' : 'Instructor:'}</span>
                    <span>{course.instructor_name}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">{language === 'ar' ? 'نسبة الحضور' : 'Attendance Rate'}</CardTitle>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">
              {language === 'ar' ? `من إجمالي ${stats.total} جلسة` : `Out of ${stats.total} sessions`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">{language === 'ar' ? 'الحضور' : 'Present'}</CardTitle>
            <CheckCircle className="w-4 h-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.present}</div>
            <p className="text-xs text-muted-foreground">
              {language === 'ar' ? 'جلسة حضور' : 'Sessions attended'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">{language === 'ar' ? 'الغياب' : 'Absent'}</CardTitle>
            <XCircle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.absent}</div>
            <p className="text-xs text-muted-foreground">
              {language === 'ar' ? 'جلسة غياب' : 'Sessions missed'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">{language === 'ar' ? 'التأخير' : 'Late'}</CardTitle>
            <Clock className="w-4 h-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.late}</div>
            <p className="text-xs text-muted-foreground">
              {language === 'ar' ? 'مرات التأخير' : 'Times late'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Attendance Chart */}
        {stats.total > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'إحصائيات الحضور' : 'Attendance Statistics'}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Recent Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'آخر سجلات الحضور' : 'Recent Attendance'}</CardTitle>
          </CardHeader>
          <CardContent>
            {recentAttendance.length > 0 ? (
              <div className="space-y-4">
                {recentAttendance.slice(0, 5).map((record) => (
                  <div key={record.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={getStatusColor(record.status)}>
                        {getStatusIcon(record.status)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{record.course_code}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(record.session_date).toLocaleDateString(language)}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm ${getStatusColor(record.status)}`}>
                      {getStatusText(record.status)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                {language === 'ar' ? 'لا توجد سجلات حضور بعد' : 'No attendance records yet'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Button onClick={() => onNavigate('active-sessions')} className="w-full">
            <Calendar className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {language === 'ar' ? 'الجلسات النشطة' : 'Active Sessions'}
          </Button>
          <Button onClick={() => onNavigate('submit-attendance')} variant="outline" className="w-full">
            <ClipboardList className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {language === 'ar' ? 'تسجيل الحضور' : 'Submit Attendance'}
          </Button>
          {!hasWebAuthn && (
            <Button onClick={() => onNavigate('biometric')} variant="outline" className="w-full">
              <Fingerprint className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {language === 'ar' ? 'تسجيل البصمة' : 'Register Biometric'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}