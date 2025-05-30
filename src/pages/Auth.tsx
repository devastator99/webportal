
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SupabaseAuthUI } from "@/components/auth/SupabaseAuthUI";
import { AuthForm } from "@/components/auth/AuthForm";
import { RegistrationReview } from "@/components/auth/RegistrationReview";
import { EmailVerification } from "@/components/auth/EmailVerification";
import { RegistrationPayment } from "@/components/auth/RegistrationPayment";
import { RegistrationProgressReport } from "@/components/auth/RegistrationProgressReport";
import { ProgressIndicator } from "@/components/auth/ProgressIndicator";
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
  const [registeredUser, setRegisteredUser] = useState<any>(null);
  const [isRegistrationFlow, setIsRegistrationFlow] = useState(false);
  const [isCheckingRegistrationStatus, setIsCheckingRegistrationStatus] = useState(false);
  const [hasCompletionCheck, setHasCompletionCheck] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  
  const isRegistration = location.pathname.includes('/register');

  // Registration steps for progress indicator
  const registrationSteps = [
    "Account Setup",
    "Review Information", 
    "Email Verification",
    "Payment",
    "Completion"
  ];

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
      
      if (paymentComplete) {
        setIsRegistrationFlow(true);
        setRegistrationStep(5); // Go to completion step
      } else if (paymentPending) {
        setIsRegistrationFlow(true);
        setRegistrationStep(4); // Go to payment step
      }
    };
    
    checkLocalStorageState();
  }, [isRegistration, location.pathname]);

  // Enhanced redirect logic - but don't interfere with registration flow
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
      
      // For patients: Only redirect if we're NOT in an active registration flow
      if (userRole === 'patient') {
        // If we're in registration flow (steps 2-5), let the flow continue - DON'T redirect
        if (isRegistration && isRegistrationFlow && registrationStep >= 2) {
          console.log("Patient in active registration flow, step:", registrationStep, "- staying in flow");
          return;
        }
        
        // If not in registration flow, check completion status
        if (!isRegistrationFlow && !hasCompletionCheck) {
          console.log("Patient not in registration flow, checking completion status");
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

  // Handle signup form submission - Enhanced to properly trigger registration flow
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
      
      // Store form data for review step
      const formDataToStore = {
        email,
        password,
        userType,
        firstName,
        lastName,
        phone: email.includes('@') ? patientData?.phone : email,
        ...patientData
      };
      setFormData(formDataToStore);
      
      // Flag this as a registration flow before user creation
      const isPatientRegistration = userType === 'patient';
      
      if (isPatientRegistration) {
        setIsRegistrationFlow(true);
        // Move to review step instead of creating user immediately
        setRegistrationStep(2);
        toast({
          title: "Information collected",
          description: "Please review your information before proceeding",
        });
        return;
      } else {
        // For non-patients, create account immediately
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
      
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive"
      });
    }
  };

  // Handle review confirmation - CREATE USER ACCOUNT HERE
  const handleReviewConfirm = async () => {
    if (!formData) return;
    
    try {
      console.log("Creating user after review confirmation");
      
      const enhancedPatientData = {
        ...formData,
        emergencyContact: formData.emergencyContact || formData.phone
      };
      
      // Create the user account NOW
      const user = await handleSignUp(
        formData.email || formData.phone, 
        formData.password, 
        formData.userType, 
        formData.firstName, 
        formData.lastName, 
        enhancedPatientData
      );
      
      if (user) {
        console.log("Patient registered successfully, moving to email verification");
        setRegisteredUser(user);
        setRegistrationStep(3); // Move to email verification
        toast({
          title: "Account created",
          description: "Please verify your email to continue",
        });
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      
      // Clean up localStorage if registration fails
      localStorage.removeItem('registration_payment_pending');
      localStorage.removeItem('registration_payment_complete');
      setIsRegistrationFlow(false);
      
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive"
      });
    }
  };

  // Handle email verification completion
  const handleEmailVerified = () => {
    console.log("Email verified, moving to payment step");
    setRegistrationStep(4);
    // Set payment pending flag
    localStorage.setItem('registration_payment_pending', 'true');
    localStorage.setItem('registration_payment_complete', 'false');
    toast({
      title: "Email verified",
      description: "Please complete your registration payment",
    });
  };
  
  // When payment is complete, move to final step
  const handlePaymentComplete = () => {
    console.log("Payment completed, moving to final step");
    setRegistrationStep(5);
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
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
        <h2 className="mt-3 text-center text-2xl sm:text-3xl font-bold text-saas-dark mb-8">
          {registrationStep === 1 ? 'Create your account' : 
           registrationStep === 2 ? 'Review your information' :
           registrationStep === 3 ? 'Verify your email' :
           registrationStep === 4 ? 'Complete registration' : 
           'Registration status'}
        </h2>

        {/* Progress Indicator */}
        {isRegistrationFlow && (
          <ProgressIndicator 
            currentStep={registrationStep}
            totalSteps={registrationSteps.length}
            steps={registrationSteps}
          />
        )}
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

        {registrationStep === 2 && formData && (
          <RegistrationReview
            data={formData}
            onEdit={() => setRegistrationStep(1)}
            onConfirm={handleReviewConfirm}
            isLoading={loading}
          />
        )}

        {registrationStep === 3 && formData && (
          <EmailVerification
            email={formData.email || 'your-email@example.com'}
            onVerified={handleEmailVerified}
            onBack={() => setRegistrationStep(2)}
          />
        )}
        
        {registrationStep === 4 && (user || registeredUser) && (
          <RegistrationPayment 
            onComplete={handlePaymentComplete}
            registrationFee={500}
            userInfo={formData ? {
              firstName: formData.firstName,
              lastName: formData.lastName
            } : undefined}
          />
        )}
        
        {registrationStep === 5 && (
          <RegistrationProgressReport 
            onCheckAgain={() => console.log('Check again clicked')} 
          />
        )}
      </div>
    </div>
  );
};

export default Auth;
