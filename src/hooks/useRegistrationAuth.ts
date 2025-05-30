
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
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
  phone?: string;
}

export const useRegistrationAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationStep, setRegistrationStep] = useState<string>("");

  const retryWithDelay = async (fn: () => Promise<any>, retries = 2, delay = 1000): Promise<any> => {
    try {
      return await fn();
    } catch (error: any) {
      console.log("Registration retry attempt error details:", {
        name: error.name,
        message: error.message,
        status: error.status,
        code: error.code
      });
      
      if (retries > 0 && (error.name === 'AuthRetryableFetchError' || error.message?.includes('Failed to fetch'))) {
        console.log(`Registration: Supabase connection issue, retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryWithDelay(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  };

  const handleRegistration = async (
    identifier: string,
    password: string,
    userType: string,
    firstName?: string,
    lastName?: string,
    patientData?: PatientData,
    skipRoleCreation = false
  ) => {
    setLoading(true);
    setError(null);
    setRegistrationStep("Creating account...");

    try {
      console.log("Registration: Starting user registration process...", { skipRoleCreation });
      
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
        phoneNumber = patientData?.emergencyContact;
      } else {
        phoneNumber = identifier;
        emailAddress = `${identifier.replace(/[^0-9]/g, '')}@temp.placeholder`;
      }

      console.log("Registration: Details:", { 
        emailAddress, 
        phoneNumber, 
        isEmail, 
        userType,
        skipRoleCreation
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

      console.log("Registration: Attempting Supabase auth signup...");
      
      const { data: authData, error: signUpError } = await retryWithDelay(async () => {
        return await supabase.auth.signUp(signUpData);
      });

      if (signUpError) {
        console.error("Registration: Auth signup error:", signUpError);
        
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

      console.log("Registration: Auth user created successfully:", authData.user.id);
      setRegistrationStep("Updating profile...");

      // Update profiles table with phone number
      try {
        console.log("Registration: Updating profile with phone number...");
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            phone: phoneNumber,
            first_name: firstName,
            last_name: lastName
          })
          .eq('id', authData.user.id);
        
        if (profileError) {
          console.error("Registration: Error updating profile with phone:", profileError);
        } else {
          console.log("Registration: Profile updated successfully with phone number:", phoneNumber);
        }
      } catch (profileUpdateError: any) {
        console.error("Registration: Exception updating profile:", profileUpdateError);
      }

      // Create user role SYNCHRONOUSLY - this is the critical fix
      if (!skipRoleCreation) {
        setRegistrationStep("Setting up your account...");
        console.log("Registration: Creating user role synchronously...");
        
        try {
          // CRITICAL: Wait for role creation to complete before proceeding
          const roleResult = await createUserRole(authData.user.id, userType as ValidUserRole);
          console.log("Registration: User role created successfully:", roleResult);
          
          // Verify role was actually created by checking it exists
          setRegistrationStep("Verifying account setup...");
          const { data: roleCheck, error: roleCheckError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', authData.user.id)
            .single();
          
          if (roleCheckError || !roleCheck) {
            console.error("Registration: Role verification failed:", roleCheckError);
            throw new Error("Role creation verification failed. Please contact support.");
          }
          
          console.log("Registration: Role verified successfully:", roleCheck.role);
          
        } catch (roleError: any) {
          console.error("Registration: Error creating user role:", roleError);
          throw new Error("Account created but role assignment failed. Please contact support.");
        }
      } else {
        console.log("Registration: Skipping role creation as requested");
      }
      
      // Handle patient-specific data
      if (userType === "patient" && patientData) {
        setRegistrationStep("Saving additional details...");
        try {
          console.log("Registration: Creating patient details...");
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
            console.error("Registration: Error creating patient details:", patientError);
            toast({
              title: "Account Created",
              description: "Your account was created successfully, but some additional details could not be saved. You can update them later in your profile.",
              variant: "default",
            });
          } else if (patientResult && typeof patientResult === 'object' && patientResult.success === false) {
            console.error("Registration: Patient details creation failed:", patientResult);
            toast({
              title: "Account Created", 
              description: "Your account was created successfully, but some additional details could not be saved. You can update them later in your profile.",
              variant: "default",
            });
          } else {
            console.log("Registration: Patient details created successfully");
          }
        } catch (patientError: any) {
          console.error("Registration: Exception creating patient details:", patientError);
        }
      }

      setRegistrationStep("Account ready!");
      console.log("Registration: Registration completed successfully");
      return authData.user;
      
    } catch (error: any) {
      console.error("Registration: Registration error:", error);
      
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
