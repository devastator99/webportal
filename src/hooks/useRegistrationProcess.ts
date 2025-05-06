
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
      console.log("Calling create-registration-order edge function for user:", user.id);
      const { data, error } = await supabase.functions.invoke('create-registration-order', {
        body: {
          user_id: user.id,
          amount: defaultOptions.registrationFee,
          currency: defaultOptions.currency
        }
      });
      
      console.log("Edge function response:", data, error);
      
      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Failed to create order");
      }
      
      if (!data?.order_id) {
        console.error("No order ID returned:", data);
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
      console.log("Calling complete-registration edge function with:", {
        user_id: user.id,
        payment_id: paymentId,
        order_id: orderId,
        signature: signature || 'manual'
      });
      
      // Store registration state in localStorage to prevent redirect issues
      localStorage.setItem('registration_payment_pending', 'false');
      localStorage.setItem('registration_payment_complete', 'true');
      
      const { data, error } = await supabase.functions.invoke('complete-registration', {
        body: {
          user_id: user.id,
          razorpay_payment_id: paymentId,
          razorpay_order_id: orderId,
          razorpay_signature: signature || 'manual'
        }
      });
      
      console.log("Complete registration response:", data, error);
      
      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Failed to complete registration");
      }
      
      toast({
        title: 'Registration Complete',
        description: 'Your payment was successful. Your care team is being assigned and you will be notified shortly.',
      });
      
      // Don't redirect automatically - let the parent component handle the next step
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
