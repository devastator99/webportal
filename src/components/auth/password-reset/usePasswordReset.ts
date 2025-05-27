
import { usePasswordResetState } from './hooks/usePasswordResetState';
import { usePasswordResetActions } from './hooks/usePasswordResetActions';
import type { StepType, PasswordResetActions, ResetMethod } from './types';

interface PasswordResetHook extends PasswordResetActions {
  step: StepType;
  resetMethod: ResetMethod | null;
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  otp: string;
  setOtp: (value: string) => void;
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  loading: boolean;
  error: string | null;
  sessionToken: string | null;
  showEmailConfirmation: boolean;
  resetFlow: () => void;
  goBackToOtp: () => void;
}

export const usePasswordReset = (onClose: () => void): PasswordResetHook => {
  const state = usePasswordResetState();
  
  const actions = usePasswordResetActions({
    resetMethod: state.resetMethod,
    phoneNumber: state.phoneNumber,
    otp: state.otp,
    email: state.email,
    newPassword: state.newPassword,
    confirmPassword: state.confirmPassword,
    sessionToken: state.sessionToken,
    setLoading: state.setLoading,
    setError: state.setError,
    setStep: state.setStep,
    setShowEmailConfirmation: state.setShowEmailConfirmation,
    setSessionToken: state.setSessionToken,
    setResetMethod: state.setResetMethod,
    onClose
  });

  return {
    // State
    step: state.step,
    resetMethod: state.resetMethod,
    phoneNumber: state.phoneNumber,
    setPhoneNumber: state.setPhoneNumber,
    email: state.email,
    setEmail: state.setEmail,
    otp: state.otp,
    setOtp: state.setOtp,
    newPassword: state.newPassword,
    setNewPassword: state.setNewPassword,
    confirmPassword: state.confirmPassword,
    setConfirmPassword: state.setConfirmPassword,
    loading: state.loading,
    error: state.error,
    sessionToken: state.sessionToken,
    showEmailConfirmation: state.showEmailConfirmation,
    
    // Actions
    handleMethodSelection: actions.handleMethodSelection,
    handleSendOtp: actions.handleSendOtp,
    handleVerifyOtp: actions.handleVerifyOtp,
    handleEmailConfirmation: actions.handleEmailConfirmation,
    handleUpdatePassword: actions.handleUpdatePassword,
    handleResendOtp: actions.handleResendOtp,
    resetFlow: state.resetFlow,
    goBackToOtp: state.goBackToOtp
  };
};
