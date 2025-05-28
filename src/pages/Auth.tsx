
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
import { supabase } from "@/integrations/supabase/client";
import { UserRegistrationStatus } from "@/types/registration";
import { RegistrationProgressReport } from "@/components/auth/RegistrationProgressReport";

const Auth = () => {
  const { user, userRole, isLoading } = useAuth();
  const { handleSignUp, error, loading, setError } = useAuthHandlers();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [registrationStep, setRegistrationStep] = useState(1);
  const [registeredUser, setRegisteredUser] = useState<any>(null);
  const [isRegistrationFlow, setIsRegistrationFlow] = useState(false);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(false);
  
  const isRegistration = location.pathname.includes('/register');

  // Check registration state from localStorage on initial load
  useEffect(() => {
    const checkLocalStorageState = () => {
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
  }, []);

  // Function to check user's registration status from the database using the secure function
  const checkRegistrationStatus = async (userId: string) => {
    setIsCheckingRegistration(true);
    try {
      console.log("Checking registration status for user:", userId);
      
      // Use the new secure function that bypasses RLS issues
      const { data, error } = await supabase.rpc('get_user_registration_status_safe', {
        p_user_id: userId
      });
      
      if (error) {
        console.error("Error getting registration status:", error);
        return null;
      }
      
      console.log("Registration status from database:", data);
      return data as unknown as UserRegistrationStatus;
    } catch (err) {
      console.error("Error checking registration status:", err);
      return null;
    } finally {
      setIsCheckingRegistration(false);
    }
  };

  // Enhanced redirection logic for patients
  useEffect(() => {
    if (!isLoading && user) {
      console.log("Auth page detected logged in user. Registration step:", registrationStep, 
                  "isRegistrationFlow:", isRegistrationFlow);
      
      // If the user is a patient, we need to check their registration status
      if (userRole === 'patient') {
        const checkPatientStatus = async () => {
          // Skip checks if explicitly in registration flow with step 2 (payment) or 3 (complete)
          if (isRegistrationFlow && (registrationStep === 2 || registrationStep === 3)) {
            console.log(`Staying on registration page for step: ${registrationStep}`);
            return;
          }
          
          const registrationStatus = await checkRegistrationStatus(user.id);
          console.log("Patient registration status:", registrationStatus);
          
          if (registrationStatus) {
            // Update local state based on database status
            if (registrationStatus.registration_status === 'payment_pending') {
              console.log("Payment pending, transitioning to payment step");
              setIsRegistrationFlow(true);
              setRegistrationStep(2);
              localStorage.setItem('registration_payment_pending', 'true');
              localStorage.setItem('registration_payment_complete', 'false');
              return;
            } 
            else if (['payment_complete', 'care_team_assigned'].includes(registrationStatus.registration_status)) {
              console.log("Payment complete, transitioning to progress step");
              setIsRegistrationFlow(true);
              setRegistrationStep(3);
              localStorage.setItem('registration_payment_pending', 'false');
              localStorage.setItem('registration_payment_complete', 'true');
              return;
            }
            else if (registrationStatus.registration_status === 'fully_registered') {
              console.log("Registration is complete, redirecting to dashboard");
              localStorage.removeItem('registration_payment_pending');
              localStorage.removeItem('registration_payment_complete');
              navigate("/dashboard", { replace: true });
              return;
            }
          }
          
          // Default redirect if we couldn't determine status
          if (userRole) {
            navigate("/dashboard", { replace: true });
          }
        };
        
        checkPatientStatus();
        return;
      }
      
      // For non-patient roles, redirect immediately
      if (userRole && (!isRegistrationFlow || registrationStep === 3)) {
        console.log("Redirecting to dashboard as", userRole);
        navigate("/dashboard", { replace: true });
        
        // Clean up localStorage
        if (isRegistrationFlow) {
          localStorage.removeItem('registration_payment_pending');
          localStorage.removeItem('registration_payment_complete');
        }
      }
    }
  }, [user, userRole, isLoading, navigate, registrationStep, isRegistrationFlow]);

  // Show loading state
  if (isLoading || isCheckingRegistration) {
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
      
      // Clear any previous errors
      setError(null);
      
      // Flag this as a registration flow before user creation
      const isPatientRegistration = userType === 'patient';
      setIsRegistrationFlow(isPatientRegistration);
      
      // Set localStorage flag to prevent redirection race condition
      if (isPatientRegistration) {
        localStorage.setItem('registration_payment_pending', 'true');
        localStorage.setItem('registration_payment_complete', 'false');
      }
      
      // Enhanced patient data handling to include phone number properly
      const enhancedPatientData = patientData ? {
        ...patientData,
        // If phone number was provided in the form, make sure it's captured
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
            onCheckAgain={() => checkRegistrationStatus(user?.id || '')} 
          />
        )}
      </div>
    </div>
  );
};

export default Auth;
