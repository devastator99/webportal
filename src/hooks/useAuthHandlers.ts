
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase, completeUserRegistration, ValidUserRole } from "@/integrations/supabase/client";

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
      console.log("Starting unified user registration process...");
      
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

      // Determine if identifier is email or phone and extract phone number
      const isEmail = identifier.includes('@');
      let phoneNumber: string;
      let emailAddress: string;
      
      if (isEmail) {
        emailAddress = identifier;
        // Phone must be provided in patientData for email registrations
        phoneNumber = patientData?.phone || patientData?.emergencyContact || '';
        if (!phoneNumber) {
          throw new Error("Phone number is required for registration");
        }
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

      // Validate phone number is available
      if (!phoneNumber || phoneNumber.trim() === '') {
        throw new Error("Phone number is required for registration and notifications");
      }

      // Step 1: Auth signup with metadata including phone
      const signUpData = {
        email: emailAddress,
        password,
        options: {
          data: {
            user_type_string: userType,
            first_name: firstName,
            last_name: lastName,
            phone: phoneNumber, // Store phone in auth metadata
            primary_contact: phoneNumber
          }
        }
      };

      console.log("Attempting Supabase auth signup with phone:", phoneNumber);
      
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

      console.log("Auth user created successfully:", authData.user.id, "with phone:", phoneNumber);

      // Step 2: Complete user registration using unified RPC (atomic operation)
      try {
        console.log("Completing user registration with unified RPC and phone:", phoneNumber);
        
        const registrationResult = await completeUserRegistration(
          authData.user.id,
          userType as ValidUserRole,
          firstName,
          lastName,
          phoneNumber, // Pass the phone number explicitly
          userType === 'patient' ? patientData : undefined
        );
        
        console.log("Unified registration completed successfully:", registrationResult);
        
      } catch (registrationError: any) {
        console.error("Unified registration failed:", registrationError);
        throw new Error(`Account created but setup failed: ${registrationError.message}`);
      }

      console.log("Registration completed successfully with phone:", phoneNumber);
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
      } else if (error.message?.includes('phone')) {
        userMessage = "Phone number is required for registration and notifications.";
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
