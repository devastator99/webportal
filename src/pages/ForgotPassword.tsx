
import { useState } from 'react';
import { useAuthHandlers } from '@/hooks/useAuthHandlers';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { error, setError } = useAuthHandlers();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    
    try {
      setIsSending(true);
      setError(null);
      
      // Use Supabase client directly for password reset
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });
      
      if (error) throw error;
      
      setEmailSent(true);
      toast.success("Password reset link sent to your email");
    } catch (err: any) {
      console.error("Reset password error:", err);
      setError(err.message);
      toast.error(err.message || "Failed to send password reset email");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-saas-dark">
          Reset your password
        </h2>
        {emailSent && (
          <p className="mt-2 text-center text-sm text-green-600">
            Check your email for the password reset link
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg shadow-saas-light-purple/20 sm:rounded-lg sm:px-10">
          {emailSent ? (
            <div className="text-center space-y-4">
              <p className="text-gray-700">
                We've sent a password reset link to <span className="font-medium">{email}</span>
              </p>
              <p className="text-sm text-gray-600">
                Didn't receive an email? Check your spam folder or try again.
              </p>
              <Button 
                onClick={() => setEmailSent(false)}
                variant="outline"
                className="mt-4"
              >
                Try again
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600">
                  {error}
                </div>
              )}

              <div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSending}
                >
                  {isSending ? "Sending..." : "Send reset link"}
                </Button>
              </div>

              <div className="text-center">
                <Link 
                  to="/auth" 
                  className="text-sm font-medium text-purple-600 hover:text-purple-500"
                >
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
