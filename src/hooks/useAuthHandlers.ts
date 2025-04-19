
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export const useAuthHandlers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleUpdatePassword = async (newPassword: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      // Automatically sign out after password update
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

  const handleLogin = async (email: string, password: string) => {
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

  const handleSignUp = async (
    email: string, 
    password: string, 
    userType: 'patient' | 'doctor' | 'nutritionist', 
    firstName?: string, 
    lastName?: string,
    patientData?: PatientData
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      // Create new user account
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
      
      // Store user profile information
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: firstName,
          last_name: lastName,
          email: email,
        });
      
      if (profileError) throw profileError;
      
      // Create user role
      await supabase.rpc('create_user_role', {
        user_id: user.id,
        role_name: userType
      });
      
      // For patients, store additional medical details
      if (userType === 'patient' && patientData) {
        await supabase.rpc('create_patient_details', {
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
          medical_conditions: patientData.currentMedicalConditions || null
        });
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

  const handleTestLogin = async (userType: 'doctor' | 'patient' | 'nutritionist' | 'admin') => {
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
