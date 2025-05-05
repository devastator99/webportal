
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { LucideLoader2, CheckCircle } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

interface ForgotPasswordFormProps {
  open: boolean;
  onClose: () => void;
}

const ForgotPasswordForm = ({ open, onClose }: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      
      if (error) throw error;
      
      setSuccess(true);
      toast({
        title: 'Password Reset Email Sent',
        description: 'Check your email for the password reset link.',
      });
      
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError(error.message || 'Failed to send password reset email');
      toast({
        title: 'Password Reset Failed',
        description: error.message || 'Failed to send password reset email',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollArea className="max-h-[80vh]" invisibleScrollbar={true}>
      <div className="p-4">
        <h2 className="text-2xl font-bold text-center mb-6">Reset Password</h2>
        
        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full"
                required
              />
            </div>
            
            {error && (
              <div className="text-sm text-red-500">{error}</div>
            )}
            
            <Button 
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </span>
              ) : (
                'Send Reset Link'
              )}
            </Button>
            
            <div className="text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Back to Login
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-lg font-medium">Reset Link Sent</p>
            <p className="text-gray-600">
              We've sent a password reset link to <span className="font-medium">{email}</span>.
              Please check your email inbox.
            </p>
            <Button 
              onClick={onClose}
              className="mt-4"
            >
              Close
            </Button>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default ForgotPasswordForm;
