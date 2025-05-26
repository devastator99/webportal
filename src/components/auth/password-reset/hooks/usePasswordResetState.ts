
import { useState } from 'react';

type StepType = 'phone' | 'otp' | 'email_confirmation' | 'password';

export const usePasswordResetState = () => {
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

  const resetFlow = () => {
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

  const goBackToOtp = () => {
    setStep('otp');
    setEmail('');
    setError(null);
    setShowEmailConfirmation(false);
  };

  return {
    step,
    setStep,
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
    setLoading,
    error,
    setError,
    sessionToken,
    setSessionToken,
    showEmailConfirmation,
    setShowEmailConfirmation,
    resetFlow,
    goBackToOtp
  };
};
