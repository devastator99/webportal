
import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRegistrationStatus, RegistrationStatusValues } from '@/types/registration';
import { registrationErrorHandler } from '@/utils/registrationErrorHandler';
import { useIntelligentPolling } from '@/hooks/useIntelligentPolling';
import { useEnhancedRegistrationState } from '@/hooks/useEnhancedRegistrationState';

interface RegistrationOptions {
  registrationFee?: number;
  currency?: string;
  redirectUrl?: string;
}

interface RegistrationCache {
  status: UserRegistrationStatus | null;
  timestamp: number;
  expiryTime: number;
}

export function useEnhancedRegistrationProcess(options: RegistrationOptions = {}) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [registrationProgress, setRegistrationProgress] = useState<{
    status: string;
    tasks: { id: string; task_type: string; status: string }[];
  } | null>(null);

  const cacheRef = useRef<RegistrationCache>({ status: null, timestamp: 0, expiryTime: 30000 }); // 30 second cache
  const enhancedState = useEnhancedRegistrationState();
  
  const defaultOptions = {
    registrationFee: options.registrationFee || 500,
    currency: options.currency || 'INR',
    redirectUrl: options.redirectUrl || '/dashboard'
  };

  // Enhanced status fetching with caching
  const fetchRegistrationStatus = useCallback(async (): Promise<UserRegistrationStatus | null> => {
    if (!user?.id) {
      setError('User not authenticated');
      return null;
    }

    // Check cache first
    const now = Date.now();
    if (cacheRef.current.status && (now - cacheRef.current.timestamp) < cacheRef.current.expiryTime) {
      console.log('[EnhancedRegistrationProcess] Using cached status');
      return cacheRef.current.status;
    }

    try {
      console.log('[EnhancedRegistrationProcess] Fetching fresh status from database');
      
      const result = await registrationErrorHandler.executeWithRetry(
        async () => {
          const { data, error } = await supabase.rpc('get_user_registration_status_safe', {
            p_user_id: user.id
          });
          
          if (error) throw error;
          return data;
        },
        'fetch_registration_status',
        { maxRetries: 2, baseDelay: 1000 }
      );
      
      const regData = result as unknown as UserRegistrationStatus;
      
      // Update cache
      cacheRef.current = {
        status: regData,
        timestamp: now,
        expiryTime: 30000
      };
      
      setRegistrationProgress({
        status: regData.registration_status || 'payment_pending',
        tasks: regData.tasks || []
      });
      
      return regData;
      
    } catch (err: any) {
      console.error('[EnhancedRegistrationProcess] Error fetching status:', err);
      const errorDetails = registrationErrorHandler.categorizeError(err);
      const userMessage = registrationErrorHandler.getUserFriendlyMessage(err);
      
      setError(userMessage);
      enhancedState.recordError(`Status fetch failed: ${err.message}`);
      return null;
    }
  }, [user?.id, enhancedState]);

  // Intelligent polling setup
  const {
    result: pollingResult,
    error: pollingError,
    startPolling,
    stopPolling,
    isPolling,
    pollingState
  } = useIntelligentPolling(
    fetchRegistrationStatus,
    (result) => {
      if (!result) return true; // Continue polling if no result
      
      // Stop polling if fully registered
      if (result.registration_status === RegistrationStatusValues.FULLY_REGISTERED) {
        const requiredTaskTypes = ['assign_care_team', 'create_chat_room', 'send_welcome_notification'];
        const completedTasks = result.tasks?.filter(task => task.status === 'completed') || [];
        const completedTaskTypes = completedTasks.map(task => task.task_type);
        
        return !requiredTaskTypes.every(taskType => completedTaskTypes.includes(taskType));
      }
      
      return true; // Continue polling for other statuses
    },
    {
      initialInterval: 8000, // Start with 8 seconds
      maxInterval: 45000, // Max 45 seconds
      backoffMultiplier: 1.3,
      maxDuration: 600000, // 10 minutes max
      successResetInterval: true
    }
  );

  // Enhanced order creation
  const createOrder = useCallback(async () => {
    if (!user?.id) {
      const message = 'User not authenticated';
      setError(message);
      toast({
        title: 'Authentication Error',
        description: 'Please sign in before registration',
        variant: 'destructive'
      });
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[EnhancedRegistrationProcess] Creating order for user:', user.id);
      
      const result = await registrationErrorHandler.executeWithRetry(
        async () => {
          const { data, error } = await supabase.functions.invoke('create-registration-order', {
            body: {
              user_id: user.id,
              amount: defaultOptions.registrationFee,
              currency: defaultOptions.currency
            }
          });
          
          if (error) throw error;
          return data;
        },
        'create_order',
        { maxRetries: 2, baseDelay: 2000 }
      );
      
      console.log('[EnhancedRegistrationProcess] Order creation result:', result);
      
      if (!result?.order_id) {
        throw new Error('No order ID returned from server');
      }
      
      setOrderId(result.order_id);
      return result;
      
    } catch (err: any) {
      console.error('[EnhancedRegistrationProcess] Error creating order:', err);
      const userMessage = registrationErrorHandler.getUserFriendlyMessage(err);
      
      setError(userMessage);
      enhancedState.recordError(`Order creation failed: ${err.message}`);
      
      toast({
        title: 'Order Creation Failed',
        description: userMessage,
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, defaultOptions, enhancedState, toast]);

  // Enhanced registration completion
  const completeRegistration = useCallback(async (
    paymentId: string,
    orderId: string,
    signature?: string
  ) => {
    if (!user?.id) {
      setError('User not authenticated');
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[EnhancedRegistrationProcess] Completing registration with:', {
        user_id: user.id,
        payment_id: paymentId,
        order_id: orderId
      });
      
      // Update local state immediately
      enhancedState.updatePaymentStatus(true, false);
      enhancedState.updateRegistrationStep(3);
      
      const result = await registrationErrorHandler.executeWithRetry(
        async () => {
          const { data, error } = await supabase.functions.invoke('complete-registration', {
            body: {
              user_id: user.id,
              razorpay_payment_id: paymentId,
              razorpay_order_id: orderId,
              razorpay_signature: signature || 'manual'
            }
          });
          
          if (error) throw error;
          return data;
        },
        'complete_registration',
        { maxRetries: 3, baseDelay: 2000 }
      );
      
      console.log('[EnhancedRegistrationProcess] Complete registration response:', result);
      
      // Invalidate cache
      cacheRef.current = { status: null, timestamp: 0, expiryTime: 30000 };
      
      // Start intelligent polling for status updates
      startPolling();
      
      toast({
        title: 'Registration Payment Complete',
        description: 'Your payment was successful. Your care team is being assigned.',
      });
      
      return true;
      
    } catch (err: any) {
      console.error('[EnhancedRegistrationProcess] Error completing registration:', err);
      const userMessage = registrationErrorHandler.getUserFriendlyMessage(err);
      
      setError(userMessage);
      enhancedState.recordError(`Registration completion failed: ${err.message}`);
      
      toast({
        title: 'Registration Failed',
        description: userMessage,
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, enhancedState, startPolling, toast]);

  // Enhanced task processing trigger
  const triggerTaskProcessing = useCallback(async () => {
    if (!user?.id) {
      toast({
        title: 'Authentication Error',
        description: 'User not authenticated',
        variant: 'destructive'
      });
      return false;
    }

    try {
      console.log('[EnhancedRegistrationProcess] Triggering task processing for user:', user.id);
      
      const result = await registrationErrorHandler.executeWithRetry(
        async () => {
          const { data, error } = await supabase.functions.invoke('trigger-registration-notifications', {
            body: { patient_id: user.id }
          });
          
          if (error) throw error;
          return data;
        },
        'trigger_tasks',
        { maxRetries: 2, baseDelay: 3000 }
      );
      
      console.log('[EnhancedRegistrationProcess] Task processing result:', result);
      
      // Invalidate cache and refresh
      cacheRef.current = { status: null, timestamp: 0, expiryTime: 30000 };
      await fetchRegistrationStatus();
      
      toast({
        title: 'Task Processing Triggered',
        description: result?.message || 'Registration tasks are being processed',
      });
      
      return true;
    } catch (err: any) {
      console.error('[EnhancedRegistrationProcess] Error triggering task processing:', err);
      const userMessage = registrationErrorHandler.getUserFriendlyMessage(err);
      
      enhancedState.recordError(`Task processing failed: ${err.message}`);
      
      toast({
        title: 'Task Processing Failed',
        description: userMessage,
        variant: 'destructive'
      });
      return false;
    }
  }, [user?.id, enhancedState, fetchRegistrationStatus, toast]);

  // Handle polling completion
  useEffect(() => {
    if (pollingResult && pollingResult.registration_status === RegistrationStatusValues.FULLY_REGISTERED) {
      console.log('[EnhancedRegistrationProcess] Registration completed, redirecting...');
      
      // Clear all registration state
      enhancedState.clearRegistrationState();
      
      toast({
        title: 'Registration Complete',
        description: 'Your account setup is complete. Welcome aboard!',
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate(defaultOptions.redirectUrl);
      }, 2000);
    }
  }, [pollingResult, enhancedState, navigate, defaultOptions.redirectUrl, toast]);

  // Handle polling errors
  useEffect(() => {
    if (pollingError) {
      console.error('[EnhancedRegistrationProcess] Polling error:', pollingError);
      setError(pollingError);
    }
  }, [pollingError]);

  // Initialize by fetching current status
  useEffect(() => {
    if (user?.id && !registrationProgress) {
      fetchRegistrationStatus();
    }
  }, [user?.id, registrationProgress, fetchRegistrationStatus]);

  return {
    createOrder,
    completeRegistration,
    fetchRegistrationStatus,
    triggerTaskProcessing,
    startPolling,
    stopPolling,
    isLoading,
    orderId,
    error,
    registrationProgress,
    isPolling,
    pollingState,
    enhancedState
  };
}
