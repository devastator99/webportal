
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const UpdatePasswordForm = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Process the recovery token from URL
  useEffect(() => {
    const processRecoveryToken = async () => {
      try {
        setInitializing(true);
        console.log("Processing recovery token in UpdatePasswordForm");
        
        // Check if there's a hash in the URL (contains the access token)
        if (window.location.hash && window.location.hash.includes('access_token')) {
          console.log("Found hash with tokens in URL, processing...");
          
          // Parse the hash directly - more reliable method
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            console.log("Extracted tokens from URL hash, setting session");
            
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (error) {
              console.error("Error setting session with token:", error);
              setError("Error processing recovery token. Please request a new password reset link.");
              setHasSession(false);
            } else if (data?.session) {
              console.log("Session set successfully with recovery token");
              setHasSession(true);
              
              // Clear URL hash to prevent token leaking and reprocessing
              if (window.history.replaceState) {
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
              }
            }
          }
        } else {
          // No hash, check if we already have a valid session
          console.log("No recovery tokens in URL, checking for existing session");
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error("Error checking session:", error);
            setError("Unable to verify your session. Please use the reset link from your email again.");
            setHasSession(false);
          } else if (data?.session) {
            console.log("Valid session found for password update");
            setHasSession(true);
          } else {
            console.log("No session found for password update");
            setError("No active session found. Please use the reset link from your email again.");
            setHasSession(false);
          }
        }
      } catch (err) {
        console.error("Exception processing recovery token:", err);
        setError("An unexpected error occurred. Please try again or request a new password reset link.");
      } finally {
        setInitializing(false);
      }
    };
    
    processRecoveryToken();
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous errors
    setError(null);
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    // Validate password length
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);

    try {
      console.log("Updating password");
      
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      console.log("Password updated successfully");
      toast.success('Password updated successfully');
      
      // Wait a moment before redirecting to give the toast time to be seen
      setTimeout(() => {
        navigate('/auth');
      }, 1500);
    } catch (error: any) {
      console.error("Password update error:", error);
      setError(error.message || 'Error updating password');
      toast.error(error.message || 'Error updating password');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking session
  if (initializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
        <p className="mt-4 text-sm text-gray-600">Verifying your session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-saas-dark">
          Set New Password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your new password below
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg shadow-saas-light-purple/20 sm:rounded-lg sm:px-10">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {!hasSession && !error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                Your password reset session may have expired. Please request a new password reset link.
              </AlertDescription>
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
                className="mt-1 w-full"
                disabled={!hasSession}
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
                className="mt-1 w-full"
                disabled={!hasSession}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading || !hasSession}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
            
            <div className="text-center mt-4">
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
