
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AuthForm } from "@/components/auth/AuthForm";
import { useRegistrationAuth, PatientData } from "@/hooks/useRegistrationAuth";
import { LucideLoader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const Auth = () => {
  const { user, userRole, isLoading, isLoadingRole } = useAuth();
  const navigate = useNavigate();
  const { handleRegistration, loading: registrationLoading, error: registrationError } = useRegistrationAuth();
  
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Redirect when we have BOTH user AND role
  useEffect(() => {
    const handleRedirect = async () => {
      console.log("Auth page: Current state:", { 
        hasUser: !!user, 
        userRole, 
        isLoading, 
        isLoadingRole 
      });
      
      // Don't redirect while still loading
      if (isLoading || isLoadingRole) {
        console.log("Auth page: Still loading, waiting...");
        return;
      }
      
      // Only redirect if user has BOTH authentication AND a role
      if (user && userRole) {
        console.log("Auth page: User has both auth and role, redirecting to dashboard:", userRole);
        navigate("/dashboard", { replace: true });
        return;
      }
      
      // If user exists but no role, wait a moment for auth hook to complete
      if (user && !userRole) {
        console.log("Auth page: User authenticated but no role yet, waiting for auth hook...");
        // Give auth hook more time to process
        setTimeout(() => {
          // Check again after a delay
          if (user && !userRole) {
            console.log("Auth page: Auth hook may have failed, staying on auth page");
          }
        }, 3000);
        return;
      }
      
      console.log("Auth page: No user, staying on auth page");
    };
    
    handleRedirect();
  }, [user, userRole, isLoading, isLoadingRole, navigate]);

  const handleLogin = async (email: string, password: string) => {
    setAuthLoading(true);
    setAuthError(null);
    
    try {
      console.log("Auth: Attempting login...");
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      console.log("Auth: Login successful");
    } catch (err: any) {
      console.error('Auth: Login error:', err);
      setAuthError(err.message || 'Login failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthSubmit = async (
    email: string,
    password: string,
    userType?: string,
    firstName?: string,
    lastName?: string,
    patientData?: PatientData
  ) => {
    if (authMode === 'login') {
      await handleLogin(email, password);
    } else {
      // Clear any previous errors
      setAuthError(null);
      
      try {
        // Use the registration handler with auth hook integration
        const result = await handleRegistration(email, password, userType!, firstName, lastName, patientData);
        
        if (result) {
          console.log("Auth: Registration successful, user created:", result.id);
          // The auth hook should have created the role automatically
          // The useAuth context should pick up the changes and redirect
        }
      } catch (err: any) {
        console.error("Auth: Registration failed:", err);
        setAuthError(err.message || 'Registration failed. Please try again.');
      }
    }
  };

  // Show loading while anything is loading
  if (isLoading || isLoadingRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col items-center justify-center pt-16 md:pt-20">
        <LucideLoader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="mt-4 text-sm text-gray-600">
          {isLoading ? "Loading authentication..." : "Setting up your account..."}
        </p>
      </div>
    );
  }

  // Show auth form
  return (
    <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 pt-16 md:pt-20">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-saas-dark">
          {authMode === 'login' ? 'Welcome Back' : 'Welcome'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {authMode === 'login' 
            ? 'Sign in to your account' 
            : 'Create your account and start your health journey'
          }
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg shadow-saas-light-purple/20 sm:rounded-lg sm:px-10">
          <AuthForm 
            type={authMode}
            onSubmit={handleAuthSubmit}
            error={authError || registrationError}
            loading={authLoading || registrationLoading}
          />
          
          <div className="mt-6 text-center">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setAuthError(null);
              }}
              className="text-sm text-purple-600 hover:text-purple-500"
            >
              {authMode === 'login' 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
