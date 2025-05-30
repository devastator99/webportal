
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase, createUserRole, ValidUserRole } from "@/integrations/supabase/client";

export interface PatientData {
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
  phone?: string; // Add phone property for primary contact
}

export const useAuthHandlers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const retryWithDelay = async (fn: () => Promise<any>, retries = 2, delay = 1000): Promise<any> => {
    try {
      return await fn();
    } catch (error: any) {
      console.log("Retry attempt error details:", {
        name: error.name,
        message: error.message,
        status: error.status,
        code: error.code
      });
      
      if (retries > 0 && (error.name === 'AuthRetryableFetchError' || error.message?.includes('Failed to fetch'))) {
        console.log(`Supabase connection issue, retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryWithDelay(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  };

  const handleSignUp = async (
    identifier: string,
    password: string,
    userType: string,
    firstName?: string,
    lastName?: string,
    patientData?: PatientData
  ) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Starting user registration process...");
      
      // Validate inputs
      if (!identifier || !password || !firstName || !lastName) {
        throw new Error("Please fill in all required fields");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      // Validate user type
      const validRoles: ValidUserRole[] = ['patient', 'doctor', 'nutritionist', 'administrator', 'reception'];
      if (!validRoles.includes(userType as ValidUserRole)) {
        throw new Error(`Invalid user type: ${userType}`);
      }

      // Determine if identifier is email or phone
      const isEmail = identifier.includes('@');
      let phoneNumber: string | undefined;
      let emailAddress: string;
      
      if (isEmail) {
        emailAddress = identifier;
        // Phone might be provided in patientData or other form data
        phoneNumber = patientData?.emergencyContact; // Fallback, should be passed separately
      } else {
        phoneNumber = identifier;
        emailAddress = `${identifier.replace(/[^0-9]/g, '')}@temp.placeholder`;
      }

      console.log("Registration details:", { 
        emailAddress, 
        phoneNumber, 
        isEmail, 
        userType 
      });

      // Auth signup with metadata
      const signUpData = {
        email: emailAddress,
        password,
        options: {
          data: {
            user_type_string: userType,
            first_name: firstName,
            last_name: lastName,
            phone: phoneNumber,
            primary_contact: identifier
          }
        }
      };

      console.log("Attempting Supabase auth signup...");
      
      const { data: authData, error: signUpError } = await retryWithDelay(async () => {
        return await supabase.auth.signUp(signUpData);
      });

      if (signUpError) {
        console.error("Auth signup error:", signUpError);
        
        if (signUpError.message?.includes('email address')) {
          throw new Error("This email address is already registered or invalid");
        } else if (signUpError.message?.includes('password')) {
          throw new Error("Password requirements not met - must be at least 6 characters");
        } else if (signUpError.message?.includes('signup disabled')) {
          throw new Error("New user registration is currently disabled. Please contact support.");
        } else if (signUpError.name === 'AuthRetryableFetchError' || signUpError.message?.includes('Failed to fetch')) {
          throw new Error("Unable to connect to authentication service. Please check your internet connection and try again.");
        } else {
          throw new Error(`Registration failed: ${signUpError.message || "Unknown error occurred"}`);
        }
      }
      
      if (!authData.user) {
        throw new Error("Registration failed - please try again or contact support");
      }

      console.log("Auth user created successfully:", authData.user.id);

      // Step 2: Update profiles table with phone number (most important fix)
      try {
        console.log("Updating profile with phone number...");
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            phone: phoneNumber,
            first_name: firstName,
            last_name: lastName
          })
          .eq('id', authData.user.id);
        
        if (profileError) {
          console.error("Error updating profile with phone:", profileError);
          // Don't throw here as the main account creation was successful
        } else {
          console.log("Profile updated successfully with phone number:", phoneNumber);
        }
      } catch (profileUpdateError: any) {
        console.error("Exception updating profile:", profileUpdateError);
        // Don't throw here as the main account creation was successful
      }

      // Step 3: Create user role using our RPC function with proper type
      try {
        console.log("Creating user role...");
        const roleResult = await createUserRole(authData.user.id, userType as ValidUserRole);
        console.log("User role created successfully:", roleResult);
        
        // The createUserRole function will throw if there's an error
        // so if we get here, it was successful
      } catch (roleError: any) {
        console.error("Error creating user role:", roleError);
        throw new Error("Account created but role assignment failed. Please contact support.");
      }
      
      // Step 4: Handle patient-specific data
      if (userType === "patient" && patientData) {
        try {
          console.log("Creating patient details...");
          const { data: patientResult, error: patientError } = await supabase.rpc(
            'upsert_patient_details',
            {
              p_user_id: authData.user.id,
              p_age: patientData.age ? parseInt(patientData.age, 10) : null,
              p_gender: patientData.gender || null,
              p_blood_group: patientData.bloodGroup || null,
              p_allergies: patientData.allergies || null,
              p_emergency_contact: patientData.emergencyContact || null,
              p_height: patientData.height ? parseFloat(patientData.height) : null,
              p_birth_date: patientData.birthDate || null,
              p_food_habit: patientData.foodHabit || null,
              p_current_medical_conditions: patientData.currentMedicalConditions || null
            }
          );
          
          if (patientError) {
            console.error("Error creating patient details:", patientError);
            toast({
              title: "Account Created",
              description: "Your account was created successfully, but some additional details could not be saved. You can update them later in your profile.",
              variant: "default",
            });
          } else if (patientResult && typeof patientResult === 'object' && patientResult.success === false) {
            console.error("Patient details creation failed:", patientResult);
            toast({
              title: "Account Created", 
              description: "Your account was created successfully, but some additional details could not be saved. You can update them later in your profile.",
              variant: "default",
            });
          } else {
            console.log("Patient details created successfully");
          }
        } catch (patientError: any) {
          console.error("Exception creating patient details:", patientError);
          // Don't throw here as the main account was created successfully
        }
      }

      console.log("Registration completed successfully");
      return authData.user;
      
    } catch (error: any) {
      console.error("Registration error:", error);
      
      let userMessage = "Registration failed. Please try again.";
      
      if (error.name === 'AuthRetryableFetchError' || error.message?.includes('Failed to fetch')) {
        userMessage = "Unable to connect to the service. Please check your internet connection and try again.";
      } else if (error.message?.includes('email')) {
        userMessage = "Email address issue - it may already be in use or invalid.";
      } else if (error.message?.includes('password')) {
        userMessage = "Password must be at least 6 characters long.";
      } else if (error.message?.includes('rate limit')) {
        userMessage = "Too many registration attempts. Please wait a few minutes and try again.";
      } else if (error.message) {
        userMessage = error.message;
      }
      
      setError(userMessage);
      throw new Error(userMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (identifier: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Starting sign in process...");
      
      if (!identifier || !password) {
        throw new Error("Please enter both email/phone and password");
      }

      // Determine if identifier is email or phone
      const isEmail = identifier.includes('@');
      const signInData = isEmail 
        ? { email: identifier, password }
        : { email: `${identifier.replace(/[^0-9]/g, '')}@temp.placeholder`, password };

      console.log("Attempting Supabase auth signin...");
      
      const { data: authData, error: signInError } = await retryWithDelay(async () => {
        return await supabase.auth.signInWithPassword(signInData);
      });

      if (signInError) {
        console.error("Auth signin error:", signInError);
        
        if (signInError.message?.includes('credentials') || signInError.message?.includes('password')) {
          throw new Error("Invalid credentials. Please check your email/phone and password.");
        } else if (signInError.message?.includes('email not confirmed')) {
          throw new Error("Please check your email and click the confirmation link before signing in.");
        } else if (signInError.name === 'AuthRetryableFetchError' || signInError.message?.includes('Failed to fetch')) {
          throw new Error("Unable to connect to the service. Please check your internet connection and try again.");
        } else {
          throw new Error("Sign in failed. Please try again.");
        }
      }
      
      if (!authData.user) {
        throw new Error("Sign in failed - please try again");
      }

      console.log("Sign in successful");
      return authData.user;
      
    } catch (error: any) {
      console.error("Sign in error:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    handleSignUp,
    handleSignIn,
    loading,
    error,
    setError
  };
};
