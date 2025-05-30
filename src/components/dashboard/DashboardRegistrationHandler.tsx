
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { UserRegistrationStatus, RegistrationStatusValues } from '@/types/registration';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CreditCard, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { UserRole } from '@/contexts/AuthContext';
import { useRegistrationProcess } from '@/hooks/useRegistrationProcess';

interface DashboardRegistrationHandlerProps {
  children: React.ReactNode;
  userRole: UserRole;
}

export const DashboardRegistrationHandler: React.FC<DashboardRegistrationHandlerProps> = ({ 
  children, 
  userRole 
}) => {
  const { user } = useAuth();
  const [registrationStatus, setRegistrationStatus] = useState<UserRegistrationStatus | null>(null);
  const [showPaymentBanner, setShowPaymentBanner] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Use the existing registration process hook
  const {
    createOrder,
    completeRegistration,
    orderId
  } = useRegistrationProcess({
    registrationFee: 500,
    redirectUrl: '/dashboard'
  });

  // Check registration status on component mount
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('get_user_registration_status_safe', {
          p_user_id: user.id
        });

        if (error) {
          console.error("Error checking registration status:", error);
          setIsLoading(false);
          return;
        }

        const regStatus = data as unknown as UserRegistrationStatus;
        console.log("Registration status:", regStatus.registration_status);
        setRegistrationStatus(regStatus);
        
        // Show payment banner only for patients with pending payment
        if (userRole === 'patient' && regStatus.registration_status === RegistrationStatusValues.PAYMENT_PENDING) {
          setShowPaymentBanner(true);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error("Exception checking registration status:", err);
        setIsLoading(false);
      }
    };

    checkRegistrationStatus();
  }, [user?.id, userRole]);

  // Handle payment completion using existing Razorpay integration
  const handlePaymentCompletion = async () => {
    if (!user?.id) return;

    setIsProcessing(true);
    try {
      console.log("Creating Razorpay order...");
      const orderData = await createOrder();
      
      if (!orderData || !orderData.order_id) {
        throw new Error("Failed to create order");
      }

      console.log("Order created:", orderData.order_id);

      // Check if Razorpay is loaded
      if (!(window as any).Razorpay) {
        console.log("Loading Razorpay script...");
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      // Initialize Razorpay
      const options = {
        key: orderData.razorpay_key_id,
        amount: orderData.amount * 100,
        currency: 'INR',
        name: 'Health App',
        description: 'Registration Fee',
        order_id: orderData.order_id,
        handler: async function(response: any) {
          try {
            console.log("Payment successful, completing registration...");
            const success = await completeRegistration(
              response.razorpay_payment_id,
              response.razorpay_order_id,
              response.razorpay_signature
            );
            
            if (success) {
              toast.success('Payment completed successfully! Your account is being set up...');
              setShowPaymentBanner(false);
              
              // Refresh the page to update registration status
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            }
          } catch (err: any) {
            console.error("Payment verification error:", err);
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          email: user.email,
          name: orderData.prefill?.name || '',
        },
        theme: {
          color: '#9b87f5',
        },
        modal: {
          ondismiss: function() {
            console.log("Payment modal dismissed");
          }
        }
      };

      console.log("Opening Razorpay with options:", options);
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      console.error("Payment initiation error:", err);
      toast.error('Payment initiation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // For testing - manual payment completion
  const handleManualPayment = async () => {
    if (!user?.id) return;

    setIsProcessing(true);
    try {
      console.log("Processing manual payment...");
      
      // Create a test order first
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
          toast.success('Test payment completed successfully! Your account is being set up...');
          setShowPaymentBanner(false);
          
          // Refresh the page to update registration status
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } else {
        throw new Error("Failed to create test order");
      }
    } catch (err: any) {
      console.error("Error in manual payment:", err);
      toast.error('Manual payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Show loading state only briefly during initial check
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#9b87f5]"></div>
      </div>
    );
  }

  // Always render the dashboard content with optional payment banner
  return (
    <>
      {/* Payment completion banner for patients */}
      {showPaymentBanner && userRole === 'patient' && (
        <Alert className="mx-4 mt-4 bg-yellow-50 border-yellow-200">
          <CreditCard className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex-1">
              <span className="font-medium">Complete your registration:</span> Pay ₹500 to access all features and get assigned to your care team.
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Button 
                size="sm" 
                onClick={handlePaymentCompletion}
                disabled={isProcessing}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Pay Now'
                )}
              </Button>
              {process.env.NODE_ENV === 'development' && (
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={handleManualPayment}
                  disabled={isProcessing}
                >
                  Test Complete
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowPaymentBanner(false)}
                className="text-yellow-600 hover:text-yellow-700"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Always render the actual dashboard content */}
      {children}
    </>
  );
};
