
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAuthHandlers = () => {
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (
    email: string,
    password: string,
    userType: string,
    firstName?: string,
    lastName?: string,
    skipRoleCreation = false
  ) => {
    try {
      setLoading(true);
      console.log("Starting user registration process...", { skipRoleCreation });
      
      // Validate user type
      const validRoles = ['patient', 'doctor', 'nutritionist', 'administrator', 'reception'];
      if (!validRoles.includes(userType)) {
        throw new Error(`Invalid user type: ${userType}`);
      }

      // Determine if identifier is email or phone
      const isEmail = email.includes('@');
      let phoneNumber: string | undefined;
      let emailAddress: string;
      
      if (isEmail) {
        emailAddress = email;
      } else {
        phoneNumber = email;
        emailAddress = `${email.replace(/[^0-9]/g, '')}@temp.placeholder`;
      }

      console.log("Registration details:", { 
        emailAddress, 
        phoneNumber, 
        isEmail, 
        userType,
        skipRoleCreation
      });

      // Prepare user metadata for the database trigger
      const userMetadata = {
        user_type_string: userType,
        first_name: firstName,
        last_name: lastName,
        phone: phoneNumber
      };

      console.log("Attempting Supabase auth signup...");
      
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: emailAddress,
        password,
        options: {
          data: userMetadata
        }
      });

      if (signUpError) {
        console.error("Auth signup error:", signUpError);
        throw signUpError;
      }
      
      if (!authData.user) {
        throw new Error("Registration failed - no user data returned");
      }

      console.log("Auth user created successfully:", authData.user.id);

      // Update profile with phone number if provided
      if (phoneNumber) {
        console.log("Updating profile with phone number...");
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ phone: phoneNumber })
          .eq('id', authData.user.id);

        if (profileError) {
          console.error("Error updating profile:", profileError);
        } else {
          console.log("Profile updated successfully with phone number:", phoneNumber);
        }
      }

      // Database trigger handles role creation automatically
      console.log("Database trigger will handle role creation automatically");
      
      return { user: authData.user, session: authData.session };
      
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Registration failed");
      throw new Error("Account created but role assignment failed. Please contact support.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log("Attempting login...");
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      console.log("Login successful");
      return { user: data.user, session: data.session };
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Login failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    handleSignUp,
    handleLogin,
    loading
  };
};
