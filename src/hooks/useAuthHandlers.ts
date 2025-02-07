
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const useAuthHandlers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAuthError = (error: any) => {
    console.error("[AuthHandlers] Auth error:", error);
    
    let errorMessage = "An error occurred during authentication.";
    
    if (error.message?.includes("Email not confirmed")) {
      errorMessage = "Please check your email to confirm your account.";
    } else if (error.message?.includes("Invalid login credentials")) {
      errorMessage = "Invalid email or password. Please try again.";
    } else if (error.message?.includes("Password should be at least 6 characters")) {
      errorMessage = "Password should be at least 6 characters long.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    setError(errorMessage);
    toast({
      variant: "destructive",
      title: "Authentication Error",
      description: errorMessage,
    });
  };

  const handleLogin = async (email: string, password: string) => {
    console.log("[AuthHandlers] Starting login process");
    
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      console.log("[AuthHandlers] Login successful:", {
        userId: data.user?.id,
        hasSession: !!data.session
      });

      if (data.user) {
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        
        navigate("/dashboard");
      }
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (
    email: string, 
    password: string, 
    userType: string, 
    firstName?: string, 
    lastName?: string
  ) => {
    console.log("[AuthHandlers] Starting signup process");
    setError(null);
    
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    if (password.length < 6) {
      setError("Password should be at least 6 characters long.");
      return;
    }

    if (!firstName || !lastName) {
      setError("Please enter both first name and last name.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            user_type: userType,
            first_name: firstName,
            last_name: lastName
          }
        },
      });

      if (error) throw error;

      console.log("[AuthHandlers] Signup successful:", {
        userId: data.user?.id,
        hasSession: !!data.session
      });

      toast({
        title: "Registration successful!",
        description: "Your account has been created. Please check your email for confirmation.",
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = async (testEmail: string, testPassword: string) => {
    console.log("[AuthHandlers] Starting test login");
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (error) throw error;

      console.log("[AuthHandlers] Test login successful:", {
        userId: data.user?.id,
        hasSession: !!data.session
      });

      toast({
        title: "Login successful!",
        description: `Logged in as ${testEmail}`,
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      handleAuthError(error);
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
