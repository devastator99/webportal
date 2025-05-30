import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useRegistrationProcess } from '@/hooks/useRegistrationProcess';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { Shield, Clock, Users, MessageSquare, FileText, CheckCircle, Loader2 } from 'lucide-react';

interface RegistrationPaymentProps {
  onComplete: () => void;
  registrationFee?: number;
  userInfo?: {
    firstName: string;
    lastName: string;
  };
}

export const RegistrationPayment: React.FC<RegistrationPaymentProps> = ({
  onComplete,
  registrationFee = 500,
  userInfo
}) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayKeyId, setRazorpayKeyId] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  
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
        
        // If payment is already complete, move to next step
        if (status && status.registration_status !== 'payment_pending') {
          onComplete();
        }
      }
    };
    
    checkExistingRegistrationStatus();
  }, [user]);
  
  const handleInitiatePayment = async () => {
    console.log("Pay Registration Fee button clicked - handler called");
    
    if (!user) {
      console.log("No user found");
      toast({
        title: "Error",
        description: "You must be logged in to complete registration",
        variant: "destructive"
      });
      return;
    }
    
    setIsCreatingOrder(true);
    try {
      console.log("Creating order...");
      const orderData = await createOrder();
      
      if (!orderData || !orderData.order_id) {
        throw new Error("Failed to create order");
      }
      
      console.log("Order created successfully:", orderData.order_id);
      
      // Store the Razorpay key and demo mode from the response
      setRazorpayKeyId(orderData.razorpay_key_id);
      setIsDemoMode(orderData.demo_mode || false);
      
      console.log("Payment mode:", orderData.demo_mode ? "Demo/Test" : "Production");
      console.log("Using Razorpay key:", orderData.razorpay_key_id?.substring(0, 12) + "...");
      
      // Check if Razorpay is loaded
      if (!(window as any).Razorpay) {
        console.error("Razorpay not loaded");
        throw new Error("Payment gateway not loaded. Please refresh the page and try again.");
      }
      
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
            console.log("Payment successful, completing registration...");
            setIsProcessing(true);
            const success = await completeRegistration(
              response.razorpay_payment_id,
              response.razorpay_order_id,
              response.razorpay_signature
            );
            
            if (success) {
              console.log("Registration completed successfully, moving to status screen");
              onComplete();
            }
          } catch (err: any) {
            console.error("Payment verification error:", err);
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
            console.log("Payment modal dismissed");
            setIsCreatingOrder(false);
          }
        }
      };

      console.log("Opening Razorpay with options:", options);
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      console.error("Payment initiation error:", err);
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
    console.log("Complete Registration (Testing) button clicked - handler called");
    
    if (!user) {
      console.log("No user found for manual payment");
      toast({
        title: "Error",
        description: "You must be logged in to complete registration",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsProcessing(true);
      console.log("Processing manual payment...");
      
      // Generate a test order ID if needed
      let testOrderId = orderId;
      if (!testOrderId) {
        console.log("Creating test order...");
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
          console.log("Manual payment completed successfully, moving to status screen");
          toast({
            title: "Registration Payment Complete!",
            description: "Test payment processed successfully. Moving to registration status...",
          });
          onComplete();
        }
      } else {
        throw new Error("Failed to create test order");
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
  
  // Add sign out handler
  const handleSignOut = async () => {
    if (isSigningOut) return;
    
    try {
      setIsSigningOut(true);
      
      toast({
        title: "Signing out",
        description: "You can complete your registration later. Your account is saved and payment can be completed anytime.",
      });
      
      // Keep registration state for resuming later
      // Don't clear localStorage flags here - they should persist
      
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSigningOut(false);
    }
  };
  
  // Check if the Razorpay script is loaded
  useEffect(() => {
    if (!(window as any).Razorpay) {
      console.log("Loading Razorpay script...");
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => console.log("Razorpay script loaded successfully");
      script.onerror = () => console.error("Failed to load Razorpay script");
      document.body.appendChild(script);
      
      return () => {
        document.body.removeChild(script);
      };
    } else {
      console.log("Razorpay already loaded");
    }
  }, []);
  
  return (
    <Card className="bg-white shadow-lg border border-gray-100">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          Welcome{userInfo ? `, ${userInfo.firstName}` : ''}!
        </CardTitle>
        <CardDescription className="text-lg">
          Complete your registration with a one-time setup fee
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Welcome Message */}
        <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-800 mb-2">🎉 You're Almost There!</h3>
          <p className="text-sm text-purple-700">
            Your account has been created successfully. Complete the payment to unlock your personalized health dashboard and connect with your care team.
          </p>
        </div>

        {/* What's Included */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800 text-center">What's Included in Your Registration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <Users className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800">Dedicated Care Team</h4>
                <p className="text-sm text-green-700">Personal doctor and nutritionist assignment</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800">Secure Messaging</h4>
                <p className="text-sm text-blue-700">Direct communication with your care team</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
              <FileText className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-800">Digital Health Records</h4>
                <p className="text-sm text-orange-700">Secure document storage and management</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
              <Shield className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-800">Platform Access</h4>
                <p className="text-sm text-purple-700">Full access to health dashboard and tools</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-medium">Registration Fee</span>
            <span className="text-2xl font-bold text-purple-600">₹{registrationFee}</span>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>One-time payment only</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span>Secure payment processing</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              <span>Instant account activation</span>
            </div>
          </div>
        </div>

        {/* What Happens Next */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            What Happens After Payment?
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium">1</span>
              <span>Instant account activation and dashboard access</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium">2</span>
              <span>Care team assignment (within 2-4 hours)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium">3</span>
              <span>Welcome message from your care team (same day)</span>
            </div>
          </div>
        </div>
        
        {isDemoMode && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Demo Mode:</strong> This is a test payment for development purposes.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-3 pt-6">
        <Button 
          className="w-full h-12 text-lg font-semibold bg-purple-600 hover:bg-purple-700" 
          onClick={handleInitiatePayment}
          disabled={isLoading || isCreatingOrder || isProcessing}
        >
          {isLoading || isCreatingOrder ? (
            <span className="inline-flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            `Complete Registration - Pay ₹${registrationFee}`
          )}
        </Button>
        
        {/* Sign Out Option */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>Instant Activation</span>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="text-gray-600 hover:text-gray-800"
          >
            {isSigningOut ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                Signing Out...
              </>
            ) : (
              'Sign Out'
            )}
          </Button>
        </div>
        
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
