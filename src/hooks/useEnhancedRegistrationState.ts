
import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface EnhancedRegistrationState {
  step: number;
  userRole: string | null;
  paymentComplete: boolean;
  paymentPending: boolean;
  isProcessing: boolean;
  hasIncompleteRegistration: boolean;
  lastValidationTime: number;
  errorCount: number;
  lastError: string | null;
}

export const useEnhancedRegistrationState = () => {
  const { user, userRole } = useAuth();
  const [debugMode, setDebugMode] = useState(false);

  // Atomic localStorage operations with error handling
  const atomicSetItem = useCallback((key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Failed to set localStorage item ${key}:`, error);
      return false;
    }
  }, []);

  const atomicGetItem = useCallback((key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Failed to get localStorage item ${key}:`, error);
      return null;
    }
  }, []);

  const atomicRemoveItem = useCallback((key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to remove localStorage item ${key}:`, error);
      return false;
    }
  }, []);

  // Helper functions
  const getStoredRole = useCallback(() => atomicGetItem('registration_user_role'), [atomicGetItem]);
  const getStoredPaymentStatus = useCallback((): boolean => {
    return atomicGetItem('registration_payment_complete') === 'true';
  }, [atomicGetItem]);

  // Enhanced state retrieval with validation
  const getRegistrationState = useCallback((): EnhancedRegistrationState => {
    const now = Date.now();
    const savedStep = atomicGetItem('registration_step');
    const savedRole = getStoredRole();
    const paymentComplete = getStoredPaymentStatus();
    const paymentPending = atomicGetItem('registration_payment_pending') === 'true';
    const lastValidation = parseInt(atomicGetItem('registration_last_validation') || '0', 10);
    const errorCount = parseInt(atomicGetItem('registration_error_count') || '0', 10);
    const lastError = atomicGetItem('registration_last_error');

    // Detect incomplete registration
    const hasIncompleteRegistration = Boolean(user && !userRole && !savedStep && !savedRole);
    
    const state: EnhancedRegistrationState = {
      step: savedStep ? parseInt(savedStep, 10) : 1,
      userRole: savedRole,
      paymentComplete,
      paymentPending,
      isProcessing: false,
      hasIncompleteRegistration,
      lastValidationTime: lastValidation,
      errorCount,
      lastError
    };

    return state;
  }, [user, userRole, atomicGetItem, getStoredRole, getStoredPaymentStatus]);

  // State validation with auto-correction
  const validateAndCorrectState = useCallback((): { isValid: boolean; issues: string[]; corrected: boolean } => {
    const state = getRegistrationState();
    const issues: string[] = [];
    let corrected = false;

    // Check for inconsistent payment states
    if (state.paymentComplete && state.paymentPending) {
      issues.push('Payment cannot be both complete and pending');
      atomicSetItem('registration_payment_pending', 'false');
      corrected = true;
    }

    // Check step progression logic
    if (state.step > 1 && !state.userRole) {
      issues.push('Step > 1 but no user role defined');
      atomicSetItem('registration_step', '1');
      corrected = true;
    }

    // Check patient payment logic
    if (state.userRole === 'patient' && state.step === 3 && !state.paymentComplete) {
      issues.push('Patient at step 3 but payment not complete');
      atomicSetItem('registration_step', '2');
      corrected = true;
    }

    // Update validation timestamp
    atomicSetItem('registration_last_validation', Date.now().toString());

    if (debugMode && (issues.length > 0 || corrected)) {
      console.log('[EnhancedRegistrationState] Validation result:', { issues, corrected });
    }

    return {
      isValid: issues.length === 0,
      issues,
      corrected
    };
  }, [getRegistrationState, atomicSetItem, debugMode]);

  // SIMPLIFIED state transitions
  const updateRegistrationStep = useCallback((step: number): boolean => {
    if (debugMode) {
      console.log(`[EnhancedRegistrationState] Updating step to: ${step}`);
    }

    const success = atomicSetItem('registration_step', step.toString());
    if (success) {
      // Reset error count on successful step update
      atomicSetItem('registration_error_count', '0');
      atomicRemoveItem('registration_last_error');
    }
    return success;
  }, [atomicSetItem, atomicRemoveItem, debugMode]);

  // SIMPLIFIED role update
  const updateUserRole = useCallback((role: string): boolean => {
    if (debugMode) {
      console.log(`[EnhancedRegistrationState] Updating role to: ${role}`);
    }

    return atomicSetItem('registration_user_role', role);
  }, [atomicSetItem, debugMode]);

  // Enhanced payment status update
  const updatePaymentStatus = useCallback((complete: boolean, pending: boolean = false): boolean => {
    if (debugMode) {
      console.log(`[EnhancedRegistrationState] Updating payment: complete=${complete}, pending=${pending}`);
    }

    // Validate payment state logic
    if (complete && pending) {
      console.error('[EnhancedRegistrationState] Invalid payment state: cannot be both complete and pending');
      return false;
    }

    const success1 = atomicSetItem('registration_payment_complete', complete.toString());
    const success2 = atomicSetItem('registration_payment_pending', pending.toString());
    
    return success1 && success2;
  }, [atomicSetItem, debugMode]);

  // Enhanced error handling
  const recordError = useCallback((error: string): void => {
    const currentCount = parseInt(atomicGetItem('registration_error_count') || '0', 10);
    const newCount = currentCount + 1;
    
    atomicSetItem('registration_error_count', newCount.toString());
    atomicSetItem('registration_last_error', error);
    atomicSetItem('registration_last_error_time', Date.now().toString());

    if (debugMode) {
      console.error(`[EnhancedRegistrationState] Error recorded (${newCount}):`, error);
    }

    // Auto-reset if too many errors
    if (newCount >= 3) {
      if (debugMode) {
        console.warn('[EnhancedRegistrationState] Max errors reached, clearing state');
      }
      clearRegistrationState();
    }
  }, [atomicGetItem, atomicSetItem, debugMode]);

  // Enhanced state clearing
  const clearRegistrationState = useCallback((): boolean => {
    if (debugMode) {
      console.log('[EnhancedRegistrationState] Clearing all registration state');
    }

    const keys = [
      'registration_step',
      'registration_user_role',
      'registration_payment_complete',
      'registration_payment_pending',
      'registration_last_validation',
      'registration_error_count',
      'registration_last_error',
      'registration_last_error_time'
    ];

    let allSuccess = true;
    keys.forEach(key => {
      if (!atomicRemoveItem(key)) {
        allSuccess = false;
      }
    });

    return allSuccess;
  }, [atomicRemoveItem, debugMode]);

  // Check if user is in active registration flow - SIMPLIFIED
  const isUserInActiveRegistration = useCallback((): boolean => {
    const state = getRegistrationState();
    // User is in active registration if they have a role set and are not at step 1
    return Boolean(state.userRole && state.step > 1);
  }, [getRegistrationState]);

  // Database state synchronization
  const syncWithDatabase = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { data, error } = await supabase.rpc('get_user_registration_status_safe', {
        p_user_id: user.id
      });

      if (error) {
        recordError(`Database sync failed: ${error.message}`);
        return false;
      }

      // Update local state based on database state
      if (data) {
        const dbStatus = data.registration_status;
        if (dbStatus === 'fully_registered' && userRole) {
          clearRegistrationState();
          return true;
        }
      }

      return true;
    } catch (error: any) {
      recordError(`Database sync exception: ${error.message}`);
      return false;
    }
  }, [user?.id, userRole, recordError, clearRegistrationState]);

  // Initialize debug mode
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
    validateAndCorrectState,
    recordError,
    syncWithDatabase,
    debugMode
  };
};
