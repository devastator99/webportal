
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

type UserRole = "patient" | "doctor" | "nutritionist" | "administrator";

export interface PatientData {
  age: string;
  gender: string;
  bloodGroup: string;
  allergies?: string;
  emergencyContact: string;
  height?: string;
  birthDate?: string;
  foodHabit?: string;
  knownAllergies?: string;
  currentMedicalConditions?: string;
}

export const useAuthHandlers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Attempting login with:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      if (!data.user) {
        throw new Error('No user returned from login');
      }

      console.log('Login successful:', data.user);
      
      // Get user role
      const { data: roleData, error: roleError } = await supabase
        .rpc('get_user_role', {
          lookup_user_id: data.user.id
        });

      if (roleError) {
        console.error('Error fetching role:', roleError);
        throw roleError;
      }

      console.log('User role:', roleData);

      navigate('/dashboard');
      
      toast({
        title: "Welcome back!",
        description: `Logged in as ${email}`
      });
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Invalid email or password. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = async (userType: "patient" | "doctor" | "nutritionist" | "administrator") => {
    setLoading(true);
    setError(null);

    try {
      let email: string;
      let password: string;

      switch (userType) {
        case "patient":
          email = "ram.naresh@example.com";
          password = "testpassword123";
          break;
        case "doctor":
          email = "vinay.pulkit@example.com";
          password = "testpassword123";
          break;
        case "nutritionist":
          email = "mary.johnson@example.com";
          password = "testpassword123";
          break;
        case "administrator":
          email = "admin@example.com";
          password = "testpassword123";
          break;
        default:
          throw new Error("Invalid user type for test login");
      }

      await handleLogin(email, password);
    } catch (error: any) {
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Test Login Failed",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

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
      console.log('Creating new user:', email, userType);
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: userType,
            first_name: firstName,
            last_name: lastName
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("User creation failed");

      console.log('User created:', authData.user);

      // Create user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: userType
        });

      if (roleError) {
        console.error('Role creation error:', roleError);
        throw roleError;
      }

      // If it's a patient, save the additional patient data
      if (userType === 'patient' && patientData) {
        // Use the RPC function to create patient details with type assertion
        const { error: patientDataError } = await supabase.rpc(
          'create_patient_details' as any,
          {
            p_user_id: authData.user.id,
            p_age: parseInt(patientData.age),
            p_gender: patientData.gender,
            p_blood_group: patientData.bloodGroup,
            p_allergies: patientData.allergies || patientData.knownAllergies || null,
            p_emergency_contact: patientData.emergencyContact,
            p_height: patientData.height ? parseFloat(patientData.height) : null,
            p_birth_date: patientData.birthDate || null,
            p_food_habit: patientData.foodHabit || null,
            p_current_medical_conditions: patientData.currentMedicalConditions || null
          }
        );

        if (patientDataError) {
          console.error('Patient data creation error:', patientDataError);
          toast({
            variant: "destructive",
            title: "Patient data creation error",
            description: "Account created but patient details couldn't be saved. Please update your profile later."
          });
          // Continue with account creation even if patient details fail
        }
      }

      navigate('/dashboard');

      toast({
        title: "Account created successfully!",
        description: "Please check your email to confirm your account."
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    handleLogin,
    handleSignUp,
    handleTestLogin,
    setError,
  };
};
