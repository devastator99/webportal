
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export interface PatientData {
  age?: string;
  gender?: string;
  bloodGroup?: string;
  allergies?: string;
  emergencyContact?: string;
  height?: string;
  birthDate?: string;
  foodHabit?: string;
  knownAllergies?: string;
  currentMedicalConditions?: string;
}

export function useAuthHandlers() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSignUp = async (
    emailOrPhone: string,
    password: string,
    userType: 'patient' | 'doctor' | 'nutritionist',
    firstName?: string,
    lastName?: string,
    patientData?: PatientData
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Determine if input is email or phone
      const isEmail = emailOrPhone.includes('@');
      const signUpData: any = {
        password,
        options: {
          data: {
            user_type: userType,
            first_name: firstName,
            last_name: lastName,
          }
        }
      };

      if (isEmail) {
        signUpData.email = emailOrPhone;
      } else {
        // For phone registration, use phone as email since Supabase requires email
        // We'll store the actual phone in user metadata
        signUpData.email = emailOrPhone; // Use phone as email for now
        signUpData.options.data.phone = emailOrPhone;
      }

      const { data, error } = await supabase.auth.signUp(signUpData);

      if (error) {
        console.error('Signup error:', error);
        throw error;
      }

      if (!data.user) {
        throw new Error('User creation failed');
      }

      // If patient with additional data, store patient details
      if (userType === 'patient' && patientData) {
        try {
          const { data: functionData, error: functionError } = await supabase.functions.invoke(
            'upsert-patient-details',
            {
              body: {
                patientId: data.user.id,
                age: patientData.age,
                gender: patientData.gender,
                bloodGroup: patientData.bloodGroup,
                allergies: patientData.allergies,
                emergencyContact: patientData.emergencyContact, // This can be undefined/null
                height: patientData.height,
                birthDate: patientData.birthDate,
                foodHabit: patientData.foodHabit,
                currentMedicalConditions: patientData.currentMedicalConditions
              }
            }
          );

          if (functionError) {
            console.error('Error storing patient details:', functionError);
            // Don't throw here, registration was successful even if patient details failed
          }
        } catch (detailsError) {
          console.error('Error calling patient details function:', detailsError);
          // Continue with registration success
        }
      }

      toast({
        title: "Registration successful",
        description: `Welcome ${firstName}! Please check your email to verify your account.`,
      });

      return data.user;
    } catch (error: any) {
      console.error('Registration failed:', error);
      const errorMessage = error.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: errorMessage,
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (emailOrPhone: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      // Determine if input is email or phone
      const isEmail = emailOrPhone.includes('@');
      
      let signInData: any = {
        password
      };

      if (isEmail) {
        signInData.email = emailOrPhone;
      } else {
        // For phone login, we need to find the user first
        // Since we stored phone as email during registration, use it as email
        signInData.email = emailOrPhone;
      }

      const { data, error } = await supabase.auth.signInWithPassword(signInData);

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      if (!data.user) {
        throw new Error('Login failed');
      }

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });

      return data.user;
    } catch (error: any) {
      console.error('Login failed:', error);
      const errorMessage = error.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Login failed", 
        description: errorMessage,
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    handleSignUp,
    handleSignIn,
    error,
    loading,
    setError
  };
}
