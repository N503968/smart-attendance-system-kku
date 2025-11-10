import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Download, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Profile, supabase } from '../lib/supabase';
import { Language, useTranslation } from '../lib/i18n';
import { toast } from 'sonner@2.0.3';
import { BackButton } from './BackButton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

interface ReportsPageProps {
  user: Profile;
  onNavigate: (page: string) => void;
  language: Language;
}

export function ReportsPage({ user, onNavigate, language }: ReportsPageProps) {
  const { t } = useTranslation(language);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportsData();
  }, [user.id, user.role, selectedCourse, selectedStatus]);

  const loadReportsData = async () => {
    try {
      setLoading(true);

      // Load courses based on role
      if (user.role === 'teacher') {
        const { data: coursesData } = await supabase
          .from('courses')
          .select('*')
          .eq('instructor_id', user.id);
        setCourses(coursesData || []);
      } else if (user.role === 'supervisor') {
        const { data: coursesData } = await supabase.from('courses').select('*');
        setCourses(coursesData || []);
      }

      // Build simpler query without nested joins
      let query = supabase
        .from('attendance')
        .select('*')
        .order('marked_at', { ascending: false });

      // Filter by user role
      if (user.role === 'student') {
        query = query.eq('student_id', user.id);
      }

      const { data: attendanceData, error: attendanceError } = await query.limit(100);

      if (attendanceError) throw attendanceError;

      // Fetch related data separately
      let enrichedAttendance: any[] = [];
      
      if (attendanceData && attendanceData.length > 0) {
        // Get unique session IDs
        const sessionIds = [...new Set(attendanceData.map(a => a.session_id))];
        const studentIds = [...new Set(attendanceData.map(a => a.student_id))];

        // Fetch sessions
        const { data: sessionsData } = await supabase
          .from('sessions')
          .select('*')
          .in('id', sessionIds);

        // Fetch students
        const { data: studentsData } = await supabase
          .from('profiles')
          .select('id, full_name, student_number')
          .in('id', studentIds);

        // Get section IDs from sessions
        const sectionIds = [...new Set((sessionsData || []).map(s => s.section_id))];

        // Fetch sections
        const { data: sectionsData } = await supabase
          .from('sections')
          .select('*')
          .in('id', sectionIds);

        // Get course IDs from sections
        const courseIds = [...new Set((sectionsData || []).map(s => s.course_id))];

        // Fetch courses
        const { data: coursesData } = await supabase
          .from('courses')
          .select('*')
          .in('id', courseIds);

        // Manually join the data
        enrichedAttendance = attendanceData.map(attendance => {
          const session = sessionsData?.find(s => s.id === attendance.session_id);
          const student = studentsData?.find(st => st.id === attendance.student_id);
          const section = sectionsData?.find(sec => sec.id === session?.section_id);
          const course = coursesData?.find(c => c.id === section?.course_id);

          return {
            ...attendance,
            student: student ? {
              full_name: student.full_name,
              student_number: student.student_number
            } : null,
            session: session ? {
              ...session,
              section: section ? {
                ...section,
                course: course || null
              } : null
            } : null
          };
        });

        // Filter by instructor's courses if needed
        if (user.role === 'teacher') {
          const { data: instructorCourses } = await supabase
            .from('courses')
            .select('id')
            .eq('instructor_id', user.id);
          
          const instructorCourseIds = instructorCourses?.map(c => c.id) || [];
          enrichedAttendance = enrichedAttendance.filter(a => 
            instructorCourseIds.includes(a.session?.section?.course?.id)
          );
        }
      }

      // Apply filters
      let filteredData = enrichedAttendance;
      
      if (selectedStatus !== 'all') {
        filteredData = filteredData.filter(a => a.status === selectedStatus);
      }

      if (selectedCourse !== 'all') {
        filteredData = filteredData.filter(
          (a) => a.session?.section?.course?.id === selectedCourse
        );
      }

      setAttendance(filteredData);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error(language === 'ar' ? 'فشل تحميل التقارير' : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

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

  const exportToCSV = () => {
    if (attendance.length === 0) {
      toast.error(language === 'ar' ? 'لا توجد بيانات للتصدير' : 'No data to export');
      return;
    }

    const headers = ['Student', 'Course', 'Status', 'Date', 'Method'];
    const rows = attendance.map((a) => [
      a.student?.full_name || 'Unknown',
      a.session?.section?.course?.name || 'Unknown',
      a.status,
      new Date(a.marked_at).toLocaleDateString(),
      a.method,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success(language === 'ar' ? 'تم تصدير التقرير' : 'Report exported');
  };

  const stats = {
    total: attendance.length,
    present: attendance.filter((a) => a.status === 'present').length,
    absent: attendance.filter((a) => a.status === 'absent').length,
    late: attendance.filter((a) => a.status === 'late').length,
  };

  const attendanceRate =
    stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0;

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton onClick={() => onNavigate('dashboard')} language={language} />
          <div>
            <h1>{t('reports')}</h1>
            <p className="text-muted-foreground">
              {language === 'ar' ? 'تقارير الحضور والإحصائيات' : 'Attendance reports and statistics'}
            </p>
          </div>
        </div>
        <Button onClick={exportToCSV} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          {t('export')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{language === 'ar' ? 'الإمالي' : 'Total'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-success">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('present')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-success">{stats.present}</div>
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('absent')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-destructive">{stats.absent}</div>
          </CardContent>
        </Card>

        <Card className="border-chart-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{language === 'ar' ? 'نسبة الحضور' : 'Rate'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-chart-4">{attendanceRate}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>{language === 'ar' ? 'سجلات الحضور' : 'Attendance Records'}</CardTitle>
              <CardDescription>
                {language === 'ar'
                  ? `عرض ${attendance.length} سجل`
                  : `Showing ${attendance.length} records`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {user.role !== 'student' && courses.length > 0 && (
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {language === 'ar' ? 'جميع المواد' : 'All Courses'}
                    </SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {language === 'ar' ? 'جميع الحالات' : 'All Status'}
                  </SelectItem>
                  <SelectItem value="present">{t('present')}</SelectItem>
                  <SelectItem value="absent">{t('absent')}</SelectItem>
                  <SelectItem value="late">{t('late')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {attendance.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t('noData')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {user.role !== 'student' && (
                      <TableHead>{language === 'ar' ? 'الطالب' : 'Student'}</TableHead>
                    )}
                    <TableHead>{language === 'ar' ? 'المادة' : 'Course'}</TableHead>
                    <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                    <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                    <TableHead>{language === 'ar' ? 'الطريقة' : 'Method'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((record) => (
                    <TableRow key={record.id}>
                      {user.role !== 'student' && (
                        <TableCell>
                          <div>
                            <p className="font-medium">{record.student?.full_name || '-'}</p>
                            <p className="text-xs text-muted-foreground">
                              {record.student?.student_number || '-'}
                            </p>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        {record.session?.section?.course?.name || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(record.status)}
                          <span>{getStatusLabel(record.status)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(record.marked_at).toLocaleDateString(language, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-muted rounded text-xs">
                          {record.method}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}