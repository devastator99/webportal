
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://hcaqodjylicmppxcbqbh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjYXFvZGp5bGljbXBweGNicWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzMDIxNDksImV4cCI6MjA1Mzg3ODE0OX0.h4pO6UShabHNPWC9o_EMbbhOVHsR-fuZQ5-b85hNB4w";

// Create the Supabase client with improved session handling and logging
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storageKey: 'supabase.auth.token',
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-client-info': `@supabase/supabase-js/${process.env.NODE_ENV}`,
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Helper function to safely access properties from query results
export const safelyUnwrapValue = <T>(value: any, defaultValue?: T): T => {
  if (!value) return defaultValue as T;
  if (value.error === true) return defaultValue as T;
  return value as T;
};

// Helper function to cast array results from database functions
export const asArray = <T>(data: any): T[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data as T[];
  return [] as T[];
};

// Helper function to safely cast database function return values
export function castRPCResult<T>(result: any): T[] {
  if (!result) return [] as T[];
  if (Array.isArray(result)) return result as T[];
  if (typeof result === 'object' && 'error' in result) return [] as T[];
  return [] as T[];
}

// Helper to safely extract a single value
export function safeExtractData<T>(result: any, defaultValue: T): T {
  if (!result) return defaultValue;
  if (typeof result === 'object' && 'error' in result) return defaultValue;
  return result as T;
}

// Helper to safely check if a function response is an array and has items
export function isArrayWithItems(data: any): boolean {
  return Array.isArray(data) && data.length > 0;
}

// Safely get properties from an object, handle errors and null/undefined
export function safeGet<T, K extends keyof T>(obj: T | null | undefined, key: K, defaultValue: T[K]): T[K] {
  if (!obj) return defaultValue;
  if ('error' in (obj as any)) return defaultValue;
  return (obj[key] !== undefined && obj[key] !== null) ? obj[key] : defaultValue;
}
