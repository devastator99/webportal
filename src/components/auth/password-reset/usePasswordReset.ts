import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type StepType = 'phone' | 'otp' | 'email_confirmation' | 'password';

export const usePasswordReset = (onClose: () => void) => {
  const [step, setStep] = useState<StepType>('phone');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState<boolean>(false);

  const sendOtpToPhone = async (): Promise<void> => {
    if (!phoneNumber) {
      setError('Please enter your phone number');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('[SMS OTP] Sending OTP to:', phoneNumber);
      
      const { data, error } = await supabase.functions.invoke('send-password-reset-sms', {
        body: { 
          phoneNumber: phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`
        }
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to send OTP');
      }

      if (data.error) {
        throw new Error(data.error);
      }
      
      console.log('[SMS OTP] OTP sent successfully');
      setStep('otp');
      toast({
        title: 'OTP Sent',
        description: 'Check your phone for the verification code.',
      });
      
    } catch (error: any) {
      console.error('SMS OTP send error:', error);
      setError(error.message || 'Failed to send OTP');
      toast({
        title: 'Failed to Send OTP',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    await sendOtpToPhone();
  };

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('[SMS OTP] Verifying OTP:', otp);
      
      const { data, error } = await supabase.functions.invoke('verify-password-reset-otp', {
        body: { 
          phoneNumber: phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`,
          otp 
        }
      });
      
      if (error) {
        throw new Error(error.message || 'Invalid OTP');
      }

      if (data.error) {
        if (data.error.includes('No account found') || data.error.includes('No user found')) {
          console.log('[SMS OTP] User not found, showing email confirmation step');
          setShowEmailConfirmation(true);
          setStep('email_confirmation');
          const emailConfirmMessage = 'No account found with this phone number. Please enter your email address to link your phone number to your account.';
          setError(emailConfirmMessage);
          toast({
            title: 'Account Linking Required',
            description: emailConfirmMessage,
            variant: 'default',
          });
          return;
        }
        throw new Error(data.error);
      }
      
      console.log('[SMS OTP] OTP verified successfully');
      setSessionToken(data.sessionToken);
      setStep('password');
      toast({
        title: 'OTP Verified',
        description: 'Please set your new password.',
      });
      
    } catch (error: any) {
      console.error('OTP verification error:', error);
      
      let errorMessage = error.message || 'Invalid OTP';
      
      if (error.message?.includes('Invalid or expired')) {
        errorMessage = 'The OTP has expired or is invalid. Please request a new OTP.';
      } else if (error.message?.includes('already used')) {
        errorMessage = 'This OTP has already been used. Please request a new OTP.';
      }
      
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

  const handleEmailConfirmation = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('[SMS OTP] Attempting to link phone number to email:', email);
      
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();
      
      if (userError || !userData) {
        throw new Error('No account found with this email address. Please check your email or create a new account.');
      }
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ phone: phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}` })
        .eq('id', userData.id);
      
      if (updateError) {
        throw new Error('Failed to link phone number to your account. Please try again.');
      }
      
      const { data, error } = await supabase.functions.invoke('verify-password-reset-otp', {
        body: { 
          phoneNumber: phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`,
          otp 
        }
      });
      
      if (error || data.error) {
        throw new Error(data?.error || error.message || 'Failed to verify OTP after linking account');
      }
      
      console.log('[SMS OTP] Phone number linked and OTP verified successfully');
      setSessionToken(data.sessionToken);
      setStep('password');
      toast({
        title: 'Account Linked Successfully',
        description: 'Your phone number has been linked to your account. Please set your new password.',
      });
      
    } catch (error: any) {
      console.error('Email confirmation error:', error);
      setError(error.message || 'Failed to link account');
      toast({
        title: 'Account Linking Failed',
        description: error.message || 'Please try again or contact support',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
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
      console.log('[SMS OTP] Updating password');
      
      const { data, error } = await supabase.functions.invoke('update-password-with-sms-token', {
        body: { 
          sessionToken,
          newPassword 
        }
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to update password');
      }

      if (data.error) {
        throw new Error(data.error);
      }
      
      console.log('[SMS OTP] Password updated successfully');
      toast({
        title: 'Password Updated',
        description: 'Your password has been updated successfully.',
      });
      
      onClose();
      
    } catch (error: any) {
      console.error('Password update error:', error);
      setError(error.message || 'Failed to update password');
      toast({
        title: 'Password Update Failed',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = (): void => {
    setStep('phone');
    setPhoneNumber('');
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSessionToken(null);
    setShowEmailConfirmation(false);
  };

  const goBackToOtp = (): void => {
    setStep('otp');
    setEmail('');
    setError(null);
    setShowEmailConfirmation(false);
  };

  const handleResendOtp = async (): Promise<void> => {
    await sendOtpToPhone();
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
    sessionToken,
    showEmailConfirmation,
    handleSendOtp,
    handleVerifyOtp,
    handleEmailConfirmation,
    handleUpdatePassword,
    resetFlow,
    goBackToOtp,
    handleResendOtp
  };
};
