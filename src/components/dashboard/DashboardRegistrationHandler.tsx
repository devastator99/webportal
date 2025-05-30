
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { UserRegistrationStatus, RegistrationStatusValues } from '@/types/registration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, CreditCard, Users, MessageCircle, Bell } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Use the existing registration process hook
  const {
    createOrder,
    completeRegistration,
    fetchRegistrationProgress,
    orderId
  } = useRegistrationProcess({
    registrationFee: 500,
    redirectUrl: '/dashboard'
  });

  // Enhanced status polling function
  const pollRegistrationStatus = async () => {
    if (!user?.id) return;

    try {
      console.log("Polling registration status for user:", user.id);
      
      const { data, error } = await supabase.rpc('get_user_registration_status_safe', {
        p_user_id: user.id
      });

      if (error) {
        console.error("Error polling registration status:", error);
        return;
      }

      const regStatus = data as unknown as UserRegistrationStatus;
      console.log("Polled registration status:", regStatus.registration_status);
      console.log("Completed tasks:", regStatus.tasks?.filter(task => task.status === 'completed').length || 0);
      
      setRegistrationStatus(regStatus);

      // Check if registration is now complete
      if (regStatus.registration_status === RegistrationStatusValues.FULLY_REGISTERED) {
        console.log("Registration is now complete, stopping polling");
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        
        toast.success('Registration completed successfully! Welcome to your dashboard.');
        
        // Small delay before showing dashboard
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      }
    } catch (err) {
      console.error("Exception polling registration status:", err);
    }
  };

  // Start polling when payment is completed
  const startPolling = () => {
    if (pollingInterval) return; // Already polling
    
    console.log("Starting registration status polling");
    const interval = setInterval(pollRegistrationStatus, 3000); // Poll every 3 seconds
    setPollingInterval(interval);
    
    // Stop polling after 2 minutes as a safety measure
    setTimeout(() => {
      if (interval) {
        clearInterval(interval);
        setPollingInterval(null);
        console.log("Stopped polling after timeout");
      }
    }, 120000); // 2 minutes
  };

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
        console.log("Initial registration status:", regStatus.registration_status);
        setRegistrationStatus(regStatus);
        setIsLoading(false);
      } catch (err) {
        console.error("Exception checking registration status:", err);
        setIsLoading(false);
      }
    };

    checkRegistrationStatus();
  }, [user?.id]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // For patients, handle payment completion using existing Razorpay integration
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
              toast.success('Payment completed successfully! Setting up your account...');
              
              // Start polling for completion immediately after payment
              startPolling();
              
              // Also refresh status once immediately
              setTimeout(pollRegistrationStatus, 1000);
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
          toast.success('Test payment completed successfully! Setting up your account...');
          
          // Start polling for completion immediately after payment
          startPolling();
          
          // Also refresh status once immediately
          setTimeout(pollRegistrationStatus, 1000);
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

  // For other roles, complete basic registration
  const handleCompleteRegistration = async () => {
    if (!user?.id) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase.functions.invoke('complete-registration', {
        body: { 
          user_id: user.id,
          step: 'fully_registered'
        }
      });

      if (error) {
        toast.error('Registration completion failed');
        return;
      }

      toast.success('Registration completed successfully!');
      
      // Refresh registration status
      const { data } = await supabase.rpc('get_user_registration_status_safe', {
        p_user_id: user.id
      });
      
      if (data) {
        setRegistrationStatus(data as unknown as UserRegistrationStatus);
      }
    } catch (err) {
      console.error("Registration completion error:", err);
      toast.error('Registration completion failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const getProgressPercentage = () => {
    if (!registrationStatus) return 0;
    
    switch (registrationStatus.registration_status) {
      case RegistrationStatusValues.PAYMENT_PENDING:
        return 25;
      case RegistrationStatusValues.PAYMENT_COMPLETE:
        return 50;
      case RegistrationStatusValues.CARE_TEAM_ASSIGNED:
        return 75;
      case RegistrationStatusValues.FULLY_REGISTERED:
        return 100;
      default:
        return 0;
    }
  };

  const getCompletedTasks = () => {
    if (!registrationStatus?.tasks) return [];
    return registrationStatus.tasks.filter(task => task.status === 'completed');
  };

  // Show special completion message if we're polling
  if (pollingInterval && registrationStatus?.registration_status === RegistrationStatusValues.PAYMENT_COMPLETE) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Setting Up Your Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9b87f5] mx-auto mb-4"></div>
              <p className="text-lg font-medium">Payment completed successfully!</p>
              <p className="text-gray-600">We're setting up your care team and completing your registration...</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Account Setup Progress</span>
                <span>75%</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-green-500">
                <CheckCircle className="h-5 w-5" />
                <span>Payment Processed</span>
              </div>
              
              <div className="flex items-center gap-3 text-yellow-500">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-yellow-500"></div>
                <span>Assigning Care Team</span>
              </div>
              
              <div className="flex items-center gap-3 text-gray-400">
                <Clock className="h-5 w-5" />
                <span>Creating Chat Room</span>
              </div>
              
              <div className="flex items-center gap-3 text-gray-400">
                <Bell className="h-5 w-5" />
                <span>Sending Welcome Notification</span>
              </div>
            </div>

            <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
              <p className="font-medium mb-2">Almost done!</p>
              <p className="text-sm">
                This usually takes 10-30 seconds. You'll be automatically redirected to your dashboard once everything is ready.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <Card className="shadow-none border-none">
        <CardContent className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#9b87f5]"></div>
        </CardContent>
      </Card>
    );
  }

  // If registration is fully complete, render children
  if (registrationStatus?.registration_status === RegistrationStatusValues.FULLY_REGISTERED) {
    return <>{children}</>;
  }

  // Render registration completion UI
  return (
    <div className="container mx-auto px-4 py-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#9b87f5]" />
            Complete Your Registration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Registration Progress</span>
              <span>{getProgressPercentage()}%</span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Account Created & Role Assigned</span>
            </div>

            {userRole === 'patient' && (
              <>
                <div className={`flex items-center gap-3 ${
                  registrationStatus?.registration_status === RegistrationStatusValues.PAYMENT_PENDING ? 
                  'text-orange-500' : 'text-green-500'
                }`}>
                  <CreditCard className="h-5 w-5" />
                  <span>Payment Processing</span>
                  {registrationStatus?.registration_status === RegistrationStatusValues.PAYMENT_PENDING && (
                    <div className="ml-auto flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={handlePaymentCompletion}
                        disabled={isProcessing}
                      >
                        {isProcessing ? 'Processing...' : 'Pay ₹500'}
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
                    </div>
                  )}
                </div>

                <div className={`flex items-center gap-3 ${
                  getCompletedTasks().some(task => task.task_type === 'assign_care_team') ? 
                  'text-green-500' : 'text-gray-400'
                }`}>
                  <Users className="h-5 w-5" />
                  <span>Care Team Assignment</span>
                </div>

                <div className={`flex items-center gap-3 ${
                  getCompletedTasks().some(task => task.task_type === 'create_chat_room') ? 
                  'text-green-500' : 'text-gray-400'
                }`}>
                  <MessageCircle className="h-5 w-5" />
                  <span>Chat Room Setup</span>
                </div>

                <div className={`flex items-center gap-3 ${
                  getCompletedTasks().some(task => task.task_type === 'send_welcome_notification') ? 
                  'text-green-500' : 'text-gray-400'
                }`}>
                  <Bell className="h-5 w-5" />
                  <span>Welcome Notification</span>
                </div>
              </>
            )}

            {userRole !== 'patient' && (
              <div className="flex items-center gap-3">
                <Button 
                  onClick={handleCompleteRegistration}
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? 'Completing Registration...' : 'Complete Registration'}
                </Button>
              </div>
            )}
          </div>

          <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
            <p className="font-medium mb-2">What happens next?</p>
            {userRole === 'patient' ? (
              <ul className="space-y-1 text-sm">
                <li>• Payment will be processed securely via Razorpay</li>
                <li>• You'll be assigned a doctor and nutritionist</li>
                <li>• A secure chat room will be created for your care team</li>
                <li>• You'll receive welcome notifications with next steps</li>
              </ul>
            ) : (
              <p className="text-sm">
                Your account setup is almost complete. Click the button above to finish your registration.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
