import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
// Note: In production, these can be replaced with environment variables
const supabaseUrl = 'https://bscxhshnubkhngodruuj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzY3hoc2hudWJraG5nb2RydXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MDgzODUsImV4cCI6MjA3ODI4NDM4NX0._cszwMx3Yty-pl0Ip6IKlSctk7HxBJ4pN6ehLpkAEqY';

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration.');
}

// Create Supabase client with optimized settings
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'kku-attendance-auth',
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'kku-attendance-system',
    },
  },
});