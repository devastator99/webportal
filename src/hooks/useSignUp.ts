
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PatientData {
  age: string;
  gender: string;
  bloodGroup: string;
  allergies?: string;
  emergencyContact: string;
  height?: string;
  birthDate?: string | null;
  foodHabit?: string;
  knownAllergies?: string;
  currentMedicalConditions?: string;
}

export type UserRole = 'patient' | 'doctor' | 'nutritionist' | 'administrator';

export const useSignUp = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (
    email: string, 
    password: string, 
    userType: UserRole, 
    firstName?: string, 
    lastName?: string,
    patientData?: PatientData
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            user_type: userType,
          },
        },
      });
      
      if (authError) throw authError;
      
      const user = authData.user;
      
      if (!user || !user.id) {
        throw new Error("User creation failed");
      }
      
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: firstName,
          last_name: lastName,
          email: email,
        });
      
      if (profileError) throw profileError;
      
      // Create user role using RPC
      const { error: roleError } = await supabase.rpc('create_new_user_role', {
        p_user_id: user.id,
        p_role_name: userType
      });
      
      if (roleError) throw roleError;
      
      if (userType === 'patient' && patientData) {
        const { error: patientError } = await supabase.rpc('create_new_patient_details', {
          p_patient_id: user.id,
          p_age: patientData.age,
          p_gender: patientData.gender,
          p_blood_group: patientData.bloodGroup,
          p_allergies: patientData.allergies || '',
          p_emergency_contact: patientData.emergencyContact,
          p_height: patientData.height || null,
          p_birth_date: patientData.birthDate || null,
          p_food_habit: patientData.foodHabit || null,
          p_known_allergies: patientData.knownAllergies || null,
          p_medical_conditions: patientData.currentMedicalConditions || null
        });
        
        if (patientError) throw patientError;
      }
      
      return user;
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    handleSignUp,
    setError,
  };
};
