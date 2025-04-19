
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';

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

export type UserRole = 'patient' | 'doctor' | 'nutritionist' | 'admin' | 'administrator';

export const useAuthHandlers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Handle password update
  const handleUpdatePassword = async (newPassword: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      await supabase.auth.signOut();
      
      toast.success("Password updated successfully! Please log in with your new password.");
      navigate('/auth');
      
      return true;
    } catch (error: any) {
      console.error('Password update error:', error);
      toast.error(error.message || "Failed to update password");
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
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`
      });
      
      if (error) throw error;
      
      toast.success("Password reset link sent to your email");
      navigate('/auth?reset_sent=true');
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(err.message);
      toast.error(err.message || "Failed to send password reset email");
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
      
      // Convert userType if it's 'admin' to 'administrator' to match the schema
      const roleForDb = userType === 'admin' ? 'administrator' : userType;
      
      // Create user role using a direct table insert instead of RPC
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: roleForDb
        });
      
      if (roleError) throw roleError;
      
      if (userType === 'patient' && patientData) {
        // For patient details - retain the original implementation that was working
        const { error: patientError } = await supabase
          .from('patient_details')
          .insert({
            patient_id: user.id,
            age: patientData.age,
            gender: patientData.gender,
            blood_group: patientData.bloodGroup,
            allergies: patientData.allergies || '',
            emergency_contact: patientData.emergencyContact,
            height: patientData.height || null,
            birth_date: patientData.birthDate || null,
            food_habit: patientData.foodHabit || null,
            known_allergies: patientData.knownAllergies || null,
            current_medical_conditions: patientData.currentMedicalConditions || null
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
