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
    console.error("Auth error:", error);
    
    let errorMessage = "An error occurred during authentication.";
    
    if (error.message?.includes("Email not confirmed")) {
      errorMessage = "Please check your email to confirm your account.";
    } else if (error.message?.includes("Invalid login credentials")) {
      errorMessage = "Invalid email or password. Please try again.";
    } else if (error.message?.includes("User already registered")) {
      errorMessage = "This email is already registered. Please sign in instead.";
    } else if (error.message?.includes("Password should be at least 6 characters")) {
      errorMessage = "Password should be at least 6 characters long.";
    }

    setError(errorMessage);
    toast({
      variant: "destructive",
      title: "Authentication Error",
      description: errorMessage,
    });
  };

  const handleTestLogin = async (testEmail: string, testPassword: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Starting test login process for:", testEmail);
      
      const { data: { user, session }, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (signInError) throw signInError;

      if (user && session) {
        console.log("Test login successful:", { user, session });
        
        // Get user role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        console.log("User role:", roleData?.role);
        
        toast({
          title: "Login successful!",
          description: `Logged in as ${testEmail} (${roleData?.role || 'unknown role'})`,
        });
        
        // Navigate after ensuring state is updated
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Test login error:", error);
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    setError(null);
    
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      console.log("Starting login process for:", email);
      
      const { data: { user, session }, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (user && session) {
        console.log("Login successful:", { user, session });
        
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

  const handleSignUp = async (email: string, password: string, userType: string) => {
    setError(null);
    
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    if (password.length < 6) {
      setError("Password should be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            user_type: userType,
            full_name: email.split('@')[0],
          }
        },
      });

      if (error) throw error;

      if (data?.user) {
        toast({
          title: "Success",
          description: "Please check your email for verification.",
        });
      }
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