
import { toast } from '@/hooks/use-toast';
import { sendOtpToPhone, sendOtpToEmail, verifyOtpCode, linkPhoneToEmail, updatePasswordWithToken } from '../services/passwordResetService';
import type { StepType, PasswordResetActions, ResetMethod } from '../types';

interface UsePasswordResetActionsProps {
  resetMethod: ResetMethod | null;
  phoneNumber: string;
  otp: string;
  email: string;
  newPassword: string;
  confirmPassword: string;
  sessionToken: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setStep: (step: StepType) => void;
  setShowEmailConfirmation: (show: boolean) => void;
  setSessionToken: (token: string | null) => void;
  setResetMethod: (method: ResetMethod | null) => void;
  onClose: () => void;
}

export const usePasswordResetActions = (props: UsePasswordResetActionsProps): PasswordResetActions => {
  const {
    resetMethod,
    phoneNumber,
    otp,
    email,
    newPassword,
    confirmPassword,
    sessionToken,
    setLoading,
    setError,
    setStep,
    setShowEmailConfirmation,
    setSessionToken,
    setResetMethod,
    onClose
  } = props;

  const handleMethodSelection = (method: ResetMethod): void => {
    setResetMethod(method);
    if (method === 'sms') {
      setStep('phone');
    } else {
      setStep('email');
    }
    setError(null);
  };

  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    setLoading(true);
    setError(null);
    
    try {
      if (resetMethod === 'sms') {
        await sendOtpToPhone(phoneNumber);
        toast({
          title: 'OTP Sent',
          description: 'Check your phone for the verification code.',
        });
      } else if (resetMethod === 'email') {
        await sendOtpToEmail(email);
        toast({
          title: 'OTP Sent',
          description: 'Check your email for the verification code.',
        });
      } else {
        throw new Error('Please select a reset method');
      }
      
      setStep('otp');
    } catch (error: any) {
      console.error('[Password Reset] Send OTP error:', error);
      const errorMessage: string = error.message || 'Failed to send OTP';
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

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    
    if (!resetMethod) {
      setError('Reset method not selected');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('[Password Reset] Starting OTP verification process...');
      const contact = resetMethod === 'sms' ? phoneNumber : email;
      const result = await verifyOtpCode(contact, otp, resetMethod);
      
      console.log('[Password Reset] OTP verification result:', result);
      
      if (result.needsEmailConfirmation) {
        console.log('[Password Reset] User not found, showing email confirmation step');
        setShowEmailConfirmation(true);
        setStep('email_confirmation');
        const emailConfirmMessage: string = resetMethod === 'sms' 
          ? 'No account found with this phone number. Please enter your email address to link your phone number to your account.'
          : 'No account found with this email address. Please check your email or create a new account.';
        setError(emailConfirmMessage);
        toast({
          title: 'Account Linking Required',
          description: emailConfirmMessage,
          variant: 'default',
        });
        return;
      }
      
      if (result.sessionToken) {
        console.log('[Password Reset] OTP verified successfully, setting session token');
        setSessionToken(result.sessionToken);
        setStep('password');
        toast({
          title: 'OTP Verified',
          description: 'Please set your new password.',
        });
        return;
      }
      
      // This should not happen if our logic is correct
      throw new Error('Unexpected verification result');
      
    } catch (error: any) {
      console.error('[Password Reset] OTP verification error:', error);
      
      let errorMessage: string = error.message || 'Invalid OTP';
      
      // Provide more specific error messages based on the error content
      if (error.message?.includes('Invalid or expired')) {
        errorMessage = 'The OTP has expired or is invalid. Please request a new OTP.';
      } else if (error.message?.includes('already used')) {
        errorMessage = 'This OTP has already been used. Please request a new OTP.';
      } else if (error.message?.includes('Failed to verify OTP')) {
        errorMessage = 'Unable to verify OTP. Please check your internet connection and try again.';
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
      console.log('[Password Reset] Starting email confirmation process...');
      const token: string = await linkPhoneToEmail(email, phoneNumber, otp);
      setSessionToken(token);
      setStep('password');
      toast({
        title: 'Account Linked Successfully',
        description: 'Your phone number has been linked to your account. Please set your new password.',
      });
    } catch (error: any) {
      console.error('[Password Reset] Email confirmation error:', error);
      const errorMessage: string = error.message || 'Failed to link account';
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
      if (!sessionToken) {
        throw new Error('Session token is missing');
      }
      
      await updatePasswordWithToken(sessionToken, newPassword);
      toast({
        title: 'Password Updated',
        description: 'Your password has been updated successfully.',
      });
      
      onClose();
    } catch (error: any) {
      console.error('[Password Reset] Password update error:', error);
      const errorMessage: string = error.message || 'Failed to update password';
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

  const handleResendOtp = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      if (resetMethod === 'sms') {
        await sendOtpToPhone(phoneNumber);
        toast({
          title: 'OTP Sent',
          description: 'Check your phone for the verification code.',
        });
      } else if (resetMethod === 'email') {
        await sendOtpToEmail(email);
        toast({
          title: 'OTP Sent',
          description: 'Check your email for the verification code.',
        });
      } else {
        throw new Error('Reset method not selected');
      }
    } catch (error: any) {
      console.error('[Password Reset] OTP resend error:', error);
      const errorMessage: string = error.message || 'Failed to send OTP';
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

  return {
    handleMethodSelection,
    handleSendOtp,
    handleVerifyOtp,
    handleEmailConfirmation,
    handleUpdatePassword,
    handleResendOtp
  };
};
