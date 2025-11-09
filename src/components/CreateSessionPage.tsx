import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, RefreshCw, Copy, Check } from 'lucide-react';
import { Profile, supabase } from '../lib/supabase';
import { Language, useTranslation } from '../lib/i18n';
import { toast } from 'sonner@2.0.3';
import { BackButton } from './BackButton';

interface CreateSessionPageProps {
  user: Profile;
  onNavigate: (page: string) => void;
  language: Language;
}

export function CreateSessionPage({ user, onNavigate, language }: CreateSessionPageProps) {
  const { t } = useTranslation(language);
  const [courses, setCourses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [duration, setDuration] = useState('120'); // minutes
  const [requireWebAuthn, setRequireWebAuthn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadCourses();
    generateCode();
  }, [user.id]);

  useEffect(() => {
    if (selectedCourse) {
      loadSections(selectedCourse);
    } else {
      setSections([]);
      setSelectedSection('');
    }
  }, [selectedCourse]);

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('instructor_id', user.id);

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error(language === 'ar' ? 'فشل تحميل المواد' : 'Failed to load courses');
    }
  };

  const loadSections = async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from('sections')
        .select('*')
        .eq('course_id', courseId);

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Error loading sections:', error);
      toast.error(language === 'ar' ? 'فشل تحميل الشعب' : 'Failed to load sections');
    }
  };

  const generateCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setSessionCode(code);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(sessionCode);
      setCopied(true);
      toast.success(language === 'ar' ? 'تم نسخ الكود' : 'Code copied');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error(language === 'ar' ? 'فشل النسخ' : 'Failed to copy');
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSection) {
      toast.error(language === 'ar' ? 'يرجى اختيار الشعبة' : 'Please select a section');
      return;
    }

    setIsLoading(true);

    try {
      const now = new Date();
      const endsAt = new Date(now.getTime() + parseInt(duration) * 60000);

      const { data, error } = await supabase.from('sessions').insert({
        section_id: selectedSection,
        starts_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
        code: sessionCode,
        require_webauthn: requireWebAuthn,
      }).select().single();

      if (error) throw error;

      toast.success(language === 'ar' ? 'تم إنشاء الجلسة بنجاح' : 'Session created successfully');
      
      // Generate new code for next session
      generateCode();
      
      // Reset form
      setSelectedCourse('');
      setSelectedSection('');
      setDuration('120');
      setRequireWebAuthn(false);
    } catch (error: any) {
      console.error('Error creating session:', error);
      if (error.code === '23505') {
        toast.error(language === 'ar' ? 'الكود مستخدم. جرب كود آخر' : 'Code already used. Try another');
        generateCode();
      } else {
        toast.error(language === 'ar' ? 'فشل إنشاء الجلسة' : 'Failed to create session');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <BackButton onClick={() => onNavigate('dashboard')} language={language} />
        <div>
          <h1>{language === 'ar' ? 'إنشاء جلسة حضور جديدة' : 'Create New Attendance Session'}</h1>
          <p className="text-muted-foreground">
            {language === 'ar'
              ? 'أنشئ جلسة جديدة لتسجيل حضور الطلاب'
              : 'Create a new session for student attendance'}
          </p>
        </div>
      </div>

      <form onSubmit={handleCreateSession} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'معلومات الجلسة' : 'Session Information'}</CardTitle>
            <CardDescription>
              {language === 'ar'
                ? 'املأ البيانات المطلوبة لإنشاء جلسة الحضور'
                : 'Fill in the required information to create an attendance session'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="course">{language === 'ar' ? 'المادة الدراسية' : 'Course'}</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={language === 'ar' ? 'اختر المادة' : 'Select course'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {courses.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      {language === 'ar' ? 'لا توجد مواد' : 'No courses'}
                    </div>
                  ) : (
                    courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name} ({course.code})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedCourse && (
              <div className="space-y-2">
                <Label htmlFor="section">{language === 'ar' ? 'الشعبة' : 'Section'}</Label>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={language === 'ar' ? 'اختر الشعبة' : 'Select section'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        {language === 'ar' ? 'لا توجد شعب' : 'No sections'}
                      </div>
                    ) : (
                      sections.map((section) => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="duration">
                {language === 'ar' ? 'مدة الجلسة (بالدقائق)' : 'Session Duration (minutes)'}
              </Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="30"
                max="240"
                step="15"
              />
              <p className="text-xs text-muted-foreground">
                {language === 'ar'
                  ? 'المدة الافتراضية: ساعتان (120 دقيقة)'
                  : 'Default duration: 2 hours (120 minutes)'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="webauthn"
                checked={requireWebAuthn}
                onChange={(e) => setRequireWebAuthn(e.target.checked)}
                className="w-4 h-4 rounded border-border"
              />
              <Label htmlFor="webauthn" className="cursor-pointer">
                {language === 'ar'
                  ? 'يتطلب المصادقة البيومترية'
                  : 'Require biometric authentication'}
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'كود الحضور' : 'Attendance Code'}</CardTitle>
            <CardDescription>
              {language === 'ar'
                ? 'شارك هذا الكود مع الطلاب لتسجيل حضورهم'
                : 'Share this code with students to mark their attendance'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Input
                  value={sessionCode}
                  readOnly
                  className="text-center text-2xl font-mono tracking-widest"
                />
              </div>
              <Button type="button" variant="outline" size="icon" onClick={generateCode}>
                <RefreshCw className="w-5 h-5" />
              </Button>
              <Button type="button" variant="outline" size="icon" onClick={copyCode}>
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </Button>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">
                {language === 'ar' ? 'طرق مشاركة الكود:' : 'Ways to share the code:'}
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 mr-4">
                <li>• {language === 'ar' ? 'عرضه على الشاشة' : 'Display on screen'}</li>
                <li>• {language === 'ar' ? 'مشاركته عبر WhatsApp' : 'Share via WhatsApp'}</li>
                <li>• {language === 'ar' ? 'كتابته على السبورة' : 'Write on whiteboard'}</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onNavigate('dashboard')}
            className="flex-1"
          >
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !selectedSection}
            className="flex-1 gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {language === 'ar' ? 'جاري الإنشاء...' : 'Creating...'}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                {language === 'ar' ? 'إنشاء الجلسة' : 'Create Session'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}