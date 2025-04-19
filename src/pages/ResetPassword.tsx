
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LucideLoader2 } from "lucide-react";
import { NewPasswordForm } from "@/components/auth/NewPasswordForm";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AuthDebugMonitor } from "@/components/auth/AuthDebugMonitor";
import { toast } from "sonner";

const ResetPassword = () => {
  const { user, isLoading } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validSession, setValidSession] = useState(false);
  const navigate = useNavigate();

  // Debug info
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const handlePasswordReset = async () => {
      try {
        console.log("Starting password reset flow");
        // Check if we have access token in the URL (from the magic link)
        const hash = window.location.hash;
        const url = window.location.href;
        
        console.log("Current URL hash:", hash);
        console.log("Full URL:", url);
        
        setDebugInfo({
          hash,
          url,
          timestamp: new Date().toISOString()
        });
        
        if (hash && hash.includes("access_token")) {
          // Process the hash parameters
          const hashParams = Object.fromEntries(
            new URLSearchParams(hash.substring(1))
          );
          
          console.log("Hash params:", hashParams);
          
          if (hashParams.access_token) {
            try {
              // Use refreshSession to recover session from the token
              const { data, error } = await supabase.auth.refreshSession({
                refresh_token: hashParams.refresh_token,
              });
              
              if (error) {
                console.error("Error refreshing session:", error);
                setError("Invalid or expired reset link. Please request a new password reset link.");
                toast.error("Invalid or expired reset link");
              } else {
                console.log("Session refreshed successfully");
                setValidSession(true);
                toast.success("Ready to set your new password");
              }
            } catch (sessionError) {
              console.error("Session refresh error:", sessionError);
              setError("Error processing your session. Please try again.");
              toast.error("Session processing error");
            }
          } else {
            setError("Incomplete reset link. Please request a new password reset link.");
            toast.error("Incomplete reset link");
          }
        } else {
          // Try to get the type from URL params as a fallback
          const urlParams = new URLSearchParams(window.location.search);
          const type = urlParams.get('type');
          
          if (type === 'recovery') {
            // This is a recovery link but it's malformed
            setError("Invalid password reset link format. Please request a new one.");
            toast.error("Invalid link format");
          } else {
            // No access token in URL means they didn't come from a magic link
            setError("No valid reset link detected. Please request a new password reset link.");
            toast.error("No valid reset link detected");
          }
        }
      } catch (err) {
        console.error("Password reset error:", err);
        setError("An error occurred processing your request. Please try again.");
        toast.error("Error processing request");
      } finally {
        setVerifying(false);
      }
    };

    if (!isLoading) {
      // If user is already logged in, redirect to dashboard
      if (user) {
        navigate("/dashboard");
      } else {
        handlePasswordReset();
      }
    }
  }, [isLoading, user, navigate]);

  // Show loading state
  if (isLoading || verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col items-center justify-center pt-16 md:pt-20">
        <LucideLoader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="mt-4 text-sm text-gray-600">
          Verifying your password reset link...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 pt-16 md:pt-20">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-saas-dark">
          Reset Your Password
        </h2>
        {error && (
          <p className="mt-2 text-center text-sm text-red-600">
            {error}
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg shadow-saas-light-purple/20 sm:rounded-lg sm:px-10">
          {error ? (
            <div className="text-center">
              <div className="text-red-500 mb-4">{error}</div>
              <Button 
                onClick={() => navigate("/auth")}
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          ) : (
            validSession ? (
              <NewPasswordForm />
            ) : (
              <div className="text-center">
                <div className="text-amber-600 mb-4">
                  Session verification failed. Please try clicking the link in your email again or request a new password reset.
                </div>
                <Button 
                  onClick={() => navigate("/auth")}
                  className="w-full"
                >
                  Back to Login
                </Button>
              </div>
            )
          )}
        </div>
      </div>
      
      {/* Debug monitor - only visible in development */}
      {import.meta.env.DEV && (
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white p-4 shadow rounded text-xs">
            <h3 className="font-bold mb-2">Reset Password Debug Info</h3>
            <pre className="overflow-auto max-h-48">{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        </div>
      )}
      
      <AuthDebugMonitor />
    </div>
  );
};

export default ResetPassword;
