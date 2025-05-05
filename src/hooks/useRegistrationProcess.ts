
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

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
  
  const defaultOptions = {
    registrationFee: options.registrationFee || 500,
    currency: options.currency || 'INR',
    redirectUrl: options.redirectUrl || '/dashboard'
  };

  // Create a Razorpay order
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
      const { data, error } = await supabase.functions.invoke('create-registration-order', {
        body: {
          user_id: user.id,
          amount: defaultOptions.registrationFee,
          currency: defaultOptions.currency
        }
      });
      
      if (error) throw new Error(error.message);
      
      if (!data?.order_id) {
        throw new Error('No order ID returned from server');
      }
      
      setOrderId(data.order_id);
      return data;
      
    } catch (err: any) {
      console.error('Error creating registration order:', err);
      setError(err.message);
      toast({
        title: 'Order Creation Failed',
        description: err.message,
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Complete registration after payment
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
    
    try {
      const { data, error } = await supabase.functions.invoke('complete-registration', {
        body: {
          user_id: user.id,
          razorpay_payment_id: paymentId,
          razorpay_order_id: orderId,
          razorpay_signature: signature || 'demo-signature'
        }
      });
      
      if (error) throw new Error(error.message);
      
      toast({
        title: 'Registration Complete',
        description: 'Your care team has been assigned. Redirecting to dashboard...',
      });
      
      // Redirect to dashboard after registration completes
      setTimeout(() => {
        navigate(defaultOptions.redirectUrl);
      }, 2000);
      
      return true;
      
    } catch (err: any) {
      console.error('Error completing registration:', err);
      setError(err.message);
      toast({
        title: 'Registration Failed',
        description: err.message,
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    createOrder,
    completeRegistration,
    isLoading,
    orderId,
    error
  };
}
