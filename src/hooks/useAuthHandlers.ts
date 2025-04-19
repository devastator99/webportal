import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, createUserRole, createPatientDetails } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';
import { getAuthRedirectUrl } from '@/utils/environmentUtils';

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

export type UserRole = 'patient' | 'doctor' | 'nutritionist' | 'admin';

export const useAuthHandlers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Handle password update
  const handleUpdatePassword = async (newPassword: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      console.log("Attempting to update password");
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error("Password update error:", error);
        throw error;
      }

      console.log("Password updated successfully");
      return true;
    } catch (error: any) {
      console.error('Password update error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset
  const handleResetPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get the correct redirect URL for the current environment
      const redirectUrl = getAuthRedirectUrl('/auth/reset-password');
      
      console.log("Sending password reset email with redirect URL:", redirectUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      
      if (error) {
        console.error("Password reset email error:", error);
        throw error;
      }
      
      console.log("Password reset email sent successfully");
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign Up
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
      
      // Create user role using Edge Function instead of direct RPC
      const roleResult = await createUserRole(user.id, userType);
      
      if (!roleResult || (roleResult as any).error) {
        throw new Error((roleResult as any).error || 'Failed to assign user role');
      }
      
      if (userType === 'patient' && patientData) {
        // Using Edge Function instead of direct RPC
        const patientResult = await createPatientDetails(
          user.id,
          parseInt(patientData.age),
          patientData.gender,
          patientData.bloodGroup,
          patientData.allergies || null,
          patientData.emergencyContact,
          patientData.height ? parseFloat(patientData.height) : null,
          patientData.birthDate || null,
          patientData.foodHabit || null,
          patientData.currentMedicalConditions || null
        );
        
        if (!patientResult || (patientResult as any).error) {
          throw new Error((patientResult as any).error || 'Failed to create patient details');
        }
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

  // Handle Login
  const handleLogin = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      return data.user;
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Handle Test Login
  const handleTestLogin = async (userType: 'doctor' | 'patient' | 'nutritionist' | 'admin'): Promise<User> => {
    setLoading(true);
    setError(null);
    
    try {
      let email, password;
      
      switch (userType) {
        case 'doctor':
          email = 'doctor@example.com';
          password = 'password123';
          break;
        case 'patient':
          email = 'patient@example.com';
          password = 'password123';
          break;
        case 'nutritionist':
          email = 'nutritionist@example.com';
          password = 'password123';
          break;
        case 'admin':
          email = 'admin@example.com';
          password = 'password123';
          break;
        default:
          throw new Error("Invalid user type");
      }
      
      return await handleLogin(email, password);
    } catch (err: any) {
      console.error("Test login error:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    handleLogin,
    handleSignUp,
    handleResetPassword,
    handleUpdatePassword,
    handleTestLogin,
    setError,
  };
};
