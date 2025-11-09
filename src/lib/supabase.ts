import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bscxhshnubkhngodruuj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzY3hoc2hudWJraG5nb2RydXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MDgzODUsImV4cCI6MjA3ODI4NDM4NX0._cszwMx3Yty-pl0Ip6IKlSctk7HxBJ4pN6ehLpkAEqY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export type UserRole = 'admin' | 'instructor' | 'student';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  student_number?: string;
  created_at?: string;
}

export interface AllowedStudent {
  student_number: string;
  full_name: string;
  email_domain: string;
  active: boolean;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  instructor_id: string;
  created_at?: string;
}

export interface Section {
  id: string;
  course_id: string;
  name: string;
}

export interface Schedule {
  id: string;
  section_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  location: string;
}

export interface Session {
  id: string;
  section_id: string;
  starts_at: string;
  ends_at: string;
  code: string;
  qr_svg?: string;
  require_webauthn: boolean;
}

export interface WebAuthnCredential {
  id: string;
  user_id: string;
  credential_id: string;
  public_key: string;
  counter: number;
  created_at?: string;
}

export interface Attendance {
  id: string;
  session_id: string;
  student_id: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  marked_at?: string;
  method: 'code' | 'qr' | 'webauthn';
}
