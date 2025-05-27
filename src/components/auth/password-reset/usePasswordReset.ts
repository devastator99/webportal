
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export type PasswordResetStep = 'phone' | 'otp' | 'email_confirmation' | 'password';

export function usePasswordReset(onClose: () => void) {
  const [step, setStep] = useState<PasswordResetStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!phoneNumber) {
      setError('Please enter a phone number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-password-reset-sms', {
        body: { phoneNumber }
      });

      if (error) {
        throw new Error(error.message || 'Failed to send OTP');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      toast({
        title: 'OTP Sent',
        description: 'Check your phone for the verification code.',
      });
      
      setStep('otp');
    } catch (error: any) {
      console.error('Send OTP error:', error);
      const errorMessage = error.message || 'Failed to send OTP';
      setError(errorMessage);
      toast({
        title: 'Failed to Send OTP',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('verify-password-reset-otp', {
        body: { 
          phoneNumber,
          otp,
          resetMethod: 'sms'
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to verify OTP');
      }

      if (!data.success) {
        if (data.needsEmailConfirmation || data.phoneNotRegistered) {
          setStep('email_confirmation');
          setError(data.error || 'Phone number not registered. Please enter your email address.');
          return;
        }
        throw new Error(data.error || 'Invalid OTP');
      }

      if (data.sessionToken) {
        setSessionToken(data.sessionToken);
        setStep('password');
        toast({
          title: 'OTP Verified',
          description: 'Please set your new password.',
        });
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      const errorMessage = error.message || 'Invalid OTP';
      setError(errorMessage);
      toast({
        title: 'OTP Verification Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailConfirmation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // For now, just show a message that this feature is not available
      toast({
        title: 'Feature Not Available',
        description: 'Phone to email linking is currently unavailable. Please use email reset instead.',
        variant: 'destructive',
      });
      
      // Reset the flow
      resetFlow();
    } catch (error: any) {
      console.error('Email confirmation error:', error);
      const errorMessage = error.message || 'Failed to link account';
      setError(errorMessage);
      toast({
        title: 'Account Linking Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!sessionToken) {
      setError('Session expired. Please start over.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('update-password-with-sms-token', {
        body: { 
          sessionToken,
          newPassword
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to update password');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to update password');
      }

      toast({
        title: 'Password Updated',
        description: 'Your password has been updated successfully.',
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

  const handleResendOtp = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.functions.invoke('send-password-reset-sms', {
        body: { phoneNumber }
      });

      if (error) {
        throw new Error(error.message || 'Failed to send OTP');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      toast({
        title: 'OTP Sent',
        description: 'A new verification code has been sent to your phone.',
      });
    } catch (error: any) {
      console.error('OTP resend error:', error);
      const errorMessage = error.message || 'Failed to send OTP';
      setError(errorMessage);
      toast({
        title: 'Failed to Send OTP',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep('phone');
    setPhoneNumber('');
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSessionToken(null);
  };

  const goBackToOtp = () => {
    setStep('otp');
    setError(null);
  };

  return {
    step,
    phoneNumber,
    setPhoneNumber,
    email,
    setEmail,
    otp,
    setOtp,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    error,
    handleSendOtp,
    handleVerifyOtp,
    handleEmailConfirmation,
    handleUpdatePassword,
    resetFlow,
    goBackToOtp,
    handleResendOtp
  };
}
