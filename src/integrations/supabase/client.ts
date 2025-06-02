import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://hcaqodjylicmppxcbqbh.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjYXFvZGp5bGljbXBweGNicWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzMDIxNDksImV4cCI6MjA1Mzg3ODE0OX0.h4pO6UShabHNPWC9o_EMbbhOVHsR-fuZQ5-b85hNB4w"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Valid user roles that can be created
export type ValidUserRole = "patient" | "doctor" | "nutritionist" | "administrator" | "reception";

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

// Updated interface for registration responses
export interface RegistrationResponse {
  success: boolean;
  message?: string;
  error?: string;
  user_id?: string;
  role?: string;
  phone?: string;
  registration_status?: string;
  tasks_created?: boolean;
}

// Enhanced helper function to create user role using the unified RPC
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
): Promise<RegistrationResponse> => {
  console.log("Calling complete_user_registration RPC for user:", userId, "role:", role, "phone:", phone);
  
  // Validate phone number is provided
  if (!phone || phone.trim() === '') {
    throw new Error("Phone number is required for registration");
  }

  const { data, error } = await supabase.rpc('complete_user_registration', {
    p_user_id: userId,
    p_role: role,
    p_first_name: firstName,
    p_last_name: lastName,
    p_phone: phone, // Ensure phone is always passed
    p_email: null,
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

  console.log("User registration completed successfully via RPC. Tasks created and will be processed automatically.");

  return data as RegistrationResponse;
};

// Legacy function for backward compatibility - now just calls the unified RPC
export const createUserRole = async (userId: string, role: ValidUserRole) => {
  console.log("Legacy createUserRole called - redirecting to completeUserRegistration");
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

// Enhanced doctor registration function with comprehensive field validation
export const completeDoctorRegistration = async (
  userId: string,
  firstName: string,
  lastName: string,
  phone: string,
  specialty?: string,
  visitingHours?: string,
  clinicLocation?: string,
  consultationFee?: number
): Promise<RegistrationResponse> => {
  // Basic validation
  if (!userId || !firstName || !lastName || !phone) {
    throw new Error('User ID, first name, last name, and phone number are required');
  }

  const cleanPhone = phone.trim();
  if (cleanPhone === '') {
    throw new Error('Phone number cannot be empty');
  }

  const cleanFirstName = firstName.trim();
  const cleanLastName = lastName.trim();
  if (cleanFirstName === '' || cleanLastName === '') {
    throw new Error('First name and last name cannot be empty');
  }

  console.log('Starting doctor registration with validated fields:', {
    userId,
    firstName: cleanFirstName,
    lastName: cleanLastName,
    phone: cleanPhone,
    specialty: specialty || null,
    visitingHours: visitingHours || null,
    clinicLocation: clinicLocation || null,
    consultationFee: consultationFee || 500
  });

  try {
    const { data, error } = await supabase.rpc('complete_doctor_registration', {
      p_user_id: userId,
      p_first_name: cleanFirstName,
      p_last_name: cleanLastName,
      p_phone: cleanPhone,
      p_specialty: specialty && specialty.trim() !== '' ? specialty.trim() : null,
      p_visiting_hours: visitingHours && visitingHours.trim() !== '' ? visitingHours.trim() : null,
      p_clinic_location: clinicLocation && clinicLocation.trim() !== '' ? clinicLocation.trim() : null,
      p_consultation_fee: consultationFee || 500
    });

    if (error) {
      console.error('Doctor registration RPC error:', error);
      throw new Error(`Doctor registration failed: ${error.message}`);
    }

    console.log('Doctor registration RPC result:', data);

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response from doctor registration function');
    }

    if (data.success === false) {
      throw new Error(data.error || 'Doctor registration failed');
    }

    return data as RegistrationResponse;
  } catch (error: any) {
    console.error('Error in completeDoctorRegistration:', error);
    throw new Error(`Doctor registration failed: ${error.message}`);
  }
};

// Add nutritionist registration function
export const completeNutritionistRegistration = async (
  userId: string,
  firstName: string,
  lastName: string,
  phone: string,
  specialization?: string,
  certifications?: string,
  experienceYears?: number,
  consultationFee?: number
): Promise<RegistrationResponse> => {
  // Basic validation
  if (!userId || !firstName || !lastName || !phone) {
    throw new Error('User ID, first name, last name, and phone number are required');
  }

  const cleanPhone = phone.trim();
  if (cleanPhone === '') {
    throw new Error('Phone number cannot be empty');
  }

  const cleanFirstName = firstName.trim();
  const cleanLastName = lastName.trim();
  if (cleanFirstName === '' || cleanLastName === '') {
    throw new Error('First name and last name cannot be empty');
  }

  console.log('Starting nutritionist registration with validated fields:', {
    userId,
    firstName: cleanFirstName,
    lastName: cleanLastName,
    phone: cleanPhone,
    specialization: specialization || null,
    certifications: certifications || null,
    experienceYears: experienceYears || 0,
    consultationFee: consultationFee || 300
  });

  try {
    // Use the general registration function with nutritionist role
    const registrationResult = await completeUserRegistration(
      userId,
      'nutritionist',
      cleanFirstName,
      cleanLastName,
      cleanPhone
    );

    // Update profile with nutritionist-specific fields
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        specialty: specialization && specialization.trim() !== '' ? specialization.trim() : null,
        consultation_fee: consultationFee || 300,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating nutritionist profile:', updateError);
      throw new Error(`Failed to update nutritionist profile: ${updateError.message}`);
    }

    console.log('Nutritionist registration completed successfully:', registrationResult);

    return {
      success: true,
      message: 'Nutritionist registration completed successfully',
      user_id: userId,
      role: 'nutritionist',
      phone: cleanPhone,
      registration_status: 'payment_complete',
      tasks_created: true
    };
  } catch (error: any) {
    console.error('Error in completeNutritionistRegistration:', error);
    throw new Error(`Nutritionist registration failed: ${error.message}`);
  }
};

// Enhanced professional registration function that calls the existing edge function
export const completeProfessionalRegistration = async (
  userId: string,
  firstName: string,
  lastName: string,
  phone: string,
  role: 'doctor' | 'nutritionist'
): Promise<RegistrationResponse> => {
  // Basic validation
  if (!userId || !firstName || !lastName || !phone) {
    throw new Error('User ID, first name, last name, and phone number are required');
  }

  const cleanPhone = phone.trim();
  if (cleanPhone === '') {
    throw new Error('Phone number cannot be empty');
  }

  const cleanFirstName = firstName.trim();
  const cleanLastName = lastName.trim();
  if (cleanFirstName === '' || cleanLastName === '') {
    throw new Error('First name and last name cannot be empty');
  }

  console.log('Starting professional registration with validated fields:', {
    userId,
    firstName: cleanFirstName,
    lastName: cleanLastName,
    phone: cleanPhone,
    role
  });

  try {
    // Call the existing complete-professional-registration edge function
    const { data, error } = await supabase.functions.invoke('complete-professional-registration', {
      body: {
        user_id: userId,
        phone: cleanPhone
      }
    });

    if (error) {
      console.error('Professional registration edge function error:', error);
      throw new Error(`Professional registration failed: ${error.message}`);
    }

    console.log('Professional registration edge function result:', data);

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response from professional registration function');
    }

    if (data.success === false) {
      throw new Error(data.error || 'Professional registration failed');
    }

    return {
      success: true,
      message: 'Professional registration completed successfully',
      user_id: userId,
      role: role,
      phone: cleanPhone,
      registration_status: 'complete',
      tasks_created: true
    };
  } catch (error: any) {
    console.error('Error in completeProfessionalRegistration:', error);
    throw new Error(`Professional registration failed: ${error.message}`);
  }
};
