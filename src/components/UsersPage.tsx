import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Users, Search, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Language, useTranslation } from '../lib/i18n';
import { toast } from 'sonner@2.0.3';
import { BackButton } from './BackButton';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

interface UsersPageProps {
  onNavigate: (page: string) => void;
  language: Language;
}

export function UsersPage({ onNavigate, language }: UsersPageProps) {
  const { t } = useTranslation(language);
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('users-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        loadUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(
        (user) =>
          user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.student_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error(language === 'ar' ? 'فشل تحميل المستخدمين' : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: any = {
      admin: 'default',
      instructor: 'secondary',
      student: 'outline',
    };

    const labels = {
      admin: t('admin'),
      instructor: t('instructor'),
      student: t('student'),
    };

    return (
      <Badge variant={variants[role] || 'outline'}>
        {labels[role as keyof typeof labels] || role}
      </Badge>
    );
  };

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === 'supervisor').length,
    instructors: users.filter((u) => u.role === 'teacher').length,
    students: users.filter((u) => u.role === 'student').length,
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton onClick={() => onNavigate('dashboard')} language={language} />
          <div>
            <h1>{t('userManagement')}</h1>
            <p className="text-muted-foreground">
              {language === 'ar'
                ? 'إدارة المستخدمين والصلاحيات'
                : 'Manage users and permissions'}
            </p>
          </div>
        </div>
        <Button className="gap-2">
          <UserPlus className="w-4 h-4" />
          {language === 'ar' ? 'إضافة مست��دم' : 'Add User'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {language === 'ar' ? 'إجمالي المستخدمين' : 'Total Users'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('admin')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{stats.admins}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('instructor')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{stats.instructors}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('student')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{stats.students}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>{language === 'ar' ? 'قائمة المستخدمين' : 'Users List'}</CardTitle>
              <CardDescription>
                {language === 'ar'
                  ? `عرض ${filteredUsers.length} من ${users.length} مستخدم`
                  : `Showing ${filteredUsers.length} of ${users.length} users`}
              </CardDescription>
            </div>
            <div className="relative w-full md:w-auto">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="md:w-[300px] pr-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm
                  ? language === 'ar'
                    ? 'لا توجد نتائج'
                    : 'No results found'
                  : t('noData')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'ar' ? 'الاسم' : 'Name'}</TableHead>
                    <TableHead>{t('email')}</TableHead>
                    <TableHead>{language === 'ar' ? 'الدور' : 'Role'}</TableHead>
                    <TableHead>{t('studentNumber')}</TableHead>
                    <TableHead>{language === 'ar' ? 'تاريخ الإنشاء' : 'Created'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <p className="font-medium">{user.full_name}</p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        {user.student_number ? (
                          <span className="font-mono text-sm">{user.student_number}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString(language)
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {language === 'ar' ? 'ملاحظة مهمة' : 'Important Note'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <p className="text-sm">
              {language === 'ar'
                ? 'لإضافة مستخدمين جدد أو تعديل الأدوار:'
                : 'To add new users or modify roles:'}
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 mr-4">
              <li>
                1.{' '}
                {language === 'ar'
                  ? 'يمكن للمستخدمين التسجيل عبر صفحة التسجيل'
                  : 'Users can register via the registration page'}
              </li>
              <li>
                2.{' '}
                {language === 'ar'
                  ? 'لتغيير دور المستخدم، افتح Supabase Dashboard → profiles → عدل role'
                  : 'To change user role, open Supabase Dashboard → profiles → edit role'}
              </li>
              <li>
                3.{' '}
                {language === 'ar'
                  ? 'للطلاب: يجب إضافة رقمهم الجامعي في جدول allowed_students أولاً'
                  : 'For students: add their number to allowed_students table first'}
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}