import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { BookOpen, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Profile, supabase } from '../lib/supabase';
import { Language } from '../lib/i18n';
import { toast } from 'sonner@2.0.3';

interface CreateCoursePageProps {
  user: Profile;
  language: Language;
  onBack: () => void;
  onSuccess?: () => void;
}

interface SectionForm {
  id: string;
  name: string;
  max_students: number;
}

interface ScheduleForm {
  id: string;
  section_name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  location: string;
}

export function CreateCoursePage({ user, language, onBack, onSuccess }: CreateCoursePageProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Course, 2: Sections, 3: Schedules

  // Course form
  const [courseData, setCourseData] = useState({
    code: '',
    name: '',
    description: '',
    semester: '',
    year: new Date().getFullYear(),
    credits: 3,
  });

  // Sections
  const [sections, setSections] = useState<SectionForm[]>([
    { id: '1', name: language === 'ar' ? 'الشعبة 1' : 'Section 1', max_students: 40 }
  ]);

  // Schedules
  const [schedules, setSchedules] = useState<ScheduleForm[]>([]);

  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
  const [createdSections, setCreatedSections] = useState<any[]>([]);

  const daysOfWeek = [
    { value: 0, label: language === 'ar' ? 'الأحد' : 'Sunday' },
    { value: 1, label: language === 'ar' ? 'الاثنين' : 'Monday' },
    { value: 2, label: language === 'ar' ? 'الثلاثاء' : 'Tuesday' },
    { value: 3, label: language === 'ar' ? 'الأربعاء' : 'Wednesday' },
    { value: 4, label: language === 'ar' ? 'الخميس' : 'Thursday' },
    { value: 5, label: language === 'ar' ? 'الجمعة' : 'Friday' },
    { value: 6, label: language === 'ar' ? 'السبت' : 'Saturday' },
  ];

  const currentSemester = [
    { value: 'first', label: language === 'ar' ? 'الفصل الأول' : 'First Semester' },
    { value: 'second', label: language === 'ar' ? 'الفصل الثاني' : 'Second Semester' },
    { value: 'summer', label: language === 'ar' ? 'الفصل الصيفي' : 'Summer Semester' },
  ];

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate
      if (!courseData.code || !courseData.name) {
        toast.error(language === 'ar' ? 'الرجاء إدخال جميع الحقول المطلوبة' : 'Please fill all required fields');
        return;
      }

      // Create course
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
          code: courseData.code.toUpperCase(),
          name: courseData.name,
          description: courseData.description,
          instructor_id: user.id,
          semester: courseData.semester,
          year: courseData.year,
          credits: courseData.credits,
        })
        .select()
        .single();

      if (courseError) throw courseError;

      setCreatedCourseId(course.id);
      toast.success(language === 'ar' ? 'تم إنشاء المادة بنجاح' : 'Course created successfully');
      setStep(2);
    } catch (error: any) {
      console.error('Error creating course:', error);
      toast.error(error.message || (language === 'ar' ? 'فشل في إنشاء المادة' : 'Failed to create course'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSections = async () => {
    if (!createdCourseId) return;
    setLoading(true);

    try {
      // Validate
      if (sections.length === 0) {
        toast.error(language === 'ar' ? 'الرجاء إضافة شعبة واحدة على الأقل' : 'Please add at least one section');
        return;
      }

      // Create sections
      const sectionsToInsert = sections.map(s => ({
        course_id: createdCourseId,
        name: s.name,
        max_students: s.max_students,
      }));

      const { data: createdSectionsData, error: sectionsError } = await supabase
        .from('sections')
        .insert(sectionsToInsert)
        .select();

      if (sectionsError) throw sectionsError;

      setCreatedSections(createdSectionsData || []);
      
      // Initialize schedules for each section
      const initialSchedules: ScheduleForm[] = (createdSectionsData || []).map((section, idx) => ({
        id: String(idx + 1),
        section_name: section.name,
        day_of_week: 0,
        start_time: '08:00',
        end_time: '10:00',
        location: '',
      }));
      setSchedules(initialSchedules);

      toast.success(language === 'ar' ? 'تم إنشاء الشعب بنجاح' : 'Sections created successfully');
      setStep(3);
    } catch (error: any) {
      console.error('Error creating sections:', error);
      toast.error(error.message || (language === 'ar' ? 'فشل في إنشاء الشعب' : 'Failed to create sections'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedules = async () => {
    setLoading(true);

    try {
      if (schedules.length === 0) {
        // Skip schedules
        toast.success(language === 'ar' ? 'تم إنشاء المادة بنجاح' : 'Course created successfully');
        if (onSuccess) onSuccess();
        onBack();
        return;
      }

      // Create schedules
      const schedulesToInsert = schedules.map(s => {
        const section = createdSections.find(sec => sec.name === s.section_name);
        return {
          section_id: section?.id,
          day_of_week: s.day_of_week,
          start_time: s.start_time,
          end_time: s.end_time,
          location: s.location,
        };
      }).filter(s => s.section_id);

      if (schedulesToInsert.length > 0) {
        const { error: schedulesError } = await supabase
          .from('schedules')
          .insert(schedulesToInsert);

        if (schedulesError) throw schedulesError;
      }

      toast.success(language === 'ar' ? 'تم إنشاء الجداول بنجاح' : 'Schedules created successfully');
      if (onSuccess) onSuccess();
      onBack();
    } catch (error: any) {
      console.error('Error creating schedules:', error);
      toast.error(error.message || (language === 'ar' ? 'فشل في إنشاء الجداول' : 'Failed to create schedules'));
    } finally {
      setLoading(false);
    }
  };

  const addSection = () => {
    const nextNum = sections.length + 1;
    setSections([
      ...sections,
      {
        id: String(nextNum),
        name: language === 'ar' ? `الشعبة ${nextNum}` : `Section ${nextNum}`,
        max_students: 40,
      }
    ]);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const addSchedule = () => {
    const nextNum = schedules.length + 1;
    const firstSection = createdSections[0];
    setSchedules([
      ...schedules,
      {
        id: String(nextNum),
        section_name: firstSection?.name || '',
        day_of_week: 0,
        start_time: '08:00',
        end_time: '10:00',
        location: '',
      }
    ]);
  };

  const removeSchedule = (id: string) => {
    setSchedules(schedules.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="mb-2">
            {language === 'ar' ? 'إضافة مادة جديدة' : 'Add New Course'}
          </h1>
          <p className="text-muted-foreground">
            {step === 1 && (language === 'ar' ? 'أدخل معلومات المادة' : 'Enter course information')}
            {step === 2 && (language === 'ar' ? 'أضف الشعب' : 'Add sections')}
            {step === 3 && (language === 'ar' ? 'أضف الجداول الدراسية' : 'Add schedules')}
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
          1
        </div>
        <div className={`h-1 w-16 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
          2
        </div>
        <div className={`h-1 w-16 ${step >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
          3
        </div>
      </div>

      {/* Step 1: Course Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className={`w-5 h-5 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {language === 'ar' ? 'معلومات المادة' : 'Course Information'}
            </CardTitle>
            <CardDescription>
              {language === 'ar' ? 'املأ البيانات الأساسية للمادة الدراسية' : 'Fill in the basic course details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code">{language === 'ar' ? 'رمز المادة' : 'Course Code'} *</Label>
                  <Input
                    id="code"
                    placeholder="CS101"
                    value={courseData.code}
                    onChange={(e) => setCourseData({ ...courseData, code: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credits">{language === 'ar' ? 'عدد الساعات' : 'Credits'}</Label>
                  <Input
                    id="credits"
                    type="number"
                    min="1"
                    max="6"
                    value={courseData.credits}
                    onChange={(e) => setCourseData({ ...courseData, credits: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{language === 'ar' ? 'اسم المادة' : 'Course Name'} *</Label>
                <Input
                  id="name"
                  placeholder={language === 'ar' ? 'مثال: مقدمة في البرمجة' : 'Example: Introduction to Programming'}
                  value={courseData.name}
                  onChange={(e) => setCourseData({ ...courseData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{language === 'ar' ? 'الوصف' : 'Description'}</Label>
                <Textarea
                  id="description"
                  placeholder={language === 'ar' ? 'وصف مختصر للمادة...' : 'Brief course description...'}
                  value={courseData.description}
                  onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="semester">{language === 'ar' ? 'الفصل الدراسي' : 'Semester'}</Label>
                  <Select value={courseData.semester} onValueChange={(value) => setCourseData({ ...courseData, semester: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'ar' ? 'اختر الفصل' : 'Select semester'} />
                    </SelectTrigger>
                    <SelectContent>
                      {currentSemester.map(sem => (
                        <SelectItem key={sem.value} value={sem.value}>{sem.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">{language === 'ar' ? 'السنة' : 'Year'}</Label>
                  <Input
                    id="year"
                    type="number"
                    min="2020"
                    max="2030"
                    value={courseData.year}
                    onChange={(e) => setCourseData({ ...courseData, year: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={onBack}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (language === 'ar' ? 'جاري الإنشاء...' : 'Creating...') : (language === 'ar' ? 'التالي' : 'Next')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Sections */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'الشعب الدراسية' : 'Course Sections'}</CardTitle>
            <CardDescription>
              {language === 'ar' ? 'أضف الشعب المتاحة للمادة' : 'Add available sections for this course'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sections.map((section, index) => (
              <div key={section.id} className="flex items-end gap-2 p-4 border rounded-lg">
                <div className="flex-1 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'اسم الشعبة' : 'Section Name'}</Label>
                    <Input
                      value={section.name}
                      onChange={(e) => {
                        const updated = [...sections];
                        updated[index].name = e.target.value;
                        setSections(updated);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'الحد الأقصى للطلاب' : 'Max Students'}</Label>
                    <Input
                      type="number"
                      min="1"
                      value={section.max_students}
                      onChange={(e) => {
                        const updated = [...sections];
                        updated[index].max_students = parseInt(e.target.value);
                        setSections(updated);
                      }}
                    />
                  </div>
                </div>
                {sections.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSection(section.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addSection} className="w-full">
              <Plus className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {language === 'ar' ? 'إضافة شعبة' : 'Add Section'}
            </Button>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                {language === 'ar' ? 'السابق' : 'Previous'}
              </Button>
              <Button onClick={handleCreateSections} disabled={loading}>
                {loading ? (language === 'ar' ? 'جاري الإنشاء...' : 'Creating...') : (language === 'ar' ? 'التالي' : 'Next')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Schedules */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'الجداول الدراسية' : 'Class Schedules'}</CardTitle>
            <CardDescription>
              {language === 'ar' ? 'أضف مواعيد المحاضرات (اختياري)' : 'Add class times (optional)'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {schedules.map((schedule, index) => (
              <div key={schedule.id} className="flex items-end gap-2 p-4 border rounded-lg">
                <div className="flex-1 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'الشعبة' : 'Section'}</Label>
                    <Select
                      value={schedule.section_name}
                      onValueChange={(value) => {
                        const updated = [...schedules];
                        updated[index].section_name = value;
                        setSchedules(updated);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {createdSections.map(sec => (
                          <SelectItem key={sec.id} value={sec.name}>{sec.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'اليوم' : 'Day'}</Label>
                    <Select
                      value={String(schedule.day_of_week)}
                      onValueChange={(value) => {
                        const updated = [...schedules];
                        updated[index].day_of_week = parseInt(value);
                        setSchedules(updated);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {daysOfWeek.map(day => (
                          <SelectItem key={day.value} value={String(day.value)}>{day.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'من' : 'Start Time'}</Label>
                    <Input
                      type="time"
                      value={schedule.start_time}
                      onChange={(e) => {
                        const updated = [...schedules];
                        updated[index].start_time = e.target.value;
                        setSchedules(updated);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'إلى' : 'End Time'}</Label>
                    <Input
                      type="time"
                      value={schedule.end_time}
                      onChange={(e) => {
                        const updated = [...schedules];
                        updated[index].end_time = e.target.value;
                        setSchedules(updated);
                      }}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>{language === 'ar' ? 'القاعة' : 'Location'}</Label>
                    <Input
                      placeholder={language === 'ar' ? 'مثال: قاعة 201' : 'Example: Room 201'}
                      value={schedule.location}
                      onChange={(e) => {
                        const updated = [...schedules];
                        updated[index].location = e.target.value;
                        setSchedules(updated);
                      }}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSchedule(schedule.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addSchedule} className="w-full">
              <Plus className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {language === 'ar' ? 'إضافة موعد' : 'Add Schedule'}
            </Button>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                {language === 'ar' ? 'السابق' : 'Previous'}
              </Button>
              <Button type="button" variant="outline" onClick={handleCreateSchedules}>
                {language === 'ar' ? 'تخطي' : 'Skip'}
              </Button>
              <Button onClick={handleCreateSchedules} disabled={loading}>
                {loading ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'إنهاء' : 'Finish')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
