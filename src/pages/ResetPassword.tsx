
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LucideLoader2 } from "lucide-react";
import { NewPasswordForm } from "@/components/auth/NewPasswordForm";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const ResetPassword = () => {
  const { user, isLoading } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handlePasswordReset = async () => {
      try {
        // Check if we have access token in the URL (from the magic link)
        const hash = window.location.hash;
        
        if (hash && hash.includes("access_token")) {
          const hashParams = Object.fromEntries(
            new URLSearchParams(hash.substring(1))
          );
          
          if (hashParams.access_token) {
            // Process the hash parameters
            const { error } = await supabase.auth.refreshSession({
              refresh_token: hashParams.refresh_token,
            });

            if (error) {
              console.error("Error refreshing session:", error);
              setError("Invalid or expired reset link. Please try again.");
            }
          }
        } else {
          // No access token in URL means they didn't come from a magic link
          setError("No valid reset link detected. Please request a new password reset link.");
        }
      } catch (err) {
        console.error("Password reset error:", err);
        setError("An error occurred processing your request. Please try again.");
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
            <NewPasswordForm />
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
