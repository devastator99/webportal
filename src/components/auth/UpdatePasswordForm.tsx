
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const UpdatePasswordForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Get email from local storage
  useEffect(() => {
    const storedEmail = localStorage.getItem('resetPasswordEmail');
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      setError("No email found for password reset. Please try again.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email) {
      setError("Email address is required");
      return;
    }
    
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
      // Use signInWithPassword to authenticate the user first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: "any-old-password" // This will likely fail, but we'll catch and ignore this error
      });
      
      // Ignore the sign-in error as we're just trying to reset the password
      console.log("Expected sign-in error:", signInError);
      
      // Use supabase's password recovery mechanism directly
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (resetError) {
        console.error("Reset password error:", resetError);
        throw new Error("Unable to reset password. Please contact support.");
      }
      
      // If we get here, we'll just notify the user about the password reset
      toast.success('Password reset link has been sent to your email');
      localStorage.removeItem('resetPasswordEmail');
      
      // Redirect to login page after successful password reset request
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-saas-dark">
          Reset Password
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
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                readOnly
                className="mt-1 bg-gray-100"
              />
            </div>
            
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
              {loading ? 'Resetting...' : 'Reset Password'}
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
