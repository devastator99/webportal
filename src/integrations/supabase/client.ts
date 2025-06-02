import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://hcaqodjylicmppxcbqbh.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjYXFvZGp5bGljbXBweGNicWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzMDIxNDksImV4cCI6MjA1Mzg3ODE0OX0.h4pO6UShabHNPWC9o_EMbbhOVHsR-fuZQ5-b85hNB4w"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Valid user roles that can be created
export type ValidUserRole = 'patient' | 'doctor' | 'nutritionist' | 'administrator' | 'reception';

// Type definitions for existing functionality
export interface PatientProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  gender?: string | null;
  blood_group?: string | null;
  allergies?: string | null;
  emergency_contact?: string | null;
  height?: number | null;
  date_of_birth?: string | null;
  chronic_conditions?: string | null;
}

export interface PatientInvoice {
  id: string;
  invoice_number: string;
  patient_id: string;
  doctor_id: string | null;
  amount: number;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AdminOperationResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Helper function to create user role using the unified RPC
export const completeUserRegistration = async (
  userId: string, 
  role: ValidUserRole, 
  firstName: string,
  lastName: string,
  phone: string,
  patientData?: {
    age?: string;
    gender?: string;
    bloodGroup?: string;
    allergies?: string;
    emergencyContact?: string;
    height?: string;
    birthDate?: string | null;
    foodHabit?: string;
    knownAllergies?: string;
    currentMedicalConditions?: string;
  }
) => {
  console.log("Calling complete_user_registration RPC for user:", userId, "role:", role);
  
  const { data, error } = await supabase.rpc('complete_user_registration', {
    p_user_id: userId,
    p_role: role,
    p_first_name: firstName,
    p_last_name: lastName,
    p_phone: phone,
    p_email: null, // Not used currently
    p_age: patientData?.age ? parseInt(patientData.age, 10) : null,
    p_gender: patientData?.gender || null,
    p_blood_group: patientData?.bloodGroup || null,
    p_allergies: patientData?.allergies || null,
    p_emergency_contact: patientData?.emergencyContact || null,
    p_height: patientData?.height ? parseFloat(patientData.height) : null,
    p_birth_date: patientData?.birthDate ? new Date(patientData.birthDate).toISOString().split('T')[0] : null,
    p_food_habit: patientData?.foodHabit || null,
    p_current_medical_conditions: patientData?.currentMedicalConditions || null
  });

  if (error) {
    console.error("RPC call failed:", error);
    throw new Error(`Registration failed: ${error.message}`);
  }

  console.log("RPC call result:", data);
  
  // Check if the RPC function returned an error
  if (data && typeof data === 'object' && data.success === false) {
    throw new Error(data.error || 'Registration failed');
  }

  // Log if professional setup was triggered
  if (data?.professional_setup_triggered) {
    console.log(`Professional registration setup triggered for ${role}:`, userId);
  }

  return data;
};

// Legacy function for backward compatibility - now just calls the unified RPC
export const createUserRole = async (userId: string, role: ValidUserRole) => {
  console.log("Legacy createUserRole called - this should not be used anymore");
  throw new Error("Use completeUserRegistration instead of createUserRole");
};

// Doctor patients functions
export const getDoctorPatients = async (doctorId: string): Promise<PatientProfile[]> => {
  try {
    console.log("Fetching patients for doctor:", doctorId);
    
    const { data, error } = await supabase.functions.invoke('get-doctor-patients', {
      body: { doctor_id: doctorId }
    });
    
    if (error) {
      console.error("Error fetching doctor patients:", error);
      throw error;
    }
    
    console.log(`Retrieved ${data?.length || 0} patients for doctor ${doctorId}`);
    return data || [];
  } catch (error: any) {
    console.error("Error in getDoctorPatients:", error);
    throw new Error(`Failed to fetch patients: ${error.message}`);
  }
};

// Nutritionist patients functions
export const getNutritionistPatients = async (nutritionistId: string): Promise<PatientProfile[]> => {
  try {
    console.log("Fetching patients for nutritionist:", nutritionistId);
    
    const { data, error } = await supabase.functions.invoke('get-nutritionist-patients', {
      body: { nutritionist_id: nutritionistId }
    });
    
    if (error) {
      console.error("Error fetching nutritionist patients:", error);
      throw error;
    }
    
    console.log(`Retrieved ${data?.length || 0} patients for nutritionist ${nutritionistId}`);
    return data || [];
  } catch (error: any) {
    console.error("Error in getNutritionistPatients:", error);
    throw new Error(`Failed to fetch patients: ${error.message}`);
  }
};

// Patient invoices functions
export const getPatientInvoices = async (patientId: string): Promise<PatientInvoice[]> => {
  try {
    console.log("Fetching invoices for patient:", patientId);
    
    const { data, error } = await supabase
      .from('patient_invoices')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching patient invoices:", error);
      throw error;
    }
    
    console.log(`Retrieved ${data?.length || 0} invoices for patient ${patientId}`);
    return data || [];
  } catch (error: any) {
    console.error("Error in getPatientInvoices:", error);
    throw new Error(`Failed to fetch invoices: ${error.message}`);
  }
};
