import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { formatDateForDatabase } from '@/utils/dateUtils';

const SUPABASE_URL = "https://hcaqodjylicmppxcbqbh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjYXFvZGp5bGljbXBweGNicWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzMDIxNDksImV4cCI6MjA1Mzg3ODE0OX0.h4pO6UShabHNPWC9o_EMbbhOVHsR-fuZQ5-b85hNB4w";

// Create the Supabase client with improved session handling
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
  if (typeof obj === 'object' && 'error' in (obj as any)) return defaultValue;
  return ((obj as any)[key] !== undefined && (obj as any)[key] !== null) ? (obj as any)[key] : defaultValue;
}

// Define patient profile interface for type safety
export interface PatientProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

// Define user role interface
export interface UserRole {
  id: number;
  user_id: string;
  role: string;
  created_at: string;
}

// Create user role using RPC function
export async function createUserRole(userId: string, role: string): Promise<UserRole | null> {
  try {
    console.log(`Creating user role: ${userId} as ${role}`);
    
    // Use the RPC function to insert the role
    const { data, error } = await supabase.rpc(
      'insert_user_role',
      {
        p_user_id: userId,
        p_role: role
      }
    );
    
    if (error) {
      console.error('Error creating user role:', error);
      throw error;
    }
    
    console.log('User role created successfully:', data);
    // Need to cast the returned data to match our interface
    const userRole: UserRole = {
      id: data.id,
      user_id: data.user_id,
      role: data.role,
      created_at: data.created_at
    };
    return userRole;
  } catch (err) {
    console.error('Failed to create user role:', err);
    throw err;
  }
}

// Get patients for a doctor using RPC function to avoid RLS recursion issues
export async function getDoctorPatients(doctorId: string): Promise<PatientProfile[]> {
  try {
    const { data, error } = await supabase.rpc('get_doctor_patients', {
      p_doctor_id: doctorId
    }) as { data: PatientProfile[] | null, error: any };
    
    if (error) {
      return [];
    }
    
    return data as PatientProfile[] || [];
  } catch (err) {
    return [];
  }
}

// Get all patients (for administrators or system-wide views)
export async function getAllPatients(): Promise<PatientProfile[]> {
  try {
    const { data, error } = await supabase.rpc('get_all_patients') as { data: PatientProfile[] | null, error: any };
    
    if (error) {
      return [];
    }
    
    return data as PatientProfile[] || [];
  } catch (err) {
    return [];
  }
}

// Generic function to fetch prescriptions for a patient by a doctor
export async function fetchPatientPrescriptions(patientId: string, doctorId: string) {
  try {
    // Using the get_doctor_patient_records RPC function to securely retrieve records
    const { data, error } = await supabase.rpc('get_doctor_patient_records', {
      p_doctor_id: doctorId,
      p_patient_id: patientId
    });
    
    if (error) {
      return [];
    }
    
    return data || [];
  } catch (err) {
    return [];
  }
}

// Function to save a prescription using RPC
export async function savePrescription(patientId: string, doctorId: string, diagnosis: string, prescription: string, notes: string) {
  try {
    // Using the save_prescription RPC function to securely save records
    const { data, error } = await supabase.rpc('save_prescription', {
      p_patient_id: patientId,
      p_doctor_id: doctorId,
      p_diagnosis: diagnosis,
      p_prescription: prescription,
      p_notes: notes
    });
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (err) {
    throw err;
  }
}

// Function to create patient details using RPC function
export async function createPatientDetails(
  userId: string,
  age: number,
  gender: string,
  bloodGroup: string,
  allergies: string | null,
  emergencyContact: string,
  height: number | null,
  birthDate: string | null,
  foodHabit: string | null,
  currentMedicalConditions: string | null
) {
  try {
    console.log('Creating patient details with data:', {
      userId, age, gender, bloodGroup, allergies, emergencyContact, height, birthDate, foodHabit, currentMedicalConditions
    });
    
    // Format birth date properly
    const formattedBirthDate = birthDate ? formatDateForDatabase(birthDate) : null;
    
    // Use the RPC function to insert/update patient details
    const { data, error } = await supabase.rpc(
      'upsert_patient_details',
      {
        p_user_id: userId,
        p_age: age,
        p_gender: gender,
        p_blood_group: bloodGroup,
        p_allergies: allergies,
        p_emergency_contact: emergencyContact,
        p_height: height,
        p_birth_date: formattedBirthDate,
        p_food_habit: foodHabit,
        p_current_medical_conditions: currentMedicalConditions
      }
    );
    
    if (error) {
      console.error('Error creating patient details:', error);
      throw error;
    }
    
    console.log('Patient details created successfully:', data);
    return data;
  } catch (err) {
    console.error('Failed to create patient details:', err);
    throw err;
  }
}
