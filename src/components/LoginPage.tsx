import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { User } from '../types';
import { mockUsers } from '../lib/mockData';
import { GraduationCap, Mail, Lock } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = mockUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (user) {
      onLogin(user);
    } else {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto bg-primary rounded-full w-20 h-20 flex items-center justify-center">
            <GraduationCap className="w-12 h-12 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-3xl">نظام الحضور الذكي</CardTitle>
            <CardDescription className="mt-2">
              جامعة الملك خالد
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="example@kku.edu.sa"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pr-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
              </div>
            </div>
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full h-11">
              تسجيل الدخول
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-center text-sm text-muted-foreground mb-3">
              حسابات تجريبية للاختبار:
            </p>
            <div className="space-y-2 text-xs">
              <div className="bg-muted/50 p-2 rounded">
                <p><strong>مدير:</strong> admin@kku.edu.sa / admin123</p>
              </div>
              <div className="bg-muted/50 p-2 rounded">
                <p><strong>مدرس:</strong> instructor@kku.edu.sa / instructor123</p>
              </div>
              <div className="bg-muted/50 p-2 rounded">
                <p><strong>طالب:</strong> student@kku.edu.sa / student123</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
