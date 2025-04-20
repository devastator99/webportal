
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const UpdatePasswordForm = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Get email from local storage and token from URL
  useEffect(() => {
    const savedEmail = localStorage.getItem('passwordResetEmail');
    if (savedEmail) {
      setEmail(savedEmail);
    }
    
    // Check if we have a token in the URL (from the email link)
    const hashParams = new URLSearchParams(location.hash.substring(1));
    const type = hashParams.get('type');
    
    // If we have the recovery token from URL hash, we can use the standard Supabase update password flow
    if (type === 'recovery') {
      console.log('Recovery token found in URL - can use standard Supabase flow');
    }
  }, [location]);
  
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
      // Check if we're handling a direct link from email (with hash parameters)
      const hashParams = new URLSearchParams(location.hash.substring(1));
      const type = hashParams.get('type');
      
      if (type === 'recovery') {
        // Use standard Supabase auth.updateUser when we have the recovery token
        const { error } = await supabase.auth.updateUser({ password });
        
        if (error) throw error;
      } else {
        // Fallback to our custom edge function if no token
        if (!email) {
          setError("Email is required. Please use the link from the email we sent you.");
          return;
        }
        
        // Use our custom edge function for password reset without token
        const { error: updateError } = await supabase.functions.invoke('update-password-without-token', {
          body: { email, newPassword: password }
        });

        if (updateError) throw updateError;
      }
      
      toast.success('Password updated successfully');
      
      // Clear saved email from local storage
      localStorage.removeItem('passwordResetEmail');
      
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
            {!email && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Your Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
            )}
            
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
