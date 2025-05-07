
import React, { useState, useEffect } from 'react';
import { useRegistrationProcess } from '@/hooks/useRegistrationProcess';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CreditCard, CheckCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

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
  const [isProcessing, setIsProcessing] = useState(false);
  
  const {
    createOrder,
    completeRegistration,
    fetchRegistrationProgress,
    triggerTaskProcessing,
    isLoading,
    error,
    registrationProgress
  } = useRegistrationProcess({ registrationFee });

  // Set registration in progress flag when component mounts and fetch status
  useEffect(() => {
    localStorage.setItem('registration_payment_pending', 'true');
    localStorage.setItem('registration_payment_complete', 'false');
    
    // Fetch initial registration progress
    fetchRegistrationProgress();
    
    return () => {
      // Only clear the pending flag if we're not completing successfully
      if (!paymentComplete) {
        localStorage.removeItem('registration_payment_pending');
      }
    };
  }, [paymentComplete]);

  // Monitor registration progress and mark as complete when fully registered
  useEffect(() => {
    if (registrationProgress?.status === 'fully_registered') {
      setPaymentComplete(true);
      if (onComplete) onComplete();
    }
  }, [registrationProgress, onComplete]);

  // Load Razorpay script
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    
    script.onload = () => {
      console.log("Razorpay script loaded");
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
    if (isProcessing) return;
    
    setIsProcessing(true);
    console.log("Initiating payment process");
    
    try {
      const orderData = await createOrder();
      
      if (!orderData) {
        console.error("Failed to create order");
        setIsProcessing(false);
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
        }
        
        setIsProcessing(false);
        return;
      }
      
      // For production with real Razorpay
      if (!razorpayLoaded || !window.Razorpay) {
        console.error('Razorpay not loaded');
        setIsProcessing(false);
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
          }
          setIsProcessing(false);
        },
        theme: {
          color: '#7e69ab'
        }
      };
      
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment process failed:", err);
      setIsProcessing(false);
    }
  };
  
  // For demo mode - if order creation fails, allow a demo payment
  const handleDemoPayment = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    console.log("Initiating demo payment process");
    
    try {
      // Generate a mock order ID
      const mockOrderId = `order_demo_${Date.now()}`;
      const mockPaymentId = `pay_demo_${Date.now()}`;
      
      // Call complete registration directly with demo IDs
      const success = await completeRegistration(mockPaymentId, mockOrderId);
      
      if (success) {
        setPaymentComplete(true);
        if (onComplete) onComplete();
      }
    } catch (err) {
      console.error("Demo payment process failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Manually trigger task processing (for demo/testing)
  const handleTriggerProcessing = async () => {
    await triggerTaskProcessing();
  };
  
  // Calculate registration progress percentage
  const getProgressPercentage = () => {
    if (!registrationProgress) return 0;
    
    switch (registrationProgress.status) {
      case 'payment_pending': return 0;
      case 'payment_complete': return 33;
      case 'care_team_assigned': return 66;
      case 'fully_registered': return 100;
      default: return 0;
    }
  };
  
  // Get a user-friendly status message
  const getStatusMessage = () => {
    if (!registrationProgress) return 'Payment pending';
    
    switch (registrationProgress.status) {
      case 'payment_pending': return 'Payment pending';
      case 'payment_complete': return 'Payment received, care team being assigned';
      case 'care_team_assigned': return 'Care team assigned, setting up communication';
      case 'fully_registered': return 'Registration complete!';
      default: return 'Processing your registration';
    }
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
        
        {registrationProgress?.status === 'fully_registered' ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="bg-green-100 p-3 rounded-full mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Registration Complete!</h3>
            <p className="text-center text-muted-foreground">
              Your payment was successful. Your care team has been assigned and you can now access all features.
            </p>
          </div>
        ) : registrationProgress?.status && registrationProgress.status !== 'payment_pending' ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Registration Progress</span>
                <span className="text-sm text-muted-foreground">{getProgressPercentage()}%</span>
              </div>
              <Progress value={getProgressPercentage()} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">{getStatusMessage()}</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Task Status</h4>
              <div className="bg-slate-100 rounded-md p-3 space-y-2 text-sm">
                {registrationProgress?.tasks?.map(task => (
                  <div key={task.id} className="flex items-center justify-between">
                    <span>
                      {task.task_type.replace(/_/g, ' ')}:
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium
                      ${task.status === 'completed' ? 'bg-green-100 text-green-800' : 
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                      task.status === 'failed' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'}`}>
                      {task.status}
                    </span>
                  </div>
                ))}
                {(!registrationProgress?.tasks || registrationProgress.tasks.length === 0) && (
                  <p className="text-muted-foreground">No tasks in progress</p>
                )}
              </div>
            </div>
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
      <CardFooter className="flex flex-col space-y-2">
        {registrationProgress?.status === 'fully_registered' ? (
          <Button 
            onClick={onComplete}
            className="w-full"
          >
            Continue to Dashboard
          </Button>
        ) : registrationProgress?.status && registrationProgress.status !== 'payment_pending' ? (
          <Button
            onClick={handleTriggerProcessing}
            variant="outline"
            className="w-full"
            disabled={isLoading || isProcessing}
          >
            {isLoading || isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Check Registration Progress
              </>
            )}
          </Button>
        ) : (
          <>
            <Button
              onClick={handlePayment}
              disabled={isLoading || isProcessing}
              className="w-full"
            >
              {isLoading || isProcessing ? (
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
            
            {error && (
              <Button
                onClick={handleDemoPayment}
                disabled={isLoading || isProcessing}
                variant="outline"
                className="w-full mt-2"
              >
                {isLoading || isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Use Demo Payment
                  </>
                )}
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default RegistrationPayment;
