
import React, { useState, useEffect } from 'react';
import { useRegistrationProcess } from '@/hooks/useRegistrationProcess';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CreditCard, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Include Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RegistrationPaymentProps {
  onComplete?: () => void;
  registrationFee?: number;
}

export const RegistrationPayment: React.FC<RegistrationPaymentProps> = ({
  onComplete,
  registrationFee = 500
}) => {
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  
  const {
    createOrder,
    completeRegistration,
    isLoading,
    error
  } = useRegistrationProcess({ registrationFee });

  // Load Razorpay script
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    
    script.onload = () => {
      setRazorpayLoaded(true);
    };
    
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handlePayment = async () => {
    console.log("Initiating payment process");
    const orderData = await createOrder();
    
    if (!orderData) {
      console.error("Failed to create order");
      return;
    }
    
    console.log("Order created:", orderData);
    
    // For demo mode
    if (orderData.demo_mode) {
      // Simulate successful payment in demo mode
      console.log("Using demo mode for payment");
      const demoPaymentId = `pay_demo_${Date.now()}`;
      const success = await completeRegistration(demoPaymentId, orderData.order_id);
      
      if (success) {
        setPaymentComplete(true);
        if (onComplete) onComplete();
      }
      
      return;
    }
    
    // For production with real Razorpay
    if (!razorpayLoaded || !window.Razorpay) {
      console.error('Razorpay not loaded');
      return;
    }
    
    const options = {
      key: 'rzp_test_placeholder', // This will be replaced by environment variable in production
      amount: orderData.amount * 100,
      currency: orderData.currency,
      name: 'AnubhootiHealth',
      description: 'Registration Fee',
      order_id: orderData.order_id,
      prefill: orderData.prefill,
      handler: async function(response: any) {
        console.log("Payment successful, verifying with backend", response);
        const success = await completeRegistration(
          response.razorpay_payment_id,
          response.razorpay_order_id,
          response.razorpay_signature
        );
        
        if (success) {
          setPaymentComplete(true);
          if (onComplete) onComplete();
        }
      },
      theme: {
        color: '#7e69ab'
      }
    };
    
    const rzp = new window.Razorpay(options);
    rzp.open();
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Registration</CardTitle>
        <CardDescription>
          Pay the one-time registration fee to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {paymentComplete ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="bg-green-100 p-3 rounded-full mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Registration Complete!</h3>
            <p className="text-center text-muted-foreground">
              You've been assigned to a care team. You'll be redirected to your dashboard shortly.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="font-semibold">Registration Fee</div>
              <div className="text-lg">₹{registrationFee}</div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              This is a one-time payment that covers your initial registration and care team assignment.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {!paymentComplete && (
          <Button
            onClick={handlePayment}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay Now
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default RegistrationPayment;
