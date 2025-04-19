import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getAuthRedirectUrl } from "@/utils/environmentUtils";
import { TokenService } from "@/services/tokenService";

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

export interface PasswordUpdateResult {
  tokenExpired?: boolean;
  success?: boolean;
}

export const useAuthHandlers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast: uiToast } = useToast();
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
      
      uiToast({
        title: "Welcome back!",
        description: `Logged in as ${email}`
      });
      
      return data;
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message);
      uiToast({
        variant: "destructive",
        title: "Login failed",
        description: "Invalid email or password. Please try again."
      });
      throw error;
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
      uiToast({
        variant: "destructive",
        title: "Test Login Failed",
        description: error.message
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (email: string): Promise<void> => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resetRedirectUrl = TokenService.getPasswordResetRedirectUrl();
      console.log("Password reset redirect URL:", resetRedirectUrl);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: resetRedirectUrl
      });

      if (error) throw error;

      toast.success("Password reset email sent. Check your inbox and spam folders.");
      navigate('/auth?reset_sent=true');
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError(error.message);
      toast.error(error.message || "Failed to send reset email");
      throw error;
    } finally {
      setLoading(false);
    }
  };

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

      console.log("Password update result:", data ? "Success" : "No data returned");
      
      // Signal session change to force re-authentication
      const { error: signOutError } = await supabase.auth.signOut({ 
        scope: 'local' 
      });
      
      if (signOutError) {
        console.warn("Warning: Error during signout after password update:", signOutError);
      }

      toast.success("Password updated successfully!");
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

  const handleSignUp = async (
    email: string, 
    password: string, 
    userType: UserRole,
    firstName?: string,
    lastName?: string,
    patientData?: PatientData
  ): Promise<any> => {
    setLoading(true);
    setError(null);

    try {
      console.log('Creating new user:', email, userType);
      if (patientData) {
        console.log('Patient data to be saved:', patientData);
      }
      
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

      if (signUpError) {
        console.error('Signup error:', signUpError);
        throw signUpError;
      }
      
      if (!authData.user) {
        console.error('User creation failed - no user returned');
        throw new Error("User creation failed");
      }

      console.log('User created successfully:', authData.user);

      try {
        const roleResult = await createUserRole(authData.user.id, userType);
        console.log('User role created successfully:', roleResult);
      } catch (roleError: any) {
        console.error('Role creation error:', roleError);
        toast.warning("Account created but role assignment had an issue. Some features may be limited.");
      }

      if (userType === 'patient' && patientData) {
        console.log('Creating patient details for user:', authData.user.id);
        
        try {
          const ageNumber = parseInt(patientData.age, 10);
          
          const heightNumber = patientData.height ? parseFloat(patientData.height) : null;
          
          const patientResult = await createPatientDetails(
            authData.user.id,
            ageNumber,
            patientData.gender,
            patientData.bloodGroup,
            patientData.allergies || patientData.knownAllergies || null,
            patientData.emergencyContact,
            heightNumber,
            patientData.birthDate,
            patientData.foodHabit || null,
            patientData.currentMedicalConditions || null
          );
          
          console.log('Patient details created successfully:', patientResult);
        } catch (patientError: any) {
          console.error('Error in patient data creation:', patientError);
          toast.warning("Account created but there was an issue saving your patient details. Please update your profile later.");
        }
      }

      navigate('/dashboard');
      return authData;
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message);
      uiToast({
        variant: "destructive",
        title: "Signup failed",
        description: error.message
      });
      throw error;
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
    handleResetPassword,
    handleUpdatePassword,
    setError,
  };
};
