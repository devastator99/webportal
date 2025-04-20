
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LucideLoader2 } from 'lucide-react';

export const UpdatePasswordForm = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [validatingSession, setValidatingSession] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're in a password reset flow
  useEffect(() => {
    const checkForResetFlow = async () => {
      try {
        // Log important debugging information
        console.log("Current URL path:", window.location.pathname);
        console.log("Current URL hash:", window.location.hash);
        console.log("Current URL search:", window.location.search);
        
        // Get hash parameters (Supabase adds these in password reset flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get('type');
        const accessToken = hashParams.get('access_token');
        
        console.log("Reset flow check - hash type:", type);
        console.log("Access token present:", !!accessToken);
        
        // If we're in a recovery flow, we should be good to go
        if (type === 'recovery' && accessToken) {
          console.log("Valid recovery flow detected with access token");
          setValidatingSession(false);
          setInitialized(true);
          return;
        }
        
        // If not recovery flow, check if there's a session
        const { data } = await supabase.auth.getSession();
        
        if (!data.session) {
          console.log("No active session and not in recovery flow, redirecting to login");
          navigate('/auth');
          return;
        }
        
        console.log("User has active session, allowing password update");
        setValidatingSession(false);
        setInitialized(true);
      } catch (error) {
        console.error("Error in checkForResetFlow:", error);
        setError("Failed to validate your session. Please try using the reset link again.");
        setValidatingSession(false);
        // Don't redirect here to allow user to see the error message
      }
    };
    
    checkForResetFlow();
  }, [navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);

    try {
      console.log("Updating password with auth.updateUser");
      
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      console.log("Password update response:", data ? "Success" : "Failed");
      
      if (updateError) {
        console.error("Password update error:", updateError);
        throw new Error(updateError.message || "Unable to update password");
      }
      
      toast.success('Password updated successfully');
      
      // Redirect to login page after successful password update
      setTimeout(() => {
        navigate('/auth');
      }, 1500);
    } catch (error: any) {
      console.error("Password update error:", error);
      setError(error.message || "Unable to update password");
    } finally {
      setLoading(false);
    }
  };

  // Show loading state until we've determined if we're in a valid reset flow
  if (validatingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex flex-col items-center">
            <LucideLoader2 className="w-8 h-8 animate-spin text-purple-600" />
            <h2 className="mt-6 text-2xl font-semibold text-gray-700">
              Validating your session...
            </h2>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if not initialized and we have an error
  if (!initialized && error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-lg shadow-saas-light-purple/20 sm:rounded-lg sm:px-10">
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              onClick={() => navigate('/auth')}
              className="w-full mt-4"
            >
              Return to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main password reset form
  return (
    <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-saas-dark">
          Set New Password
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg shadow-saas-light-purple/20 sm:rounded-lg sm:px-10">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1"
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
            
            <div className="text-center">
              <Button
                variant="ghost"
                className="text-sm text-purple-600"
                onClick={() => navigate('/auth')}
                type="button"
              >
                Return to login
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
