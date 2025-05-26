
import { toast } from '@/hooks/use-toast';
import { sendOtpToPhone, verifyOtpCode, linkPhoneToEmail, updatePasswordWithToken } from '../services/passwordResetService';

interface UsePasswordResetActionsProps {
  phoneNumber: string;
  otp: string;
  email: string;
  newPassword: string;
  confirmPassword: string;
  sessionToken: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setStep: (step: 'phone' | 'otp' | 'email_confirmation' | 'password') => void;
  setShowEmailConfirmation: (show: boolean) => void;
  setSessionToken: (token: string | null) => void;
  onClose: () => void;
}

export const usePasswordResetActions = ({
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
  onClose
}: UsePasswordResetActionsProps) => {

  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    setLoading(true);
    setError(null);
    
    try {
      await sendOtpToPhone(phoneNumber);
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

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await verifyOtpCode(phoneNumber, otp);
      
      if (result.needsEmailConfirmation) {
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
      
      setSessionToken(result.sessionToken);
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

  const handleEmailConfirmation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const token = await linkPhoneToEmail(email, phoneNumber, otp);
      setSessionToken(token);
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

  const handleResendOtp = async () => {
    try {
      setLoading(true);
      setError(null);
      await sendOtpToPhone(phoneNumber);
      toast({
        title: 'OTP Sent',
        description: 'Check your phone for the verification code.',
      });
    } catch (error: any) {
      console.error('SMS OTP resend error:', error);
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

  return {
    handleSendOtp,
    handleVerifyOtp,
    handleEmailConfirmation,
    handleUpdatePassword,
    handleResendOtp
  };
};
