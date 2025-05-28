
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useRegistrationProcess } from '@/hooks/useRegistrationProcess';
import { useToast } from '@/hooks/use-toast';
import { RegistrationProgressReport } from './RegistrationProgressReport';
import { Spinner } from '@/components/ui/spinner';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayKeyId, setRazorpayKeyId] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
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
      
      // Store the Razorpay key and demo mode from the response
      setRazorpayKeyId(orderData.razorpay_key_id);
      setIsDemoMode(orderData.demo_mode || false);
      
      console.log("Payment mode:", orderData.demo_mode ? "Demo/Test" : "Production");
      console.log("Using Razorpay key:", orderData.razorpay_key_id?.substring(0, 12) + "...");
      
      // Initialize Razorpay with the key from the server
      const options = {
        key: orderData.razorpay_key_id,
        amount: registrationFee * 100, // amount in paise
        currency: 'INR',
        name: 'Health App',
        description: 'Registration Fee',
        order_id: orderData.order_id,
        handler: async function(response: any) {
          try {
            setIsProcessing(true);
            const success = await completeRegistration(
              response.razorpay_payment_id,
              response.razorpay_order_id,
              response.razorpay_signature
            );
            
            if (success) {
              setShowRegistrationProgress(true);
              onComplete();
            }
          } catch (err: any) {
            toast({
              title: "Payment Verification Error",
              description: err.message || "Failed to verify payment",
              variant: "destructive"
            });
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          email: user.email,
          contact: '',
          name: orderData.prefill?.name || '',
        },
        theme: {
          color: '#9b87f5',
        },
        modal: {
          ondismiss: function() {
            setIsCreatingOrder(false);
          }
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
      setIsProcessing(true);
      // Generate a test order ID if needed
      let testOrderId = orderId;
      if (!testOrderId) {
        const orderData = await createOrder();
        testOrderId = orderData?.order_id;
      }
      
      if (testOrderId) {
        console.log("Completing registration with test order ID:", testOrderId);
        const success = await completeRegistration(
          'test_payment_' + Date.now(),
          testOrderId,
          'manual_signature'
        );
        
        if (success) {
          toast({
            title: "Registration Payment",
            description: "Test payment processed successfully",
          });
          setShowRegistrationProgress(true);
          onComplete();
        }
      }
    } catch (err: any) {
      console.error("Error in manual payment:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to process manual payment",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
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
        
        {isDemoMode && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Demo Mode:</strong> This is a test payment for development purposes.
            </p>
          </div>
        )}
        
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
          disabled={isLoading || isCreatingOrder || isProcessing}
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
            disabled={isLoading || isProcessing}
          >
            {isProcessing ? (
              <span className="flex items-center">
                <span className="mr-2">Processing</span>
                <Spinner className="h-4 w-4" />
              </span>
            ) : "Complete Registration (Testing)"}
          </Button>
        )}
        
        {error && (
          <div className="text-sm text-red-500 mt-2 p-3 bg-red-50 border border-red-100 rounded">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};
