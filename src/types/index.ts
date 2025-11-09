export type UserRole = 'admin' | 'instructor' | 'student';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  password?: string;
}

export interface Course {
  id: string;
  courseName: string;
  instructorId: string;
  instructorName?: string;
}

export interface Schedule {
  id: string;
  courseId: string;
  courseName?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  location: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  studentName?: string;
  courseId: string;
  courseName?: string;
  date: string;
  status: 'present' | 'absent';
  sessionCode?: string;
}

export interface AttendanceSession {
  id: string;
  courseId: string;
  courseName?: string;
  date: string;
  code: string;
  isActive: boolean;
}
