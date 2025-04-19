
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LucideLoader2 } from "lucide-react";
import { NewPasswordForm } from "@/components/auth/NewPasswordForm";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ResetPassword = () => {
  const { user, isLoading } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (!isLoading && user) {
      navigate("/dashboard");
      return;
    }

    // Simple verification that we're on a reset password page
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    
    // Just verify this is a recovery link
    if (type === 'recovery') {
      // This is a recovery link, allow access to the form
      setVerifying(false);
    } else {
      // If not a recovery link, show an error
      setError("Invalid password reset link. Please request a new one.");
      setVerifying(false);
      toast.error("Invalid password reset link");
    }
  }, [isLoading, user, navigate]);

  // Show loading state
  if (isLoading || verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col items-center justify-center pt-16 md:pt-20">
        <LucideLoader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="mt-4 text-sm text-gray-600">
          Loading password reset form...
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
            <NewPasswordForm />
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
