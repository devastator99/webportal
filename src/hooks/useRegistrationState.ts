
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface RegistrationState {
  step: number;
  userRole: string | null;
  paymentComplete: boolean;
  paymentPending: boolean;
  isProcessing: boolean;
  hasIncompleteRegistration: boolean;
}

export const useRegistrationState = () => {
  const { user, userRole } = useAuth();
  const [debugMode, setDebugMode] = useState(false);

  // Get current registration state from localStorage
  const getRegistrationState = useCallback((): RegistrationState => {
    const savedStep = localStorage.getItem('registration_step');
    const savedRole = localStorage.getItem('registration_user_role');
    const paymentComplete = localStorage.getItem('registration_payment_complete') === 'true';
    const paymentPending = localStorage.getItem('registration_payment_pending') === 'true';
    
    // Detect incomplete registration: user exists but no role and no active registration
    const hasIncompleteRegistration = !!(user && !userRole && !savedStep && !savedRole);
    
    return {
      step: savedStep ? parseInt(savedStep, 10) : 1,
      userRole: savedRole,
      paymentComplete,
      paymentPending,
      isProcessing: false,
      hasIncompleteRegistration
    };
  }, [user, userRole]);

  // Check if user is in active registration flow
  const isUserInActiveRegistration = useCallback((): boolean => {
    const state = getRegistrationState();
    return !!(state.step > 1 && state.userRole);
  }, [getRegistrationState]);

  // Update registration step
  const updateRegistrationStep = useCallback((step: number) => {
    if (debugMode) {
      console.log(`[RegistrationState] Updating step to: ${step}`);
    }
    localStorage.setItem('registration_step', step.toString());
  }, [debugMode]);

  // Update user role
  const updateUserRole = useCallback((role: string) => {
    if (debugMode) {
      console.log(`[RegistrationState] Updating role to: ${role}`);
    }
    localStorage.setItem('registration_user_role', role);
  }, [debugMode]);

  // Update payment status
  const updatePaymentStatus = useCallback((complete: boolean, pending: boolean = false) => {
    if (debugMode) {
      console.log(`[RegistrationState] Updating payment: complete=${complete}, pending=${pending}`);
    }
    localStorage.setItem('registration_payment_complete', complete.toString());
    localStorage.setItem('registration_payment_pending', pending.toString());
  }, [debugMode]);

  // Clear all registration state
  const clearRegistrationState = useCallback(() => {
    if (debugMode) {
      console.log('[RegistrationState] Clearing all registration state');
    }
    localStorage.removeItem('registration_step');
    localStorage.removeItem('registration_user_role');
    localStorage.removeItem('registration_payment_complete');
    localStorage.removeItem('registration_payment_pending');
  }, [debugMode]);

  // Validate registration state consistency
  const validateState = useCallback((): { isValid: boolean; issues: string[] } => {
    const state = getRegistrationState();
    const issues: string[] = [];

    // Check for inconsistent states
    if (state.paymentComplete && state.paymentPending) {
      issues.push('Payment cannot be both complete and pending');
    }

    if (state.step > 1 && !state.userRole) {
      issues.push('Step > 1 but no user role defined');
    }

    if (state.userRole === 'patient' && state.step === 3 && !state.paymentComplete) {
      issues.push('Patient at step 3 but payment not complete');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }, [getRegistrationState]);

  // Auto-fix common state issues
  const fixStateIssues = useCallback(() => {
    const validation = validateState();
    if (!validation.isValid) {
      if (debugMode) {
        console.log('[RegistrationState] Fixing state issues:', validation.issues);
      }
      
      // Reset to safe state
      clearRegistrationState();
      return true;
    }
    return false;
  }, [validateState, clearRegistrationState, debugMode]);

  // Enable debug mode in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setDebugMode(true);
    }
  }, []);

  return {
    getRegistrationState,
    isUserInActiveRegistration,
    updateRegistrationStep,
    updateUserRole,
    updatePaymentStatus,
    clearRegistrationState,
    validateState,
    fixStateIssues,
    debugMode
  };
};
