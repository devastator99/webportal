import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://hcaqodjylicmppxcbqbh.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjYXFvZGp5bGljbXBweGNicWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzMDIxNDksImV4cCI6MjA1Mzg3ODE0OX0.h4pO6UShabHNPWC9o_EMbbhOVHsR-fuZQ5-b85hNB4w"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions
export interface PatientProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface AdminOperationResponse {
  success: boolean;
  message?: string;
  error?: string;
  id?: string;
}

export interface PatientInvoice {
  id: string;
  patient_id: string;
  doctor_id?: string;
  amount: number;
  currency: string;
  description?: string;
  status: string;
  invoice_number: string;
  created_at: string;
  updated_at: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
}

// Valid user role types - must match database enum exactly
export type ValidUserRole = 'patient' | 'doctor' | 'nutritionist' | 'administrator' | 'reception';

// Helper function to create user role safely
export const createUserRole = async (userId: string, role: ValidUserRole) => {
  try {
    console.log(`Creating user role for ${userId} with role ${role}`);
    
    const { data, error } = await supabase.rpc('create_user_role', {
      p_user_id: userId,
      p_role: role
    });

    if (error) {
      console.error('Error creating user role:', error);
      throw new Error(`Failed to create user role: ${error.message}`);
    }

    console.log('User role RPC response:', data);

    // The function returns jsonb, check if it was successful
    if (data && typeof data === 'object') {
      if (data.success === false) {
        console.error('User role creation failed:', data);
        throw new Error(`Failed to create user role: ${data.error || 'Unknown error'}`);
      } else if (data.success === true) {
        console.log('User role created successfully:', data);
        return { success: true, data };
      }
    }

    // If we get here, something unexpected happened
    console.warn('Unexpected response from create_user_role:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('Exception in createUserRole:', error);
    throw new Error(`Failed to create user role: ${error.message}`);
  }
};

// Function to get doctor's patients
export const getDoctorPatients = async (doctorId: string): Promise<PatientProfile[]> => {
  try {
    const { data, error } = await supabase.rpc('get_doctor_patients', {
      p_doctor_id: doctorId
    });

    if (error) {
      console.error('Error fetching doctor patients:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getDoctorPatients:', error);
    throw error;
  }
};

// Function to get nutritionist's patients
export const getNutritionistPatients = async (nutritionistId: string): Promise<PatientProfile[]> => {
  try {
    const { data, error } = await supabase.rpc('get_nutritionist_patients', {
      p_nutritionist_id: nutritionistId
    });

    if (error) {
      console.error('Error fetching nutritionist patients:', error);
      throw error;
    }

    // Transform the data to match PatientProfile interface
    const formattedPatients = (data || []).map((patient: any) => ({
      id: patient.patient_id,
      first_name: patient.patient_first_name,
      last_name: patient.patient_last_name
    }));

    return formattedPatients;
  } catch (error) {
    console.error('Error in getNutritionistPatients:', error);
    throw error;
  }
};

// Function to get patient invoices
export const getPatientInvoices = async (patientId: string): Promise<PatientInvoice[]> => {
  try {
    const { data, error } = await supabase.rpc('get_patient_invoices', {
      p_patient_id: patientId
    });

    if (error) {
      console.error('Error fetching patient invoices:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getPatientInvoices:', error);
    throw error;
  }
};
