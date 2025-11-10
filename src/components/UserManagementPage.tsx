import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { UserPlus, Edit, Trash2, Search, RefreshCw, Users } from 'lucide-react';
import { Profile, supabase, UserRole } from '../lib/supabase';
import { Language } from '../lib/i18n';
import { toast } from 'sonner@2.0.3';

interface UserManagementPageProps {
  currentUser: Profile;
  language: Language;
  onBack: () => void;
}

export function UserManagementPage({ currentUser, language, onBack }: UserManagementPageProps) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'student' as UserRole,
    student_id: '',
    department: '',
  });

  useEffect(() => {
    loadUsers();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('users-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          loadUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error(language === 'ar' ? 'فشل في تحميل المستخدمين' : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate email domain
      if (!formData.email.endsWith('@kku.edu.sa')) {
        toast.error(language === 'ar' ? 'يجب أن يكون البريد من نطاق @kku.edu.sa' : 'Email must be from @kku.edu.sa domain');
        return;
      }

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            role: formData.role,
            student_id: formData.student_id,
            department: formData.department,
          },
        },
      });

      if (authError) throw authError;

      // 2. Create profile (if not created automatically by trigger)
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: formData.email,
            full_name: formData.full_name,
            role: formData.role,
            student_id: formData.role === 'student' ? formData.student_id : null,
            department: formData.department,
          });

        if (profileError) throw profileError;
      }

      toast.success(language === 'ar' ? 'تم إضافة المستخدم بنجاح' : 'User added successfully');
      setIsAddDialogOpen(false);
      resetForm();
      loadUsers();
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast.error(error.message || (language === 'ar' ? 'فشل في إضافة المستخدم' : 'Failed to add user'));
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          role: formData.role,
          student_id: formData.role === 'student' ? formData.student_id : null,
          department: formData.department,
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast.success(language === 'ar' ? 'تم تحديث المستخدم بنجاح' : 'User updated successfully');
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      resetForm();
      loadUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.message || (language === 'ar' ? 'فشل في تحديث المستخدم' : 'Failed to update user'));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا المستخدم؟' : 'Are you sure you want to delete this user?')) {
      return;
    }

    try {
      // Delete from auth (will cascade to profiles)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) {
        // If not admin, try deleting profile only
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userId);
        
        if (profileError) throw profileError;
      }

      toast.success(language === 'ar' ? 'تم حذف المستخدم بنجاح' : 'User deleted successfully');
      loadUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || (language === 'ar' ? 'فشل في حذف المستخدم' : 'Failed to delete user'));
    }
  };

  const openEditDialog = (user: Profile) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: '',
      full_name: user.full_name,
      role: user.role,
      student_id: user.student_number || '',
      department: '',
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      role: 'student',
      student_id: '',
      department: '',
    });
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'supervisor':
        return 'bg-purple-500';
      case 'teacher':
        return 'bg-blue-500';
      case 'student':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRoleText = (role: UserRole) => {
    switch (role) {
      case 'supervisor':
        return language === 'ar' ? 'مشرف' : 'Supervisor';
      case 'teacher':
        return language === 'ar' ? 'مدرس' : 'Teacher';
      case 'student':
        return language === 'ar' ? 'طالب' : 'Student';
      default:
        return role;
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.student_number && user.student_number.includes(searchTerm));
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2">
            {language === 'ar' ? 'إدارة المستخدمين' : 'User Management'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'إدارة حسابات الطلاب والمدرسين' : 'Manage student and teacher accounts'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadUsers} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'} ${loading ? 'animate-spin' : ''}`} />
            {language === 'ar' ? 'تحديث' : 'Refresh'}
          </Button>
          <Button onClick={onBack} variant="outline">
            {language === 'ar' ? 'رجوع' : 'Back'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{language === 'ar' ? 'إجمالي المستخدمين' : 'Total Users'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{language === 'ar' ? 'الطلاب' : 'Students'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.role === 'student').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{language === 'ar' ? 'المدرسون' : 'Teachers'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.role === 'teacher').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{language === 'ar' ? 'المشرفون' : 'Supervisors'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.role === 'supervisor').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4`} />
                <Input
                  placeholder={language === 'ar' ? 'البحث عن مستخدم...' : 'Search users...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={language === 'ar' ? 'pr-10' : 'pl-10'}
                />
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={language === 'ar' ? 'الدور' : 'Role'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
                  <SelectItem value="student">{language === 'ar' ? 'طالب' : 'Student'}</SelectItem>
                  <SelectItem value="teacher">{language === 'ar' ? 'مدرس' : 'Teacher'}</SelectItem>
                  <SelectItem value="supervisor">{language === 'ar' ? 'مشرف' : 'Supervisor'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {language === 'ar' ? 'إضافة مستخدم' : 'Add User'}
                </Button>
              </DialogTrigger>
              <DialogContent dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <DialogHeader>
                  <DialogTitle>{language === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User'}</DialogTitle>
                  <DialogDescription>
                    {language === 'ar' ? 'أدخل بيانات المستخدم الجديد' : 'Enter the new user details'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@kku.edu.sa"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">{language === 'ar' ? 'كلمة المرور' : 'Password'}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="full_name">{language === 'ar' ? 'الاسم الكامل' : 'Full Name'}</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">{language === 'ar' ? 'الدور' : 'Role'}</Label>
                    <Select value={formData.role} onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">{language === 'ar' ? 'طالب' : 'Student'}</SelectItem>
                        <SelectItem value="teacher">{language === 'ar' ? 'مدرس' : 'Teacher'}</SelectItem>
                        <SelectItem value="supervisor">{language === 'ar' ? 'مشرف' : 'Supervisor'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.role === 'student' && (
                    <div className="space-y-2">
                      <Label htmlFor="student_id">{language === 'ar' ? 'الرقم الجامعي' : 'Student ID'}</Label>
                      <Input
                        id="student_id"
                        value={formData.student_id}
                        onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="department">{language === 'ar' ? 'القسم' : 'Department'}</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </Button>
                    <Button type="submit">
                      {language === 'ar' ? 'إضافة' : 'Add'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {language === 'ar' ? 'لا يوجد مستخدمون' : 'No users found'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'ar' ? 'الاسم' : 'Name'}</TableHead>
                    <TableHead>{language === 'ar' ? 'البريد' : 'Email'}</TableHead>
                    <TableHead>{language === 'ar' ? 'الدور' : 'Role'}</TableHead>
                    <TableHead>{language === 'ar' ? 'الرقم الجامعي' : 'Student ID'}</TableHead>
                    <TableHead className="text-center">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {getRoleText(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.student_number || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={user.id === currentUser.id}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تعديل المستخدم' : 'Edit User'}</DialogTitle>
            <DialogDescription>
              {language === 'ar' ? 'تحديث بيانات المستخدم' : 'Update user information'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_full_name">{language === 'ar' ? 'الاسم الكامل' : 'Full Name'}</Label>
              <Input
                id="edit_full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_role">{language === 'ar' ? 'الدور' : 'Role'}</Label>
              <Select value={formData.role} onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">{language === 'ar' ? 'طالب' : 'Student'}</SelectItem>
                  <SelectItem value="teacher">{language === 'ar' ? 'مدرس' : 'Teacher'}</SelectItem>
                  <SelectItem value="supervisor">{language === 'ar' ? 'مشرف' : 'Supervisor'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.role === 'student' && (
              <div className="space-y-2">
                <Label htmlFor="edit_student_id">{language === 'ar' ? 'الرقم الجامعي' : 'Student ID'}</Label>
                <Input
                  id="edit_student_id"
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit_department">{language === 'ar' ? 'القسم' : 'Department'}</Label>
              <Input
                id="edit_department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit">
                {language === 'ar' ? 'حفظ' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
