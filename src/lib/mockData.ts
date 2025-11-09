import { User, Course, Schedule, Attendance, AttendanceSession } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    fullName: 'د. أحمد محمد',
    email: 'admin@kku.edu.sa',
    role: 'admin',
    password: 'admin123'
  },
  {
    id: '2',
    fullName: 'د. فاطمة العمري',
    email: 'instructor@kku.edu.sa',
    role: 'instructor',
    password: 'instructor123'
  },
  {
    id: '3',
    fullName: 'خالد أحمد السالم',
    email: 'student@kku.edu.sa',
    role: 'student',
    password: 'student123'
  },
  {
    id: '4',
    fullName: 'سارة محمد القحطاني',
    email: 'sara@kku.edu.sa',
    role: 'student',
    password: 'student123'
  },
  {
    id: '5',
    fullName: 'عبدالله علي الشهري',
    email: 'abdullah@kku.edu.sa',
    role: 'student',
    password: 'student123'
  }
];

export const mockCourses: Course[] = [
  {
    id: '1',
    courseName: 'مقدمة في علوم الحاسب',
    instructorId: '2',
    instructorName: 'د. فاطمة العمري'
  },
  {
    id: '2',
    courseName: 'قواعد البيانات',
    instructorId: '2',
    instructorName: 'د. فاطمة العمري'
  },
  {
    id: '3',
    courseName: 'هندسة البرمجيات',
    instructorId: '2',
    instructorName: 'د. فاطمة العمري'
  }
];

export const mockSchedules: Schedule[] = [
  {
    id: '1',
    courseId: '1',
    courseName: 'مقدمة في علوم الحاسب',
    dayOfWeek: 'الأحد',
    startTime: '08:00',
    endTime: '10:00',
    location: 'قاعة A101'
  },
  {
    id: '2',
    courseId: '1',
    courseName: 'مقدمة في علوم الحاسب',
    dayOfWeek: 'الثلاثاء',
    startTime: '10:00',
    endTime: '12:00',
    location: 'قاعة A101'
  },
  {
    id: '3',
    courseId: '2',
    courseName: 'قواعد البيانات',
    dayOfWeek: 'الاثنين',
    startTime: '08:00',
    endTime: '10:00',
    location: 'قاعة B205'
  },
  {
    id: '4',
    courseId: '2',
    courseName: 'قواعد البيانات',
    dayOfWeek: 'الأربعاء',
    startTime: '13:00',
    endTime: '15:00',
    location: 'قاعة B205'
  },
  {
    id: '5',
    courseId: '3',
    courseName: 'هندسة البرمجيات',
    dayOfWeek: 'الأحد',
    startTime: '10:00',
    endTime: '12:00',
    location: 'قاعة C301'
  }
];

export const mockAttendance: Attendance[] = [
  {
    id: '1',
    studentId: '3',
    studentName: 'خالد أحمد السالم',
    courseId: '1',
    courseName: 'مقدمة في علوم الحاسب',
    date: '2025-11-09',
    status: 'present',
    sessionCode: 'ABC123'
  },
  {
    id: '2',
    studentId: '4',
    studentName: 'سارة محمد القحطاني',
    courseId: '1',
    courseName: 'مقدمة في علوم الحاسب',
    date: '2025-11-09',
    status: 'present',
    sessionCode: 'ABC123'
  },
  {
    id: '3',
    studentId: '5',
    studentName: 'عبدالله علي الشهري',
    courseId: '1',
    courseName: 'مقدمة في علوم الحاسب',
    date: '2025-11-09',
    status: 'absent'
  },
  {
    id: '4',
    studentId: '3',
    studentName: 'خالد أحمد السالم',
    courseId: '2',
    courseName: 'قواعد البيانات',
    date: '2025-11-04',
    status: 'present',
    sessionCode: 'XYZ789'
  }
];

export const mockAttendanceSessions: AttendanceSession[] = [
  {
    id: '1',
    courseId: '1',
    courseName: 'مقدمة في علوم الحاسب',
    date: '2025-11-09',
    code: 'ABC123',
    isActive: true
  },
  {
    id: '2',
    courseId: '2',
    courseName: 'قواعد البيانات',
    date: '2025-11-04',
    code: 'XYZ789',
    isActive: false
  }
];

export function generateSessionCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
