
import { useState } from "react";
import { supabase, createUserRole, createPatientDetails } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { formatDateForDatabase } from "@/utils/dateUtils";

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

  const handleResetPassword = async (email: string) => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get the current origin but handle both development and production cases
      const origin = window.location.origin;
      const redirectUrl = `${origin}/auth?reset=true`;
      console.log("Reset password redirect URL:", redirectUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        throw error;
      }

      uiToast({
        title: "Password reset email sent",
        description: "Check your email for a password reset link. It will expire in 1 hour."
      });
      
      toast.success("Password reset email sent. Check your inbox and spam folders.");
      
      return true;
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError(error.message);
      uiToast({
        variant: "destructive",
        title: "Password reset failed",
        description: error.message || "Failed to send reset email. Please try again."
      });
      
      toast.error(`Password reset failed: ${error.message || "Failed to send reset email"}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (newPassword: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      uiToast({
        title: "Password updated",
        description: "Your password has been successfully updated"
      });
      
      navigate('/auth');
      toast.success("Password updated successfully. You can now login with your new password.");
      return true;
    } catch (error: any) {
      console.error('Password update error:', error);
      
      // Check if it's a token expired error
      if (error.message.includes('token is expired') || error.message.includes('Invalid user')) {
        setError("Your password reset link has expired. Please request a new one.");
        
        uiToast({
          variant: "destructive",
          title: "Link expired",
          description: "Your password reset link has expired. Please request a new one."
        });
        
        // Signal that we should show the expired token UI
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
      
      // Step 1: Create the user in Auth
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

      // Step 2: Create user role using RPC function
      try {
        const roleResult = await createUserRole(authData.user.id, userType);
        console.log('User role created successfully:', roleResult);
      } catch (roleError: any) {
        console.error('Role creation error:', roleError);
        // Continue with the registration but notify the user
        toast.warning("Account created but role assignment had an issue. Some features may be limited.");
      }

      // Step 3: If it's a patient, save the additional patient data using RPC function
      if (userType === 'patient' && patientData) {
        console.log('Creating patient details for user:', authData.user.id);
        
        try {
          // Parse the age as a number for the database
          const ageNumber = parseInt(patientData.age, 10);
          
          // Parse the height as a number if provided
          const heightNumber = patientData.height ? parseFloat(patientData.height) : null;
          
          // Create the patient details using the RPC function
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

      // Navigate to dashboard after successful registration
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
