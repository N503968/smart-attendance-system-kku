export type Language = 'ar' | 'en';

export const translations = {
  ar: {
    // Auth
    login: 'تسجيل الدخول',
    register: 'التسجيل',
    logout: 'تسجيل الخروج',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    fullName: 'الاسم الكامل',
    studentNumber: 'الرقم الجامعي',
    
    // System
    systemTitle: 'نظام الحضور الذكي',
    universityName: 'جامعة الملك خالد',
    
    // Roles
    admin: 'مدير',
    instructor: 'مدرس',
    student: 'طالب',
    
    // Dashboard
    dashboard: 'لوحة التحكم',
    overview: 'نظرة عامة',
    totalUsers: 'إجمالي المستخدمين',
    courses: 'المواد الدراسية',
    schedules: 'الجداول الدراسية',
    attendanceRecords: 'سجلات الحضور',
    
    // Sessions
    createSession: 'إنشاء جلسة حضور',
    activeSession: 'جلسة نشطة',
    sessionCode: 'كود الحضور',
    submitAttendance: 'تسجيل الحضور',
    
    // Status
    present: 'حاضر',
    absent: 'غائب',
    late: 'متأخر',
    excused: 'معذور',
    
    // Actions
    add: 'إضافة',
    edit: 'تعديل',
    delete: 'حذف',
    save: 'حفظ',
    cancel: 'إلغاء',
    search: 'بحث',
    filter: 'تصفية',
    export: 'تصدير',
    
    // Biometric
    enrollBiometric: 'تسجيل البصمة',
    biometricAuth: 'المصادقة البيومترية',
    useBiometric: 'استخدم البصمة للحضور',
    activeSessions: 'الجلسات النشطة',
    biometricAttendance: 'الحضور بالبصمة',
    markWithBiometric: 'تسجيل بالبصمة',
    markWithCode: 'تسجيل بالكود',
    
    // Messages
    success: 'نجح',
    error: 'خطأ',
    loading: 'جاري التحميل...',
    noData: 'لا توجد بيانات',
    
    // Reports
    reports: 'التقارير',
    statistics: 'الإحصائيات',
    attendanceRate: 'نسبة الحضور',
    
    // Users
    users: 'المستخدمين',
    userManagement: 'إدارة المستخدمين',
    
    // Days
    sunday: 'الأحد',
    monday: 'الاثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة',
    saturday: 'السبت',
  },
  en: {
    // Auth
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    fullName: 'Full Name',
    studentNumber: 'Student Number',
    
    // System
    systemTitle: 'Smart Attendance System',
    universityName: 'King Khalid University',
    
    // Roles
    admin: 'Admin',
    instructor: 'Instructor',
    student: 'Student',
    
    // Dashboard
    dashboard: 'Dashboard',
    overview: 'Overview',
    totalUsers: 'Total Users',
    courses: 'Courses',
    schedules: 'Schedules',
    attendanceRecords: 'Attendance Records',
    
    // Sessions
    createSession: 'Create Session',
    activeSession: 'Active Session',
    sessionCode: 'Session Code',
    submitAttendance: 'Submit Attendance',
    
    // Status
    present: 'Present',
    absent: 'Absent',
    late: 'Late',
    excused: 'Excused',
    
    // Actions
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    
    // Biometric
    enrollBiometric: 'Enroll Biometric',
    biometricAuth: 'Biometric Authentication',
    useBiometric: 'Use Biometric for Attendance',
    activeSessions: 'Active Sessions',
    biometricAttendance: 'Biometric Attendance',
    markWithBiometric: 'Mark with Biometric',
    markWithCode: 'Mark with Code',
    
    // Messages
    success: 'Success',
    error: 'Error',
    loading: 'Loading...',
    noData: 'No Data',
    
    // Reports
    reports: 'Reports',
    statistics: 'Statistics',
    attendanceRate: 'Attendance Rate',
    
    // Users
    users: 'Users',
    userManagement: 'User Management',
    
    // Days
    sunday: 'Sunday',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
  },
};

export function useTranslation(lang: Language) {
  return {
    t: (key: keyof typeof translations.ar) => translations[lang][key] || key,
    lang,
  };
}

export function getStoredLanguage(): Language {
  if (typeof window === 'undefined') return 'ar';
  return (localStorage.getItem('language') as Language) || 'ar';
}

export function setStoredLanguage(lang: Language) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('language', lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}