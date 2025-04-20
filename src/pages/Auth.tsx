
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

  // Process the recovery token from the URL hash if present
  useEffect(() => {
    const handleRecoveryToken = async () => {
      // Check if there's a hash in the URL (could contain access_token)
      if (window.location.hash && window.location.hash.includes('access_token')) {
        setProcessingRecovery(true);
        
        try {
          console.log("Processing recovery token from URL hash:", window.location.hash);
          
          // Parse the access token from the hash
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          
          if (accessToken) {
            console.log("Found access token in URL, attempting to set session");
            
            // First try to explicitly set the session with the token
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: hashParams.get('refresh_token') || '',
            });
            
            if (sessionError) {
              console.error("Error setting session with token:", sessionError);
              toast.error("Error processing recovery token. Please try again.");
            } else if (sessionData?.session) {
              console.log("Session set successfully with recovery token");
              setIsRecoveryMode(true);
              
              // Clear the hash to avoid reprocessing on refresh
              if (window.history.replaceState) {
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
              }
            }
          } else {
            // Fallback to getSession if we couldn't parse the token
            console.log("No access token found in URL hash, trying getSession");
            const { data, error } = await supabase.auth.getSession();
            
            if (error) {
              console.error("Error in getSession:", error);
              toast.error("Error processing recovery token. Please try again.");
            } else if (data?.session) {
              console.log("Recovery session found with getSession");
              setIsRecoveryMode(true);
            } else {
              console.log("No session found with getSession");
            }
          }
        } catch (err) {
          console.error("Exception when processing recovery token:", err);
          toast.error("An unexpected error occurred. Please try again.");
        } finally {
          setProcessingRecovery(false);
        }
      } else if (type === 'recovery') {
        // If the type=recovery parameter is present, show recovery form directly
        console.log("Recovery mode activated via URL parameter");
        setIsRecoveryMode(true);
      }
    };
    
    handleRecoveryToken();
  }, [type]);

  // For debugging purposes - log the URL parameters
  useEffect(() => {
    console.log("Current URL:", window.location.href);
    console.log("URL Hash:", window.location.hash);
    console.log("View parameter:", view);
    console.log("Type parameter:", type);
    console.log("Recovery mode:", isRecoveryMode);
    console.log("Search params:", Object.fromEntries(searchParams.entries()));
  }, [view, type, searchParams, isRecoveryMode]);

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
  if (isRecoveryMode) {
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
