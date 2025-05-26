
import { useState } from 'react';
import type { StepType, PasswordResetState } from '../types';

export const usePasswordResetState = (): PasswordResetState & {
  setStep: (step: StepType) => void;
  setPhoneNumber: (phone: string) => void;
  setEmail: (email: string) => void;
  setOtp: (otp: string) => void;
  setNewPassword: (password: string) => void;
  setConfirmPassword: (password: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSessionToken: (token: string | null) => void;
  setShowEmailConfirmation: (show: boolean) => void;
  resetFlow: () => void;
  goBackToOtp: () => void;
} => {
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
