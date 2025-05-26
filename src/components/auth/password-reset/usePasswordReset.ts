
import { usePasswordResetState } from './hooks/usePasswordResetState';
import { usePasswordResetActions } from './hooks/usePasswordResetActions';

export const usePasswordReset = (onClose: () => void) => {
  const state = usePasswordResetState();
  
  const actions = usePasswordResetActions({
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
    onClose
  });

  return {
    // State
    step: state.step,
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
    handleSendOtp: actions.handleSendOtp,
    handleVerifyOtp: actions.handleVerifyOtp,
    handleEmailConfirmation: actions.handleEmailConfirmation,
    handleUpdatePassword: actions.handleUpdatePassword,
    resetFlow: state.resetFlow,
    goBackToOtp: state.goBackToOtp,
    handleResendOtp: actions.handleResendOtp
  };
};
