
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRegistrationStatus, RegistrationTask, RegistrationStatusValues } from '@/types/registration';
import { handleSupabaseError, retrySupabaseOperation } from '@/utils/supabaseErrorHandler';

interface RegistrationOptions {
  registrationFee?: number;
  currency?: string;
  redirectUrl?: string;
}

export function useRegistrationProcess(options: RegistrationOptions = {}) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [registrationProgress, setRegistrationProgress] = useState<{
    status: 'payment_pending' | 'payment_complete' | 'care_team_assigned' | 'fully_registered';
    tasks: { id: string; task_type: string; status: string }[];
  } | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const defaultOptions = {
    registrationFee: options.registrationFee || 500,
    currency: options.currency || 'INR',
    redirectUrl: options.redirectUrl || '/dashboard'
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Create a Razorpay order with enhanced error handling
  const createOrder = async () => {
    if (!user?.id) {
      setError('User not authenticated');
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
      console.log("Creating order for user:", user.id);
      
      const result = await retrySupabaseOperation(async () => {
        const { data, error } = await supabase.functions.invoke('create-registration-order', {
          body: {
            user_id: user.id,
            amount: defaultOptions.registrationFee,
            currency: defaultOptions.currency
          }
        });
        
        if (error) {
          throw error;
        }
        
        return data;
      });
      
      console.log("Order creation result:", result);
      
      if (!result?.order_id) {
        throw new Error('No order ID returned from server');
      }
      
      setOrderId(result.order_id);
      return result;
      
    } catch (err: any) {
      console.error('Error creating registration order:', err);
      const errorDetails = handleSupabaseError(err);
      setError(errorDetails.message);
      toast({
        title: 'Order Creation Failed',
        description: errorDetails.message,
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Complete registration after payment with enhanced error handling
  const completeRegistration = async (
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
      console.log("Completing registration with:", {
        user_id: user.id,
        payment_id: paymentId,
        order_id: orderId,
        signature: signature || 'manual'
      });
      
      // Store registration state in localStorage to prevent redirect issues
      localStorage.setItem('registration_payment_pending', 'false');
      localStorage.setItem('registration_payment_complete', 'true');
      
      const result = await retrySupabaseOperation(async () => {
        const { data, error } = await supabase.functions.invoke('complete-registration', {
          body: {
            user_id: user.id,
            razorpay_payment_id: paymentId,
            razorpay_order_id: orderId,
            razorpay_signature: signature || 'manual'
          }
        });
        
        if (error) {
          throw error;
        }
        
        return data;
      });
      
      console.log("Complete registration response:", result);
      
      // Check if tasks were created successfully
      if (result?.tasks) {
        // Update registration status
        await fetchRegistrationProgress();
        
        // Start polling for registration status changes
        startPollingRegistrationStatus();
      }
      
      toast({
        title: 'Registration Payment Complete',
        description: 'Your payment was successful. Your care team is being assigned and you will be notified shortly.',
      });
      
      return true;
      
    } catch (err: any) {
      console.error('Error completing registration:', err);
      const errorDetails = handleSupabaseError(err);
      setError(errorDetails.message);
      toast({
        title: 'Registration Failed',
        description: errorDetails.message,
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Enhanced registration status fetching
  const fetchRegistrationProgress = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return null;
    }
    
    try {
      console.log("Fetching registration status for user:", user.id);
      
      const result = await retrySupabaseOperation(async () => {
        const { data, error } = await supabase.rpc('get_user_registration_status_safe', {
          p_user_id: user.id
        });
        
        if (error) {
          throw error;
        }
        
        return data;
      });
      
      console.log("Registration status result:", result);
      
      // Make sure we parse the data as UserRegistrationStatus
      const regData = result as unknown as UserRegistrationStatus;
      
      setRegistrationProgress({
        status: regData.registration_status || 'payment_pending',
        tasks: regData.tasks || []
      });
      
      return regData;
    } catch (err) {
      console.error('Error fetching registration progress:', err);
      const errorDetails = handleSupabaseError(err);
      setError(errorDetails.message);
      return null;
    }
  };
  
  // Start polling for registration status changes
  const startPollingRegistrationStatus = () => {
    if (isPolling) return;
    
    setIsPolling(true);
    
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    // Poll every 5 seconds
    pollingIntervalRef.current = setInterval(async () => {
      const status = await fetchRegistrationProgress();
      
      // If registration is complete, stop polling
      if (status?.registration_status === RegistrationStatusValues.FULLY_REGISTERED) {
        stopPollingRegistrationStatus();
        
        // Show toast notification
        toast({
          title: 'Registration Complete',
          description: 'Your account setup is complete. You can now access all features.',
        });
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate(defaultOptions.redirectUrl);
        }, 3000);
      }
    }, 5000);
  };
  
  // Stop polling
  const stopPollingRegistrationStatus = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
  };
  
  // Process pending tasks manually with enhanced error handling
  const triggerTaskProcessing = async () => {
    if (!user?.id) {
      toast({
        title: 'Authentication Error',
        description: 'User not authenticated',
        variant: 'destructive'
      });
      return false;
    }

    try {
      console.log("Triggering task processing for user:", user.id);
      
      const result = await retrySupabaseOperation(async () => {
        const { data, error } = await supabase.functions.invoke('trigger-registration-notifications', {
          body: { patient_id: user.id }
        });
        
        if (error) {
          throw error;
        }
        
        return data;
      });
      
      console.log("Task processing result:", result);
      
      // Refresh progress
      await fetchRegistrationProgress();
      
      toast({
        title: 'Task Processing Triggered',
        description: result?.message || 'Registration tasks are being processed',
      });
      
      return true;
    } catch (err: any) {
      console.error('Error triggering task processing:', err);
      const errorDetails = handleSupabaseError(err);
      toast({
        title: 'Task Processing Failed',
        description: errorDetails.message,
        variant: 'destructive'
      });
      return false;
    }
  };
  
  return {
    createOrder,
    completeRegistration,
    fetchRegistrationProgress,
    triggerTaskProcessing,
    startPollingRegistrationStatus,
    stopPollingRegistrationStatus,
    isLoading,
    orderId,
    error,
    registrationProgress,
    isPolling
  };
}
