
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useRegistrationProcess } from '@/hooks/useRegistrationProcess';
import { useToast } from '@/hooks/use-toast';
import { RegistrationProgressReport } from './RegistrationProgressReport';

interface RegistrationPaymentProps {
  onComplete: () => void;
  registrationFee?: number;
}

export const RegistrationPayment: React.FC<RegistrationPaymentProps> = ({
  onComplete,
  registrationFee = 500
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [showRegistrationProgress, setShowRegistrationProgress] = useState(false);
  
  const {
    createOrder,
    completeRegistration,
    fetchRegistrationProgress,
    isLoading,
    orderId,
    error
  } = useRegistrationProcess({
    registrationFee,
    redirectUrl: '/dashboard'
  });
  
  useEffect(() => {
    const checkExistingRegistrationStatus = async () => {
      if (user) {
        const status = await fetchRegistrationProgress();
        
        // If payment is already complete, show the registration progress
        if (status && status.registration_status !== 'payment_pending') {
          setShowRegistrationProgress(true);
        }
      }
    };
    
    checkExistingRegistrationStatus();
  }, [user]);
  
  const initiatePayment = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to complete registration",
        variant: "destructive"
      });
      return;
    }
    
    setIsCreatingOrder(true);
    try {
      const orderData = await createOrder();
      
      if (!orderData || !orderData.order_id) {
        throw new Error("Failed to create order");
      }
      
      // Initialize Razorpay
      const options = {
        key: 'rzp_test_PmVJKhNvUghZde',
        amount: registrationFee * 100, // amount in paise
        currency: 'INR',
        name: 'Health App',
        description: 'Registration Fee',
        order_id: orderData.order_id,
        handler: async function(response: any) {
          const success = await completeRegistration(
            response.razorpay_payment_id,
            response.razorpay_order_id,
            response.razorpay_signature
          );
          
          if (success) {
            onComplete();
            setShowRegistrationProgress(true);
          }
        },
        prefill: {
          email: user.email,
          contact: '',
        },
        theme: {
          color: '#9b87f5',
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message || "Failed to initiate payment",
        variant: "destructive"
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };
  
  // For testing - manually complete payment without Razorpay
  const handleManualPayment = async () => {
    if (!user) return;
    
    try {
      // Generate a test order ID if needed
      let testOrderId = orderId;
      if (!testOrderId) {
        const orderData = await createOrder();
        testOrderId = orderData?.order_id;
      }
      
      if (testOrderId) {
        const success = await completeRegistration(
          'test_payment_' + Date.now(),
          testOrderId,
          'manual_signature'
        );
        
        if (success) {
          onComplete();
          setShowRegistrationProgress(true);
        }
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to process manual payment",
        variant: "destructive"
      });
    }
  };
  
  // Check if the Razorpay script is loaded
  useEffect(() => {
    if (!(window as any).Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
      
      return () => {
        document.body.removeChild(script);
      };
    }
  }, []);
  
  if (showRegistrationProgress) {
    return <RegistrationProgressReport />;
  }
  
  return (
    <Card className="bg-white shadow-lg border border-gray-100">
      <CardHeader>
        <CardTitle>Complete Your Registration</CardTitle>
        <CardDescription>A one-time registration fee is required</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-md">
          <span className="text-sm font-medium">Registration Fee</span>
          <span className="font-bold">₹{registrationFee}</span>
        </div>
        
        <div className="text-sm text-gray-500">
          <p>This fee includes:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Access to the health app platform</li>
            <li>Digital document management</li>
            <li>Secure messaging with care team</li>
            <li>Personalized health dashboard</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button 
          className="w-full" 
          onClick={initiatePayment}
          disabled={isLoading || isCreatingOrder}
        >
          {isLoading || isCreatingOrder ? (
            <span className="inline-flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : "Pay Registration Fee"}
        </Button>
        
        {process.env.NODE_ENV === 'development' && (
          <Button 
            variant="outline" 
            className="w-full mt-2" 
            onClick={handleManualPayment}
            disabled={isLoading}
          >
            Complete Registration (Testing)
          </Button>
        )}
        
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </CardFooter>
    </Card>
  );
};
