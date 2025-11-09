import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Profile, supabase } from '../lib/supabase';
import { Language, useTranslation } from '../lib/i18n';
import { toast } from 'sonner@2.0.3';
import { BackButton } from './BackButton';

interface SchedulesPageProps {
  user: Profile;
  onNavigate: (page: string) => void;
  language: Language;
}

export function SchedulesPage({ user, onNavigate, language }: SchedulesPageProps) {
  const { t } = useTranslation(language);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedules();
  }, [user.id, user.role]);

  const loadSchedules = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('schedules')
        .select(`
          *,
          section:sections(
            *,
            course:courses(*)
          )
        `)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      // Filter based on role
      if (user.role === 'instructor') {
        const { data: coursesData } = await supabase
          .from('courses')
          .select('id')
          .eq('instructor_id', user.id);

        const courseIds = coursesData?.map((c) => c.id) || [];
        // Note: This is simplified - in production use a database view
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter by instructor's courses if needed (client-side for simplicity)
      let filteredData = data || [];
      if (user.role === 'instructor') {
        const { data: coursesData } = await supabase
          .from('courses')
          .select('id')
          .eq('instructor_id', user.id);

        const courseIds = coursesData?.map((c) => c.id) || [];
        filteredData = filteredData.filter((s) =>
          courseIds.includes(s.section?.course?.id)
        );
      }

      setSchedules(filteredData);
    } catch (error) {
      console.error('Error loading schedules:', error);
      toast.error(language === 'ar' ? 'فشل تحميل الجداول' : 'Failed to load schedules');
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

  const groupSchedulesByDay = () => {
    const grouped: { [key: number]: any[] } = {};
    schedules.forEach((schedule) => {
      if (!grouped[schedule.day_of_week]) {
        grouped[schedule.day_of_week] = [];
      }
      grouped[schedule.day_of_week].push(schedule);
    });
    return grouped;
  };

  const groupedSchedules = groupSchedulesByDay();

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
      <div className="flex items-center gap-4">
        <BackButton onClick={() => onNavigate('dashboard')} language={language} />
        <div>
          <h1>{t('schedules')}</h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'الجداول الدراسية الأسبوعية' : 'Weekly academic schedules'}
          </p>
        </div>
      </div>

      {schedules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {language === 'ar' ? 'لا توجد جداول متاحة' : 'No schedules available'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {[0, 1, 2, 3, 4].map((day) =>
            groupedSchedules[day] && groupedSchedules[day].length > 0 ? (
              <Card key={day}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {getDayName(day)}
                  </CardTitle>
                  <CardDescription>
                    {groupedSchedules[day].length}{' '}
                    {language === 'ar' ? 'محاضرة' : 'classes'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {groupedSchedules[day].map((schedule) => (
                      <div
                        key={schedule.id}
                        className="p-4 bg-muted/50 rounded-lg border-r-4 border-primary hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-lg">
                              {schedule.section?.course?.name || language === 'ar' ? 'غير محدد' : 'Unknown'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {schedule.section?.course?.code} - {schedule.section?.name}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span>
                                {schedule.start_time} - {schedule.end_time}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span>{schedule.location}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}