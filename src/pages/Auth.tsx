import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SupabaseAuthUI } from "@/components/auth/SupabaseAuthUI";
import { LucideLoader2 } from "lucide-react";
import { getEnvironmentInfo } from "@/utils/environmentUtils";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(true);
  
  // Get the auth view from URL params
  const urlView = searchParams.get('view');
  const urlType = searchParams.get('type');
  const urlToken = searchParams.get('token');
  
  // Determine the correct view based on URL parameters
  let view = "sign_in";
  
  // Check if this is a recovery flow from email link
  if (urlType === 'recovery' && urlToken) {
    view = "update_password";
    console.log("Password recovery flow detected");
  } else if (urlView) {
    // Otherwise use the view from URL param if available
    view = urlView as "sign_in" | "sign_up" | "magic_link" | "forgotten_password" | "update_password";
  }
  
  useEffect(() => {
    // Track auth page load for debugging
    console.log("Auth page loaded with view:", view);
    console.log("URL params:", { type: urlType, token: urlToken ? 'present' : 'absent', view: urlView });
    console.log("Environment info:", getEnvironmentInfo());
    
    // Handle recovery token if present
    const handleRecoveryToken = async () => {
      if (urlType === 'recovery' && urlToken) {
        try {
          console.log("Attempting to verify recovery token");
          const { error } = await supabase.auth.verifyOtp({
            token_hash: urlToken,
            type: 'recovery',
          });
          
          if (error) {
            console.error("Error verifying recovery token:", error);
            setAuthError(`Recovery link error: ${error.message}`);
          } else {
            console.log("Recovery token verified successfully");
          }
        } catch (err) {
          console.error("Exception during token verification:", err);
          setAuthError("Failed to process recovery link");
        }
      }
      setLocalLoading(false);
    };
    
    handleRecoveryToken();
    
    // Only redirect to dashboard if user is authenticated and not on recovery flow
    if (!isLoading && user && !urlToken) {
      console.log("User authenticated, redirecting to dashboard");
      navigate("/dashboard");
    } else if (!isLoading) {
      setLocalLoading(false);
    }
    
    // Check if there's an error in the URL (e.g., from a failed auth redirect)
    const error = searchParams.get('error');
    if (error) {
      console.error("Auth error from URL:", error);
      setAuthError(`Authentication error: ${error}`);
    }
  }, [user, isLoading, navigate, view, urlType, urlToken, urlView, searchParams]);

  // Handle loading state with better error recovery
  if (isLoading || localLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col items-center justify-center pt-16 md:pt-20">
        <LucideLoader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="mt-4 text-sm text-gray-600">Verifying your authentication...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 pt-16 md:pt-20">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-saas-dark">
          {view === 'sign_in' && 'Welcome back'}
          {view === 'sign_up' && 'Create your account'}
          {view === 'forgotten_password' && 'Reset your password'}
          {view === 'update_password' && 'Set new password'}
        </h2>
        
        {authError && (
          <div className="mt-2 p-2 bg-red-100 border border-red-300 text-red-700 text-sm rounded">
            {authError}
          </div>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg shadow-saas-light-purple/20 sm:rounded-lg sm:px-10">
          <SupabaseAuthUI 
            view={view as "sign_in" | "sign_up" | "magic_link" | "forgotten_password" | "update_password"}
            redirectTo={`${window.location.origin}/auth?view=update_password`}
            recoveryToken={urlToken}
            onSuccess={() => {
              console.log("Auth success, redirecting to dashboard");
              navigate("/dashboard");
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Auth;
