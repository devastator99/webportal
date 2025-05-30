
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  phone?: string;
}

export const useRegistrationAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationStep, setRegistrationStep] = useState<string>("");

  const handleRegistration = async (
    identifier: string,
    password: string,
    userType: string,
    firstName?: string,
    lastName?: string,
    patientData?: PatientData
  ) => {
    setLoading(true);
    setError(null);
    setRegistrationStep("Creating account...");

    try {
      console.log("Registration: Starting user registration process with auth hook...");
      
      // Validate inputs
      if (!identifier || !password || !firstName || !lastName) {
        throw new Error("Please fill in all required fields");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      // Validate user type
      const validRoles = ['patient', 'doctor', 'nutritionist', 'administrator', 'reception'];
      if (!validRoles.includes(userType)) {
        throw new Error(`Invalid user type: ${userType}`);
      }

      // Determine if identifier is email or phone
      const isEmail = identifier.includes('@');
      let phoneNumber: string | undefined;
      let emailAddress: string;
      
      if (isEmail) {
        emailAddress = identifier;
        phoneNumber = patientData?.phone || patientData?.emergencyContact;
      } else {
        phoneNumber = identifier;
        emailAddress = `${identifier.replace(/[^0-9]/g, '')}@temp.placeholder`;
      }

      console.log("Registration: Details:", { 
        emailAddress, 
        phoneNumber, 
        isEmail, 
        userType
      });

      // Prepare user metadata for the auth hook to process
      const userMetadata = {
        user_type_string: userType,
        first_name: firstName,
        last_name: lastName,
        phone: phoneNumber,
        primary_contact: identifier,
        // Include patient data in metadata for the hook to process
        ...(userType === 'patient' && patientData ? {
          age: patientData.age,
          gender: patientData.gender,
          bloodGroup: patientData.bloodGroup,
          allergies: patientData.allergies,
          emergencyContact: patientData.emergencyContact,
          height: patientData.height,
          birthDate: patientData.birthDate,
          foodHabit: patientData.foodHabit,
          knownAllergies: patientData.knownAllergies,
          currentMedicalConditions: patientData.currentMedicalConditions
        } : {})
      };

      // Auth signup - the hook will handle profile and role creation
      console.log("Registration: Attempting Supabase auth signup with hook metadata...");
      setRegistrationStep("Setting up your account...");
      
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: emailAddress,
        password,
        options: {
          data: userMetadata
        }
      });

      if (signUpError) {
        console.error("Registration: Auth signup error:", signUpError);
        
        if (signUpError.message?.includes('email address')) {
          throw new Error("This email address is already registered or invalid");
        } else if (signUpError.message?.includes('password')) {
          throw new Error("Password requirements not met - must be at least 6 characters");
        } else if (signUpError.message?.includes('signup disabled')) {
          throw new Error("New user registration is currently disabled. Please contact support.");
        } else {
          throw new Error(`Registration failed: ${signUpError.message || "Unknown error occurred"}`);
        }
      }
      
      if (!authData.user) {
        throw new Error("Registration failed - please try again or contact support");
      }

      console.log("Registration: Auth user created successfully:", authData.user.id);
      console.log("Registration: Auth hook will handle profile and role creation automatically");
      
      setRegistrationStep("Account ready!");
      console.log("Registration: Registration completed successfully - auth hook will process user setup");
      
      return authData.user;
      
    } catch (error: any) {
      console.error("Registration: Registration error:", error);
      
      let userMessage = "Registration failed. Please try again.";
      
      if (error.message?.includes('email')) {
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
      setRegistrationStep("");
    }
  };

  return {
    handleRegistration,
    loading,
    error,
    registrationStep,
    setError
  };
};
