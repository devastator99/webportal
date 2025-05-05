
import React, { useState } from "react";
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
import '@/styles/glass.css';

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
        const user = await handleSignUp(email, password, userType as any, firstName, lastName, patientData);
        
        // If this is a patient registration and we were successful, move to payment step
        if (user && userType === 'patient') {
          setRegisteredUser(user);
          setRegistrationStep(2);
          toast({
            title: "Account Created",
            description: "Please complete your registration with payment",
          });
        }
      }
      // For login, the SupabaseAuthUI handles the submission
    } catch (error: any) {
      console.error("Authentication error:", error);
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
    toast({
      title: "Registration Complete",
      description: "Your account is now fully set up",
    });
  };

  // Handle modal close
  const handleClose = () => {
    // Reset states when closing the modal
    setRegistrationStep(1);
    setRegisteredUser(null);
    setError(null);
    onClose();
  };

  // Switch between login and register views
  const toggleView = () => {
    setView(view === "login" ? "register" : "login");
    setError(null); // Clear any previous errors when switching views
    setRegistrationStep(1); // Reset to step 1 when switching views
  };

  // Function to navigate to dashboard
  const goToDashboard = () => {
    handleClose();
    navigate('/dashboard');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="glass-dialog border-0 p-0 overflow-hidden max-w-md w-full max-h-[90vh]">
        <div className="relative h-full w-full">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-2 z-10 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <ScrollArea 
            className="h-full w-full" 
            invisibleScrollbar={true}
            maxHeight="85vh"
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
                  <SupabaseAuthUI
                    view="sign_in"
                    redirectTo={`${window.location.origin}/dashboard`}
                    showLinks={false}
                    className="mobile-form-container"
                  />
                </>
              ) : (
                <>
                  {registrationStep === 1 && (
                    <div className="mobile-form-container px-1">
                      <h1 className="text-2xl font-bold text-center mb-6">
                        Create Your Account
                      </h1>
                      <AuthForm
                        type="register"
                        onSubmit={handleFormSubmit}
                        error={error}
                        loading={loading}
                      />
                    </div>
                  )}
                  
                  {/* Step 2: Payment */}
                  {registrationStep === 2 && registeredUser && (
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
                  
                  {/* Step 3: Success */}
                  {registrationStep === 3 && (
                    <div className="text-center py-4">
                      <div className="mb-6 flex justify-center">
                        <div className="bg-green-100 rounded-full p-4">
                          <CheckCircle2 className="h-10 w-10 text-green-600" />
                        </div>
                      </div>
                      <h3 className="text-xl font-medium mb-2">Registration Complete!</h3>
                      <p className="mb-6 text-gray-600">
                        Your care team has been assigned. You can now access all features of AnubhootiHealth.
                      </p>
                      <Button onClick={goToDashboard} className="w-full">
                        Go to Dashboard
                      </Button>
                    </div>
                  )}
                </>
              )}
              
              {/* Show toggle link only during login/register steps */}
              {(view === "login" || (view === "register" && registrationStep === 1)) && (
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
              )}
            </motion.div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
