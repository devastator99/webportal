
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AuthForm } from "@/components/auth/AuthForm";
import { SupabaseAuthUI } from "@/components/auth/SupabaseAuthUI";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthHandlers } from "@/hooks/useAuthHandlers";
import { PatientData } from "@/hooks/useAuthHandlers";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RegistrationPayment } from "@/components/auth/RegistrationPayment";
import { CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RegistrationProgressReport } from "@/components/auth/RegistrationProgressReport";
import '@/styles/glass.css';
import { cleanupAuthState } from "@/utils/authUtils";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: "login" | "register";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialView = "login",
}) => {
  const [view, setView] = useState<"login" | "register">(initialView);
  const [registrationStep, setRegistrationStep] = useState<number>(1);
  const [registeredUser, setRegisteredUser] = useState<any>(null);
  const { handleSignUp, error, loading, setError } = useAuthHandlers();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Reset view to initialView whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setView(initialView);
      
      // Check if there's any pending registration process
      const paymentPending = localStorage.getItem('registration_payment_pending') === 'true';
      const paymentComplete = localStorage.getItem('registration_payment_complete') === 'true';
      
      if (paymentPending) {
        setRegistrationStep(2);
      } else if (paymentComplete) {
        setRegistrationStep(3);
      } else {
        setRegistrationStep(1);
      }
    }
  }, [isOpen, initialView]);

  // Form submission handler
  const handleFormSubmit = async (
    email: string,
    password: string,
    userType?: string,
    firstName?: string,
    lastName?: string,
    patientData?: PatientData
  ) => {
    try {
      if (view === "register") {
        // Set localStorage flag to prevent redirection race condition
        if (userType === 'patient') {
          localStorage.setItem('registration_payment_pending', 'true');
          localStorage.setItem('registration_payment_complete', 'false');
        }
        
        const user = await handleSignUp(email, password, userType as any, firstName, lastName, patientData);
        
        // If this is a patient registration and we were successful, move to payment step
        if (user && userType === 'patient') {
          setRegisteredUser(user);
          setRegistrationStep(2);
          toast({
            title: "Account Created",
            description: "Please complete your registration with payment",
          });
          return; // Important! Don't close the modal yet
        } else if (user) {
          // Non-patient users can go directly to dashboard
          toast({
            title: "Account Created",
            description: "Your account has been set up successfully",
          });
          handleClose();
          navigate("/dashboard");
        }
      }
      // For login, the SupabaseAuthUI handles the submission
    } catch (error: any) {
      console.error("Authentication error:", error);
      
      // Clean up localStorage if registration fails
      if (view === "register" && registrationStep === 1) {
        localStorage.removeItem('registration_payment_pending');
        localStorage.removeItem('registration_payment_complete');
      }
      
      toast({
        title: "Registration Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    }
  };

  // When payment is complete, move to final step
  const handlePaymentComplete = () => {
    setRegistrationStep(3);
    localStorage.setItem('registration_payment_pending', 'false');
    localStorage.setItem('registration_payment_complete', 'true');
    toast({
      title: "Registration Payment Complete",
      description: "Your payment has been processed. Your care team is being assigned.",
    });
  };

  // Handle modal close
  const handleClose = () => {
    // Don't close if we're in the middle of patient registration
    if (view === "register" && registrationStep > 1 && registrationStep < 3) {
      toast({
        title: "Registration in progress",
        description: "Please complete the registration process",
        variant: "destructive"
      });
      return;
    }
    
    // Reset states when closing the modal
    setRegistrationStep(1);
    setRegisteredUser(null);
    setError(null);
    setView("login"); // Always reset to login view when closing
    
    // Clean up localStorage if modal is closed during registration
    if (view === "register" && registrationStep < 3) {
      localStorage.removeItem('registration_payment_pending');
      localStorage.removeItem('registration_payment_complete');
    }
    
    onClose();
  };

  // Switch between login and register views
  const toggleView = () => {
    setView(view === "login" ? "register" : "login");
    setError(null); // Clear any previous errors when switching views
    setRegistrationStep(1); // Reset to step 1 when switching views
    
    // Clean up localStorage when switching views
    localStorage.removeItem('registration_payment_pending');
    localStorage.removeItem('registration_payment_complete');
  };

  // Function to navigate to dashboard
  const goToDashboard = () => {
    handleClose();
    navigate('/dashboard');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="glass-dialog border-0 p-0 overflow-hidden max-w-md w-full sm:max-h-[90vh] max-h-[85vh]">
        <div className="relative h-full w-full flex flex-col">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-2 z-10 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <ScrollArea 
            className="flex-1 w-full overflow-y-auto"
            viewportRef={undefined} 
            invisibleScrollbar={false} 
            orientation="vertical"
          >
            <motion.div
              className="p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              key={`${view}-${registrationStep}`} // Key changes trigger re-animation
            >
              {/* Step 1: Login or Registration Form */}
              {view === "login" ? (
                <>
                  <h1 className="text-2xl font-bold text-center mb-6">
                    Welcome Back
                  </h1>
                  <div className="auth-form-container">
                    <SupabaseAuthUI
                      view="sign_in"
                      redirectTo={`${window.location.origin}/dashboard`}
                      showLinks={false}
                      className="mobile-form-container"
                    />
                  </div>
                </>
              ) : (
                <>
                  {registrationStep === 1 && (
                    <>
                      <h1 className="text-2xl font-bold text-center mb-6">
                        Create Your Account
                      </h1>
                      <div className="auth-form-container">
                        <AuthForm
                          type="register"
                          onSubmit={handleFormSubmit}
                          error={error}
                          loading={loading}
                        />
                      </div>
                    </>
                  )}
                  
                  {/* Step 2: Payment */}
                  {registrationStep === 2 && (
                    <>
                      <h1 className="text-2xl font-bold text-center mb-6">
                        Complete Registration
                      </h1>
                      <RegistrationPayment 
                        onComplete={handlePaymentComplete}
                        registrationFee={500}
                      />
                    </>
                  )}
                  
                  {/* Step 3: Registration Progress */}
                  {registrationStep === 3 && (
                    <div className="pt-4">
                      <h1 className="text-2xl font-bold text-center mb-6">
                        Registration Status
                      </h1>
                      <RegistrationProgressReport 
                        onCheckAgain={() => {
                          // Refresh status
                          toast({
                            title: "Refreshing",
                            description: "Checking your registration status...",
                          });
                        }} 
                      />
                    </div>
                  )}
                </>
              )}
              
              {/* Always show toggle link for better UX */}
              <div className="mt-6 text-center pb-4">
                <button
                  onClick={toggleView}
                  className="text-sm font-medium text-purple-600 hover:text-purple-500"
                >
                  {view === "login"
                    ? "Don't have an account? Register now"
                    : "Already have an account? Sign in"}
                </button>
              </div>
            </motion.div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
