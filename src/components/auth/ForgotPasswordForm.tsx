
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { LucideLoader2, CheckCircle, Mail, AlertCircle } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { getSiteUrl } from '@/utils/environmentUtils';

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
      // Get the site URL for proper redirect
      const siteUrl = getSiteUrl();
      const redirectUrl = `${siteUrl}/update-password`;
      
      console.log('[ForgotPassword] Sending reset email to:', email);
      console.log('[ForgotPassword] Redirect URL:', redirectUrl);
      
      // Send email via our custom edge function
      const { data, error: emailError } = await supabase.functions.invoke('send-password-reset-email', {
        body: { 
          email: email.toLowerCase().trim(),
          resetUrl: redirectUrl
        }
      });
      
      if (emailError) {
        console.error('[ForgotPassword] Email function error:', emailError);
        
        // Check if it's a domain verification error
        if (emailError.message?.includes('domain is not verified')) {
          throw new Error('Email service configuration issue. Please contact support or try the SMS reset option.');
        }
        
        throw new Error('Failed to send password reset email. Please try again.');
      }
      
      if (data?.error) {
        console.error('[ForgotPassword] Email function returned error:', data.error);
        throw new Error(data.error);
      }
      
      if (!data?.success) {
        console.error('[ForgotPassword] Email function returned unsuccessful result:', data);
        throw new Error('Failed to send password reset email. Please try again.');
      }
      
      console.log('[ForgotPassword] Reset email sent successfully');
      setSuccess(true);
      toast({
        title: 'Password Reset Email Sent',
        description: 'Check your email for the password reset code.',
      });
      
    } catch (error: any) {
      console.error('Password reset error:', error);
      const errorMessage = error.message || 'Failed to send password reset email';
      setError(errorMessage);
      toast({
        title: 'Password Reset Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTrySMS = () => {
    // Close this modal and suggest SMS option
    toast({
      title: 'Try SMS Reset',
      description: 'You can also try resetting your password using SMS if you have a phone number linked to your account.',
    });
    onClose();
  };

  return (
    <ScrollArea className="max-h-[80vh]" invisibleScrollbar={true}>
      <div className="p-4">
        <div className="text-center mb-6">
          <Mail className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Reset Password</h2>
          <p className="text-gray-600 mt-2">Enter your email to receive a reset code</p>
        </div>
        
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
                disabled={loading}
              />
            </div>
            
            {error && (
              <div className="text-sm text-red-500 p-3 bg-red-50 rounded-md border border-red-200 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Reset Failed</p>
                  <p className="text-xs mt-1">{error}</p>
                  {error.includes('configuration') && (
                    <button
                      type="button"
                      onClick={handleTrySMS}
                      className="text-xs mt-2 text-blue-600 hover:text-blue-700 underline"
                    >
                      Try SMS reset instead
                    </button>
                  )}
                </div>
              </div>
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
                'Send Reset Code'
              )}
            </Button>
            
            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-gray-500 hover:text-gray-700"
                disabled={loading}
              >
                Back to Login
              </button>
              <br />
              <button
                type="button"
                onClick={handleTrySMS}
                className="text-sm text-blue-600 hover:text-blue-700"
                disabled={loading}
              >
                Try SMS Reset Instead
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
            <p className="text-lg font-medium">Reset Email Sent</p>
            <p className="text-gray-600">
              We've sent a password reset code to <span className="font-medium">{email}</span>.
              Please check your email inbox and follow the instructions.
            </p>
            <div className="text-sm text-gray-500 p-3 bg-blue-50 rounded-md border border-blue-200">
              <p className="font-medium mb-1">What to expect:</p>
              <ul className="text-left space-y-1">
                <li>• A 6-digit verification code</li>
                <li>• Valid for 1 hour</li>
                <li>• Check spam folder if not received</li>
              </ul>
            </div>
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
