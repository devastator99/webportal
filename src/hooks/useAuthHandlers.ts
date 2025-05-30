
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
    lastName?: string
  ) => {
    try {
      setLoading(true);
      console.log("Starting simplified user registration...");
      
      // Validate user type
      const validRoles = ['patient', 'doctor', 'nutritionist', 'administrator', 'reception'];
      if (!validRoles.includes(userType)) {
        throw new Error(`Invalid user type: ${userType}`);
      }

      // Prepare user metadata for the database trigger
      const userMetadata = {
        user_type_string: userType,
        first_name: firstName,
        last_name: lastName
      };

      console.log("Attempting Supabase auth signup with metadata:", userMetadata);
      
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userMetadata,
          emailRedirectTo: `${window.location.origin}/auth`
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
      console.log("Database trigger will handle role creation automatically");
      
      return { user: authData.user, session: authData.session };
      
    } catch (error: any) {
      console.error("Registration error:", error);
      throw error;
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
