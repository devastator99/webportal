import { useState } from "react";
import { supabase, createUserRole, createPatientDetails } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { formatDateForDatabase } from "@/utils/dateUtils";
import { getAuthRedirectUrl, getProjectId, getBaseUrl, getEnvironmentInfo } from "@/utils/environmentUtils";

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
      // Get current origin for more reliable redirects
      const currentOrigin = window.location.origin;
      console.log("Environment information for password reset:");
      console.log("- Current origin:", currentOrigin);
      console.log("- Current hostname:", window.location.hostname);
      console.log("- Current pathname:", window.location.pathname);
      
      const redirectUrl = `${currentOrigin}/auth?reset=true`;
      
      console.log("Password reset configuration:");
      console.log("- Redirect URL:", redirectUrl);
      
      // Use the resetPasswordForEmail API with explicit redirectTo
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      console.log("Reset password response:", { data, error });

      if (error) {
        console.error("Reset password API error:", error);
        throw error;
      }

      // Show success messages to the user
      uiToast({
        title: "Password reset email sent",
        description: "Check your email for a password reset link. It will expire in 1 hour."
      });
      
      toast.success("Password reset email sent. Check your inbox and spam folders.");
      
      // Navigate to the reset_sent confirmation page
      navigate('/auth?reset_sent=true');
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      // Show detailed error information
      let errorMessage = error.message || "Failed to send reset email";
      if (error.status) {
        errorMessage += ` (Status: ${error.status})`;
      }
      
      setError(errorMessage);
      
      uiToast({
        variant: "destructive",
        title: "Password reset failed",
        description: errorMessage
      });
      
      toast.error(`Password reset failed: ${errorMessage}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (newPassword: string): Promise<boolean | PasswordUpdateResult> => {
    setLoading(true);
    setError(null);

    try {
      console.log("Attempting to update password");
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      console.log("Update password response:", { data, error });

      if (error) {
        console.error("Update password API error:", error);
        throw error;
      }

      console.log("Password updated successfully");
      
      uiToast({
        title: "Password updated",
        description: "Your password has been successfully updated"
      });
      
      navigate('/auth');
      toast.success("Password updated successfully. You can now login with your new password.");
      return { success: true };
    } catch (error: any) {
      console.error('Password update error:', error);
      
      // Handle known error cases with explicit messages
      if (error.message && (
        error.message.includes('token is expired') || 
        error.message.includes('JWT expired') ||
        error.message.includes('Invalid user') ||
        error.message.includes('invalid JWT')
      )) {
        const expiredMessage = "Your password reset link has expired. Please request a new one.";
        setError(expiredMessage);
        
        uiToast({
          variant: "destructive",
          title: "Link expired",
          description: expiredMessage
        });
        
        return { tokenExpired: true };
      }
      
      setError(error.message);
      uiToast({
        variant: "destructive",
        title: "Password update failed",
        description: error.message || "Failed to update password. Please try again."
      });
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
