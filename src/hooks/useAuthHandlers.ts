import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

type UserRole = "patient" | "doctor" | "nutritionist" | "administrator";

export const useAuthHandlers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      navigate('/dashboard');
      
      toast({
        title: "Welcome back!",
      });
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (email: string, password: string, userType: UserRole) => {
    setLoading(true);
    setError(null);

    try {
      // First sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("User creation failed");

      // Then create their role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: userType
        });

      if (roleError) {
        console.error('Role creation error:', roleError);
        toast({
          variant: "destructive",
          title: "Warning",
          description: "Account created but role assignment failed. Please contact support."
        });
      }

      navigate('/dashboard');

      toast({
        title: "Account created successfully!",
        description: "Please check your email to confirm your account."
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      navigate('/dashboard');

      toast({
        title: "Logged in successfully",
        description: `Welcome, ${email}`
      });
    } catch (error: any) {
      console.error('Test login error:', error);
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Test login failed",
        description: error.message
      });
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
