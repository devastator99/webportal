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
import { supabase } from "@/integrations/supabase/client";
import { UserRegistrationStatus, RegistrationStatusValues } from "@/types/registration";

const Auth = () => {
  const { user, userRole, isLoading, isLoadingRole } = useAuth();
  const { handleSignUp, error, loading, setError } = useAuthHandlers();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [registrationStep, setRegistrationStep] = useState(1);
  const [registeredUser, setRegisteredUser] = useState<any>(null);
  const [isRegistrationFlow, setIsRegistrationFlow] = useState(false);
  const [isCheckingRegistrationStatus, setIsCheckingRegistrationStatus] = useState(false);
  const [hasCompletionCheck, setHasCompletionCheck] = useState(false);
  
  const isRegistration = location.pathname.includes('/register');

  // Helper function to check if registration is truly complete
  const checkRegistrationComplete = async (userId: string): Promise<boolean> => {
    try {
      console.log("Checking registration completion for user:", userId);
      
      const { data, error } = await supabase.rpc('get_user_registration_status_safe', {
        p_user_id: userId
      });
      
      if (error) {
        console.error("Error checking registration status:", error);
        return false;
      }
      
      const regStatus = data as unknown as UserRegistrationStatus;
      console.log("Registration status check result:", regStatus);
      
      // Check if registration is fully complete
      const isFullyRegistered = regStatus.registration_status === RegistrationStatusValues.FULLY_REGISTERED;
      
      // Also check if all required tasks are actually completed
      const requiredTaskTypes = ['assign_care_team', 'create_chat_room', 'send_welcome_notification'];
      const completedTasks = regStatus.tasks?.filter(task => task.status === 'completed') || [];
      const completedTaskTypes = completedTasks.map(task => task.task_type);
      const allRequiredTasksCompleted = requiredTaskTypes.every(taskType => 
        completedTaskTypes.includes(taskType)
      );
      
      console.log("Registration completion check:", {
        isFullyRegistered,
        allRequiredTasksCompleted,
        completedTaskTypes,
        requiredTaskTypes
      });
      
      return isFullyRegistered && allRequiredTasksCompleted;
    } catch (err) {
      console.error("Exception checking registration completion:", err);
      return false;
    }
  };

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

  // Enhanced redirect logic - but don't interfere with step 3
  useEffect(() => {
    const handleRedirect = async () => {
      // Don't redirect while still loading
      if (isLoading || isLoadingRole || isCheckingRegistrationStatus) {
        console.log("Auth page: Still loading auth state, waiting...");
        return;
      }
      
      if (!user) {
        console.log("Auth page: No user found, staying on auth page");
        return;
      }
      
      console.log("Auth page detected logged in user. Role:", userRole, "isRegistrationFlow:", isRegistrationFlow, "isRegistration:", isRegistration, "registrationStep:", registrationStep);
      
      // For non-patient roles, redirect to dashboard (they don't need registration)
      if (userRole && userRole !== 'patient') {
        console.log("Redirecting non-patient to dashboard:", userRole);
        navigate("/dashboard", { replace: true });
        return;
      }
      
      // For patients: Check actual registration completion before redirecting
      if (userRole === 'patient') {
        // If we're in step 3 of registration (RegistrationProgressReport), let that component handle redirects
        if (isRegistration && registrationStep === 3) {
          console.log("Patient in step 3, letting RegistrationProgressReport handle redirects");
          return;
        }
        
        // If we're in registration flow or on registration route, check completion
        if (isRegistration || isRegistrationFlow) {
          console.log("Patient in registration process, checking completion status");
          
          // Only check once to avoid infinite loops
          if (!hasCompletionCheck) {
            setIsCheckingRegistrationStatus(true);
            setHasCompletionCheck(true);
            try {
              const isComplete = await checkRegistrationComplete(user.id);
              
              if (isComplete) {
                console.log("Patient registration is complete, redirecting to dashboard");
                // Clear any localStorage flags since registration is complete
                localStorage.removeItem('registration_payment_pending');
                localStorage.removeItem('registration_payment_complete');
                navigate("/dashboard", { replace: true });
              } else {
                console.log("Patient registration is incomplete, staying in registration flow");
                // Stay in registration flow - don't redirect
              }
            } catch (error) {
              console.error("Error checking registration status:", error);
              // On error, stay in registration flow
            } finally {
              setIsCheckingRegistrationStatus(false);
            }
          }
        } else {
          // Patient not on registration route - check if they need to complete registration
          if (!hasCompletionCheck) {
            setIsCheckingRegistrationStatus(true);
            setHasCompletionCheck(true);
            try {
              const isComplete = await checkRegistrationComplete(user.id);
              
              if (!isComplete) {
                console.log("Patient has incomplete registration, redirecting to registration");
                // Set appropriate localStorage flags
                localStorage.setItem('registration_payment_complete', 'true');
                localStorage.setItem('registration_payment_pending', 'false');
                navigate("/auth/register", { replace: true });
              } else {
                console.log("Patient registration is complete, allowing dashboard access");
                // Clear any localStorage flags since registration is complete
                localStorage.removeItem('registration_payment_pending');
                localStorage.removeItem('registration_payment_complete');
                navigate("/dashboard", { replace: true });
              }
            } catch (error) {
              console.error("Error checking registration status:", error);
              // On error, redirect to registration to be safe
              navigate("/auth/register", { replace: true });
            } finally {
              setIsCheckingRegistrationStatus(false);
            }
          }
        }
        return;
      }
      
      // User has no role yet - this shouldn't happen after proper registration
      if (user && !userRole) {
        console.log("User has no role, this indicates an incomplete registration");
        // For users with no role, redirect to registration to complete the process
        navigate("/auth/register", { replace: true });
        return;
      }
    };
    
    handleRedirect();
  }, [user, userRole, isLoading, isLoadingRole, navigate, isRegistrationFlow, isRegistration, registrationStep, hasCompletionCheck]);

  // Show loading state while auth is loading or checking registration status
  if (isLoading || isLoadingRole || isCheckingRegistrationStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col items-center justify-center pt-16 md:pt-20">
        <LucideLoader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="mt-4 text-sm text-gray-600">
          {isCheckingRegistrationStatus ? "Checking registration status..." : "Loading..."}
        </p>
      </div>
    );
  }

  // Handle signup form submission - Enhanced to better handle role assignment
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
