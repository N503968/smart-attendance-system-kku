import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Users, BookOpen, Calendar, BarChart3, Plus, RefreshCw, UserCog } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { supabase } from '../lib/supabase';
import { Language, useTranslation } from '../lib/i18n';
import { toast } from 'sonner@2.0.3';

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
  language: Language;
}

export function AdminDashboard({ onNavigate, language }: AdminDashboardProps) {
  const { t } = useTranslation(language);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalSchedules: 0,
    totalAttendance: 0,
    totalEnrollments: 0,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        loadDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => {
        loadDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
        loadDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Get users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get courses count
      const { count: coursesCount } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true });

      // Get schedules count
      const { count: schedulesCount } = await supabase
        .from('schedules')
        .select('*', { count: 'exact', head: true });

      // Get attendance count
      const { count: attendanceCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true });

      // Get enrollments count
      const { count: enrollmentsCount } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      setStats({
        totalUsers: usersCount || 0,
        totalCourses: coursesCount || 0,
        totalSchedules: schedulesCount || 0,
        totalAttendance: attendanceCount || 0,
        totalEnrollments: enrollmentsCount || 0,
      });

      // Get recent users
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setUsers(recentUsers || []);

      // Get courses data
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Get instructor IDs
      const instructorIds = [...new Set(coursesData?.map(c => c.instructor_id) || [])];

      // Get instructors
      const { data: instructorsData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', instructorIds);

      // Create instructor map
      const instructorsMap = new Map(instructorsData?.map(i => [i.id, i.full_name]) || []);

      // Enrich courses with instructor names
      const enrichedCourses = coursesData?.map(course => ({
        ...course,
        instructor: {
          full_name: instructorsMap.get(course.instructor_id) || language === 'ar' ? 'غير محدد' : 'Unknown'
        }
      })) || [];

      setCourses(enrichedCourses);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error(language === 'ar' ? 'فشل تحميل البيانات' : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: t('totalUsers'),
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-chart-1',
      action: () => onNavigate('users'),
    },
    {
      title: t('courses'),
      value: stats.totalCourses,
      icon: BookOpen,
      color: 'bg-chart-2',
      action: () => onNavigate('schedules'),
    },
    {
      title: t('schedules'),
      value: stats.totalSchedules,
      icon: Calendar,
      color: 'bg-chart-3',
      action: () => onNavigate('schedules'),
    },
    {
      title: t('attendanceRecords'),
      value: stats.totalAttendance,
      icon: BarChart3,
      color: 'bg-chart-4',
      action: () => onNavigate('reports'),
    },
  ];

  const userRoleData = [
    {
      name: t('admin'),
      value: users.filter((u) => u.role === 'supervisor').length,
      color: '#1ABC9C',
    },
    {
      name: t('instructor'),
      value: users.filter((u) => u.role === 'teacher').length,
      color: '#3498DB',
    },
    {
      name: t('student'),
      value: users.filter((u) => u.role === 'student').length,
      color: '#9B59B6',
    },
  ];

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'supervisor':
        return t('admin');
      case 'teacher':
        return t('instructor');
      case 'student':
        return t('student');
      default:
        return role;
    }
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
          <h1>{language === 'ar' ? 'لوحة تحكم المدير' : 'Admin Dashboard'}</h1>
          <p className="text-muted-foreground">{t('overview')}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadDashboardData} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            {language === 'ar' ? 'تحديث البيانات' : 'Refresh Data'}
          </Button>
          <Button onClick={() => onNavigate('users')} className="gap-2">
            <Plus className="w-4 h-4" />
            {language === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <Card
            key={index}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={stat.action}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">{stat.title}</CardTitle>
              <div className={`${stat.color} p-2 rounded-lg`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">
            {language === 'ar' ? 'توزيع المستخدمين' : 'User Distribution'}
          </TabsTrigger>
          <TabsTrigger value="statistics">
            {language === 'ar' ? 'الإحصائيات' : 'Statistics'}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>
                {language === 'ar'
                  ? 'توزيع المستخدمين حسب الدور'
                  : 'Users by Role'}
              </CardTitle>
              <CardDescription>
                {language === 'ar'
                  ? 'نظرة عامة على توزيع المستخدمين في النظام'
                  : 'Overview of user distribution in the system'}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userRoleData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {userRoleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="statistics">
          <Card>
            <CardHeader>
              <CardTitle>{t('statistics')}</CardTitle>
              <CardDescription>
                {language === 'ar'
                  ? 'إحصائيات النظام العامة'
                  : 'General system statistics'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between p-4 bg-muted/50 rounded-lg">
                  <span>{language === 'ar' ? 'معدل الحضور' : 'Attendance Rate'}</span>
                  <span className="font-bold text-success">
                    {stats.totalAttendance > 0
                      ? '85%'
                      : '0%'}
                  </span>
                </div>
                <div className="flex justify-between p-4 bg-muted/50 rounded-lg">
                  <span>{language === 'ar' ? 'المستخدمون النشطون' : 'Active Users'}</span>
                  <span className="font-bold">{stats.totalUsers}</span>
                </div>
                <div className="flex justify-between p-4 bg-muted/50 rounded-lg">
                  <span>{language === 'ar' ? 'المواد النشطة' : 'Active Courses'}</span>
                  <span className="font-bold">{stats.totalCourses}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'ar' ? 'المستخدمون الأخيرون' : 'Recent Users'}
            </CardTitle>
            <CardDescription>
              {language === 'ar'
                ? 'آخر المستخدمين المضافين للنظام'
                : 'Latest users added to the system'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">{t('noData')}</p>
              ) : (
                users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                      {getRoleLabel(user.role)}
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
              {language === 'ar' ? 'المواد الدراسية' : 'Courses'}
            </CardTitle>
            <CardDescription>
              {language === 'ar'
                ? 'قائمة المواد المتاحة في النظام'
                : 'List of available courses'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {courses.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">{t('noData')}</p>
              ) : (
                courses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{course.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {course.instructor?.full_name || language === 'ar' ? 'بدون مدرس' : 'No instructor'}
                      </p>
                    </div>
                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}