
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SupabaseAuthUI } from "@/components/auth/SupabaseAuthUI";
import { AuthForm } from "@/components/auth/AuthForm";
import { LucideLoader2 } from "lucide-react";
import { useAuthHandlers } from "@/hooks/useAuthHandlers";
import { toast } from "sonner";
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const { user, isLoading } = useAuth();
  const { handleSignUp, error, loading, setError } = useAuthHandlers();
  const navigate = useNavigate();
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [processingRecovery, setProcessingRecovery] = useState(false);
  const isRegistration = window.location.pathname.includes('/register');
  const searchParams = new URLSearchParams(window.location.search);
  const view = searchParams.get('view');
  const type = searchParams.get('type');

  // Check for recovery tokens in the URL
  useEffect(() => {
    const handleRecoveryAndTokens = async () => {
      // First check for presence of token in hash (from password reset email)
      if (window.location.hash && window.location.hash.includes('access_token')) {
        console.log("Detected access token in URL hash - switching to recovery mode");
        setProcessingRecovery(true);
        setIsRecoveryMode(true);
        setProcessingRecovery(false);
        return;
      }
      
      // Check for type=recovery in query parameters
      if (type === 'recovery') {
        console.log("Recovery mode activated via URL parameter");
        setIsRecoveryMode(true);
        return;
      }
      
      // Additional check for reset parameter for backward compatibility
      if (searchParams.get('reset') === 'true') {
        console.log("Recovery mode activated via reset=true parameter");
        setIsRecoveryMode(true);
        return;
      }
      
      // Check for a session that might have been established from a recovery token
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          const authAction = new URLSearchParams(window.location.search).get('action');
          if (authAction === 'recovery' || authAction === 'reset') {
            console.log("Recovery session detected based on session + action parameter");
            setIsRecoveryMode(true);
          }
        }
      } catch (err) {
        console.error("Error checking session for recovery:", err);
      }
    };
    
    handleRecoveryAndTokens();
  }, [type, searchParams]);

  // Debug logging
  useEffect(() => {
    console.log("Auth page render state:", {
      url: window.location.href,
      hash: window.location.hash,
      search: window.location.search,
      type,
      view,
      isRecoveryMode,
      user: !!user,
      isLoading
    });
  }, [view, type, isRecoveryMode, user, isLoading]);

  // Redirect to dashboard if already logged in and not in recovery mode
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (!isLoading && user && !view && !isRecoveryMode) {
      timeoutId = setTimeout(() => {
        navigate("/dashboard");
      }, 100);
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user, isLoading, navigate, view, isRecoveryMode]);

  // Show loading state
  if (isLoading || processingRecovery) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col items-center justify-center pt-16 md:pt-20">
        <LucideLoader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="mt-4 text-sm text-gray-600">
          {processingRecovery ? "Processing your password recovery..." : "Verifying your authentication..."}
        </p>
      </div>
    );
  }

  // Show update password form if in recovery mode
  if (isRecoveryMode || window.location.hash.includes('access_token')) {
    console.log("Rendering UpdatePasswordForm for password recovery");
    return <UpdatePasswordForm />;
  }

  // Handle signup form submission
  const handleFormSubmit = async (
    email: string, 
    password: string, 
    userType?: string, 
    firstName?: string, 
    lastName?: string,
    patientData?: any
  ) => {
    try {
      await toast.promise(
        handleSignUp(email, password, userType as any, firstName, lastName, patientData),
        {
          loading: 'Creating your account...',
          success: 'Account created successfully! Redirecting to dashboard...',
          error: (err) => `Registration failed: ${err.message || 'Please try again'}`
        }
      );
    } catch (error: any) {
      console.error("Registration error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 pt-16 md:pt-20">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-saas-dark">
          {isRegistration ? 'Create your account' : 'Welcome back'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg shadow-saas-light-purple/20 sm:rounded-lg sm:px-10">
          {isRegistration ? (
            <AuthForm 
              type="register"
              onSubmit={handleFormSubmit}
              error={error}
              loading={loading}
            />
          ) : (
            <SupabaseAuthUI 
              view="sign_in"
              redirectTo={`${window.location.origin}/auth`}
              showLinks={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
