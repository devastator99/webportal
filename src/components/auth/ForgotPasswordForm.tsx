
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { LucideLoader2, CheckCircle, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { getSiteUrl } from '@/utils/environmentUtils';

interface ForgotPasswordFormProps {
  open: boolean;
  onClose: () => void;
}

type ResetStep = 'email' | 'verify_code' | 'new_password';

const ForgotPasswordForm = ({ open, onClose }: ForgotPasswordFormProps) => {
  const [step, setStep] = useState<ResetStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async (e: React.FormEvent) => {
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
        throw new Error('Failed to send password reset email. Please try again.');
      }
      
      if (data?.error) {
        console.error('[ForgotPassword] Email function returned error:', data.error);
        
        // Check for specific configuration errors
        if (data.error.includes('Email service not configured')) {
          throw new Error('Email service is currently unavailable. Please contact support or try the SMS reset option.');
        }
        
        if (data.error.includes('configuration issue')) {
          throw new Error('Email service configuration issue. Please contact support or try the SMS reset option.');
        }
        
        throw new Error(data.error);
      }
      
      if (!data?.success) {
        console.error('[ForgotPassword] Email function returned unsuccessful result:', data);
        throw new Error('Failed to send password reset email. Please try again.');
      }
      
      console.log('[ForgotPassword] Reset email sent successfully');
      setStep('verify_code');
      toast({
        title: 'Password Reset Code Sent',
        description: 'Check your email for the 6-digit verification code.',
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

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code || code.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('[ForgotPassword] Verifying code for email:', email);
      
      const { data, error } = await supabase.functions.invoke('verify-email-otp', {
        body: { 
          email: email.toLowerCase().trim(),
          otp: code
        }
      });
      
      if (error) {
        console.error('[ForgotPassword] Verify OTP error:', error);
        throw new Error('Failed to verify code. Please try again.');
      }
      
      if (!data?.success) {
        console.error('[ForgotPassword] Verify OTP failed:', data.error);
        throw new Error(data.error || 'Invalid verification code');
      }
      
      console.log('[ForgotPassword] Code verified successfully');
      setStep('new_password');
      toast({
        title: 'Code Verified',
        description: 'Please enter your new password.',
      });
      
    } catch (error: any) {
      console.error('Code verification error:', error);
      const errorMessage = error.message || 'Invalid verification code';
      setError(errorMessage);
      toast({
        title: 'Verification Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('[ForgotPassword] Updating password for email:', email);
      
      const { data, error } = await supabase.functions.invoke('update-password-without-token', {
        body: { 
          email: email.toLowerCase().trim(),
          otp: code,
          newPassword
        }
      });
      
      if (error) {
        console.error('[ForgotPassword] Update password error:', error);
        throw new Error('Failed to update password. Please try again.');
      }
      
      if (!data?.success) {
        console.error('[ForgotPassword] Update password failed:', data.error);
        throw new Error(data.error || 'Failed to update password');
      }
      
      console.log('[ForgotPassword] Password updated successfully');
      toast({
        title: 'Password Updated',
        description: 'Your password has been updated successfully. You can now log in.',
      });
      
      onClose();
      
    } catch (error: any) {
      console.error('Password update error:', error);
      const errorMessage = error.message || 'Failed to update password';
      setError(errorMessage);
      toast({
        title: 'Password Update Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTrySMS = () => {
    toast({
      title: 'Try SMS Reset',
      description: 'You can also try resetting your password using SMS if you have a phone number linked to your account.',
    });
    onClose();
  };

  const handleContactSupport = () => {
    toast({
      title: 'Contact Support',
      description: 'Please contact our support team for assistance with password reset.',
    });
  };

  const handleBackToEmail = () => {
    setStep('email');
    setError(null);
  };

  const handleBackToCode = () => {
    setStep('verify_code');
    setError(null);
  };

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const passwordValid = newPassword && newPassword.length >= 6;

  return (
    <ScrollArea className="max-h-[80vh]" invisibleScrollbar={true}>
      <div className="p-4">
        <div className="text-center mb-6">
          <Mail className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Reset Password</h2>
          <p className="text-gray-600 mt-2">
            {step === 'email' && 'Enter your email to receive a reset code'}
            {step === 'verify_code' && 'Enter the 6-digit code sent to your email'}
            {step === 'new_password' && 'Create your new password'}
          </p>
        </div>
        
        {step === 'email' && (
          <form onSubmit={handleSendCode} className="space-y-4">
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
                <div className="flex-1">
                  <p className="font-medium">Reset Failed</p>
                  <p className="text-xs mt-1">{error}</p>
                  <div className="mt-3 space-y-2">
                    {error.includes('configuration') || error.includes('unavailable') ? (
                      <>
                        <button
                          type="button"
                          onClick={handleTrySMS}
                          className="text-xs text-blue-600 hover:text-blue-700 underline block"
                        >
                          Try SMS reset instead
                        </button>
                        <button
                          type="button"
                          onClick={handleContactSupport}
                          className="text-xs text-gray-600 hover:text-gray-700 underline block"
                        >
                          Contact support
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={handleTrySMS}
                        className="text-xs text-blue-600 hover:text-blue-700 underline"
                      >
                        Try SMS reset instead
                      </button>
                    )}
                  </div>
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
        )}

        {step === 'verify_code' && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <Input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                className="w-full text-center text-lg tracking-widest"
                maxLength={6}
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 text-center">
                Code sent to {email}
              </p>
            </div>
            
            {error && (
              <div className="text-sm text-red-500 p-3 bg-red-50 rounded-md border border-red-200">
                {error}
              </div>
            )}
            
            <Button 
              type="submit"
              className="w-full"
              disabled={loading || code.length !== 6}
            >
              {loading ? (
                <span className="flex items-center">
                  <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </span>
              ) : (
                'Verify Code'
              )}
            </Button>
            
            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={handleBackToEmail}
                className="text-sm text-gray-500 hover:text-gray-700"
                disabled={loading}
              >
                Back to Email
              </button>
              <br />
              <button
                type="button"
                onClick={handleSendCode}
                className="text-sm text-blue-600 hover:text-blue-700"
                disabled={loading}
              >
                Resend Code
              </button>
            </div>
          </form>
        )}

        {step === 'new_password' && (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="text-center space-y-2 mb-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <h3 className="text-lg font-semibold text-gray-900">Set New Password</h3>
              <p className="text-sm text-gray-600">
                Your code has been verified. Please enter your new password.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {newPassword && (
                <p className={`text-xs ${passwordValid ? 'text-green-600' : 'text-red-600'}`}>
                  {passwordValid ? '✓ Password meets requirements' : '✗ Password must be at least 6 characters'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {confirmPassword && (
                <p className={`text-xs ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                  {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
            </div>
            
            {error && (
              <div className="text-sm text-red-500 p-3 bg-red-50 rounded-md border border-red-200">
                {error}
              </div>
            )}
            
            <Button 
              type="submit"
              className="w-full"
              disabled={loading || !passwordValid || !passwordsMatch}
            >
              {loading ? (
                <span className="flex items-center">
                  <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Password...
                </span>
              ) : (
                'Update Password'
              )}
            </Button>
            
            <div className="text-center">
              <button
                type="button"
                onClick={handleBackToCode}
                className="text-sm text-gray-500 hover:text-gray-700"
                disabled={loading}
              >
                Back to Verification
              </button>
            </div>
          </form>
        )}
      </div>
    </ScrollArea>
  );
};

export default ForgotPasswordForm;
