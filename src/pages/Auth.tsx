
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SupabaseAuthUI } from "@/components/auth/SupabaseAuthUI";
import { AuthForm } from "@/components/auth/AuthForm";
import { LucideLoader2 } from "lucide-react";
import { useAuthHandlers } from "@/hooks/useAuthHandlers";
import { RegistrationPayment } from "@/components/auth/RegistrationPayment";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { RegistrationProgressReport } from "@/components/auth/RegistrationProgressReport";

const Auth = () => {
  const { user, userRole, isLoading, isLoadingRole } = useAuth();
  const { handleSignUp, error, loading, setError } = useAuthHandlers();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [registrationStep, setRegistrationStep] = useState(1);
  const [registeredUser, setRegisteredUser] = useState<any>(null);
  const [isRegistrationFlow, setIsRegistrationFlow] = useState(false);
  
  const isRegistration = location.pathname.includes('/register');

  // Check registration state from localStorage on initial load (only for registration routes)
  useEffect(() => {
    const checkLocalStorageState = () => {
      if (!isRegistration) return;
      
      const paymentPending = localStorage.getItem('registration_payment_pending') === 'true';
      const paymentComplete = localStorage.getItem('registration_payment_complete') === 'true';
      
      console.log("Auth page loaded with registration state:", { paymentPending, paymentComplete });
      
      if (paymentPending) {
        setIsRegistrationFlow(true);
        setRegistrationStep(2);
      } else if (paymentComplete) {
        setIsRegistrationFlow(true);
        setRegistrationStep(3);
      }
    };
    
    checkLocalStorageState();
  }, [isRegistration, location.pathname]);

  // Modified redirect logic - be much more conservative about redirecting patients
  useEffect(() => {
    // Don't redirect while still loading
    if (isLoading || isLoadingRole) {
      console.log("Auth page: Still loading auth state, waiting...");
      return;
    }
    
    if (!user) {
      console.log("Auth page: No user found, staying on auth page");
      return;
    }
    
    console.log("Auth page detected logged in user. Role:", userRole, "isRegistrationFlow:", isRegistrationFlow, "isRegistration:", isRegistration);
    
    // For non-patient roles, redirect to dashboard (they don't need registration)
    if (userRole && userRole !== 'patient') {
      console.log("Redirecting non-patient to dashboard:", userRole);
      navigate("/dashboard", { replace: true });
      return;
    }
    
    // For patients: ONLY redirect if we're NOT on registration route AND NOT in active registration flow
    if (userRole === 'patient' && !isRegistration && !isRegistrationFlow) {
      console.log("Patient on non-registration route and not in registration flow, redirecting to dashboard");
      navigate("/dashboard", { replace: true });
      return;
    }
    
    // If we're a patient on registration route or in registration flow, stay here
    if (userRole === 'patient' && (isRegistration || isRegistrationFlow)) {
      console.log("Patient in registration process, staying on auth page");
      return;
    }
  }, [user, userRole, isLoading, isLoadingRole, navigate, isRegistrationFlow, isRegistration]);

  // Show loading state while auth is loading
  if (isLoading || isLoadingRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col items-center justify-center pt-16 md:pt-20">
        <LucideLoader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="mt-4 text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  // Handle signup form submission - Enhanced to better handle phone numbers
  const handleFormSubmit = async (
    email: string, 
    password: string, 
    userType?: string, 
    firstName?: string, 
    lastName?: string,
    patientData?: any
  ) => {
    try {
      console.log("Form submitted with user type:", userType);
      console.log("Patient data received:", patientData);
      
      setError(null);
      
      // Flag this as a registration flow before user creation
      const isPatientRegistration = userType === 'patient';
      
      // Set localStorage flags for patient registration
      if (isPatientRegistration) {
        localStorage.setItem('registration_payment_pending', 'true');
        localStorage.setItem('registration_payment_complete', 'false');
        setIsRegistrationFlow(true);
      }
      
      const enhancedPatientData = patientData ? {
        ...patientData,
        emergencyContact: patientData.emergencyContact || patientData.phone
      } : undefined;
      
      console.log("Enhanced patient data:", enhancedPatientData);
      
      // Attempt registration
      const user = await handleSignUp(email, password, userType as any, firstName, lastName, enhancedPatientData);
      
      // If this is a patient registration and we were successful, move to payment step
      if (user && isPatientRegistration) {
        console.log("Patient registered successfully, moving to payment step");
        setRegisteredUser(user);
        setRegistrationStep(2);
        toast({
          title: "Account created",
          description: "Please complete your registration by making the payment",
        });
      } else if (user) {
        // Non-patient users can go directly to dashboard
        toast({
          title: "Account created",
          description: "Your account has been created successfully",
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      
      // Clean up localStorage if registration fails
      if (userType === 'patient') {
        localStorage.removeItem('registration_payment_pending');
        localStorage.removeItem('registration_payment_complete');
        setIsRegistrationFlow(false);
      }
      
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive"
      });
    }
  };
  
  // When payment is complete, move to final step
  const handlePaymentComplete = () => {
    console.log("Payment completed, moving to final step");
    setRegistrationStep(3);
    localStorage.setItem('registration_payment_pending', 'false');
    localStorage.setItem('registration_payment_complete', 'true');
    toast({
      title: "Registration payment complete",
      description: "Your payment has been processed. Your care team is being assigned.",
    });
  };

  // For non-registration routes
  if (!isRegistration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 pt-16 md:pt-20">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-saas-dark">
            Welcome back
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-lg shadow-saas-light-purple/20 sm:rounded-lg sm:px-10">
            <SupabaseAuthUI 
              view="sign_in"
              redirectTo={`${window.location.origin}/dashboard`}
              showLinks={true}
            />
          </div>
        </div>
      </div>
    );
  }

  // For registration process with multiple steps
  return (
    <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8 pt-16 md:pt-20 overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-3 text-center text-2xl sm:text-3xl font-bold text-saas-dark">
          {registrationStep === 1 ? 'Create your account' : 
           registrationStep === 2 ? 'Complete registration' : 
           'Registration status'}
        </h2>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {registrationStep === 1 && (
          <div className="bg-white py-6 sm:py-8 px-4 shadow-lg shadow-saas-light-purple/20 sm:rounded-lg sm:px-10 relative">
            <ScrollArea 
              className="w-full" 
              invisibleScrollbar={true}
              maxHeight="65vh"
            >
              <div className="mobile-form-container pr-1">
                <AuthForm 
                  type="register"
                  onSubmit={handleFormSubmit}
                  error={error}
                  loading={loading}
                />
              </div>
            </ScrollArea>
          </div>
        )}
        
        {registrationStep === 2 && (user || registeredUser) && (
          <RegistrationPayment 
            onComplete={handlePaymentComplete}
            registrationFee={500}
          />
        )}
        
        {registrationStep === 3 && (
          <RegistrationProgressReport 
            onCheckAgain={() => console.log('Check again clicked')} 
          />
        )}
      </div>
    </div>
  );
};

export default Auth;
