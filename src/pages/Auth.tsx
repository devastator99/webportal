
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SupabaseAuthUI } from "@/components/auth/SupabaseAuthUI";
import { AuthForm } from "@/components/auth/AuthForm";
import { RegistrationPayment } from "@/components/auth/RegistrationPayment";
import { LucideLoader2 } from "lucide-react";
import { useAuthHandlers } from "@/hooks/useAuthHandlers";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserRegistrationStatus, RegistrationStatusValues } from "@/types/registration";

const Auth = () => {
  const { user, userRole, isLoading, isLoadingRole } = useAuth();
  const { handleSignUp, error, loading, setError } = useAuthHandlers();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [registrationStep, setRegistrationStep] = useState(1);
  const [isRegistrationFlow, setIsRegistrationFlow] = useState(false);
  const [isCheckingRegistrationStatus, setIsCheckingRegistrationStatus] = useState(false);
  const [hasCompletionCheck, setHasCompletionCheck] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [preventRedirection, setPreventRedirection] = useState(false);
  
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
      
      const paymentComplete = localStorage.getItem('registration_payment_complete') === 'true';
      
      console.log("Auth page loaded with state:", { paymentComplete });
      
      if (paymentComplete) {
        setIsRegistrationFlow(true);
        setRegistrationStep(2); // Go to payment step
      }
    };
    
    checkLocalStorageState();
  }, [isRegistration, location.pathname]);

  // Enhanced redirect logic - but ONLY when not in active registration flow
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
      
      // CRITICAL: If preventRedirection is set, don't redirect (used during registration flow)
      if (preventRedirection) {
        console.log("Auth page: Redirection prevented during registration flow");
        return;
      }
      
      console.log("Auth page detected logged in user. Role:", userRole, "isRegistrationFlow:", isRegistrationFlow, "isRegistration:", isRegistration, "registrationStep:", registrationStep);
      
      // CRITICAL FIX: Don't redirect if user is in active registration flow (step 2 = payment)
      if (isRegistration && isRegistrationFlow && registrationStep === 2) {
        console.log("User in active registration flow, step:", registrationStep, "- NOT redirecting");
        return;
      }
      
      // For non-patient roles, redirect to dashboard (they don't need registration)
      if (userRole && userRole !== 'patient') {
        console.log("Redirecting non-patient to dashboard:", userRole);
        navigate("/dashboard", { replace: true });
        return;
      }
      
      // For patients: Only redirect if we're NOT in an active registration flow
      if (userRole === 'patient') {
        // If not in registration flow, check completion status
        if (!isRegistrationFlow && !hasCompletionCheck) {
          console.log("Patient not in registration flow, checking completion status");
          setIsCheckingRegistrationStatus(true);
          setHasCompletionCheck(true);
          try {
            const isComplete = await checkRegistrationComplete(user.id);
            
            if (!isComplete) {
              console.log("Patient has incomplete registration, redirecting to registration");
              navigate("/auth/register", { replace: true });
            } else {
              console.log("Patient registration is complete, allowing dashboard access");
              // Clear any localStorage flags since registration is complete
              localStorage.removeItem('registration_payment_complete');
              localStorage.removeItem('registration_complete');
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
        return;
      }
      
      // CRITICAL FIX: For users with no role on registration page, don't redirect immediately
      // Let them complete the flow they're already in
      if (user && !userRole && isRegistration) {
        console.log("User has no role but is on registration page - allowing registration flow to continue");
        return;
      }
      
      // User has no role and not on registration page - redirect to registration
      if (user && !userRole && !isRegistration) {
        console.log("User has no role, redirecting to registration");
        navigate("/auth/register", { replace: true });
        return;
      }
    };
    
    handleRedirect();
  }, [user, userRole, isLoading, isLoadingRole, navigate, isRegistrationFlow, isRegistration, registrationStep, hasCompletionCheck, preventRedirection]);

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

  // Handle signup form submission - create account and move to payment step
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
      
      // For patients, create account and move to payment step
      if (userType === 'patient') {
        // CRITICAL: Prevent any redirections during registration flow
        setPreventRedirection(true);
        
        const enhancedPatientData = patientData ? {
          ...patientData,
          emergencyContact: patientData.emergencyContact || patientData.phone
        } : undefined;
        
        // Create the user account
        const user = await handleSignUp(
          email, 
          password, 
          userType as any, 
          firstName, 
          lastName, 
          enhancedPatientData
        );
        
        if (user) {
          console.log("Patient account created successfully, moving to payment step");
          
          // Store user info for payment step
          setUserInfo({ firstName, lastName });
          
          // Move to payment step IMMEDIATELY after account creation
          setIsRegistrationFlow(true);
          setRegistrationStep(2); // Move to payment step
          
          toast({
            title: "Account Created!",
            description: "Please complete the payment to activate your account.",
          });
        }
        
        return;
      } else {
        // For non-patients, create account immediately and redirect to dashboard
        const enhancedPatientData = patientData ? {
          ...patientData,
          emergencyContact: patientData.emergencyContact || patientData.phone
        } : undefined;
        
        const user = await handleSignUp(email, password, userType as any, firstName, lastName, enhancedPatientData);
        
        if (user) {
          toast({
            title: "Account created",
            description: "Your account has been created successfully",
          });
          navigate("/dashboard");
        }
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      
      // Clean up localStorage if registration fails
      localStorage.removeItem('registration_payment_complete');
      localStorage.removeItem('registration_complete');
      setIsRegistrationFlow(false);
      setPreventRedirection(false);
      
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive"
      });
    }
  };

  // Handle payment completion - redirect directly to dashboard
  const handlePaymentComplete = () => {
    console.log("Payment completed, redirecting to dashboard");
    
    // Clear localStorage flags
    localStorage.removeItem('registration_payment_complete');
    localStorage.removeItem('registration_complete');
    setPreventRedirection(false);
    
    toast({
      title: "Registration Complete!",
      description: "Welcome to your health dashboard. Your care team will be assigned shortly.",
    });
    
    // Redirect directly to dashboard
    navigate("/dashboard", { replace: true });
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

  // For registration process - 2 steps: Form → Payment
  return (
    <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8 pt-16 md:pt-20 overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
        <h2 className="mt-3 text-center text-2xl sm:text-3xl font-bold text-saas-dark mb-8">
          {registrationStep === 1 ? 'Create your account' : 'Complete Payment'}
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
        
        {registrationStep === 2 && (
          <RegistrationPayment 
            onComplete={handlePaymentComplete}
            userInfo={userInfo}
          />
        )}
      </div>
    </div>
  );
};

export default Auth;
