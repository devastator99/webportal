
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { RegistrationForm } from '@/components/registration/RegistrationForm';
import { RegistrationPayment } from '@/components/auth/RegistrationPayment';
import { RegistrationProgressReport } from '@/components/auth/RegistrationProgressReport';
import { LucideLoader2 } from 'lucide-react';
import { useAuthHandlers } from '@/hooks/useAuthHandlers';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';

const RegistrationPage = () => {
  const { user, userRole, isLoading, isLoadingRole } = useAuth();
  const { handleSignUp, error, loading, setError } = useAuthHandlers();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [registrationStep, setRegistrationStep] = useState(1);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [registeredUserRole, setRegisteredUserRole] = useState<string | null>(null);
  const [preventRedirection, setPreventRedirection] = useState(false);

  // Check for existing registration state on load
  useEffect(() => {
    const checkRegistrationState = () => {
      const savedStep = localStorage.getItem('registration_step');
      const savedRole = localStorage.getItem('registration_user_role');
      const paymentComplete = localStorage.getItem('registration_payment_complete') === 'true';
      
      console.log("Registration page loaded with state:", { savedStep, savedRole, paymentComplete, user });
      
      if (user && savedStep && savedRole) {
        const step = parseInt(savedStep, 10);
        setRegisteredUserRole(savedRole);
        
        // For patients, if payment is complete, go to progress step
        if (savedRole === 'patient' && paymentComplete) {
          setRegistrationStep(3);
        } else if (savedRole === 'patient' && step === 2) {
          setRegistrationStep(2); // Stay on payment step
        } else if (savedRole !== 'patient' && step >= 2) {
          setRegistrationStep(2); // Non-patients go directly to progress
        } else {
          setRegistrationStep(1); // Start from form
        }
        
        setPreventRedirection(true);
      } else {
        // Clear any stale state
        localStorage.removeItem('registration_step');
        localStorage.removeItem('registration_user_role');
        localStorage.removeItem('registration_payment_complete');
        setRegistrationStep(1);
      }
    };
    
    checkRegistrationState();
  }, [user]);

  // Redirect authenticated users with completed registration
  useEffect(() => {
    if (!isLoading && !isLoadingRole && user && userRole && !preventRedirection) {
      console.log("User with role detected, checking if should redirect to dashboard");
      
      // Check if this is a completed registration
      const savedStep = localStorage.getItem('registration_step');
      if (!savedStep) {
        console.log("No registration in progress, redirecting to dashboard");
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, userRole, isLoading, isLoadingRole, navigate, preventRedirection]);

  // Show loading state
  if (isLoading || isLoadingRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col items-center justify-center pt-16 md:pt-20">
        <LucideLoader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="mt-4 text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  // Handle form submission - create account and route based on role
  const handleFormSubmit = async (
    email: string,
    password: string,
    userType?: string,
    firstName?: string,
    lastName?: string,
    patientData?: any
  ) => {
    try {
      console.log("Registration form submitted with user type:", userType);
      setError(null);
      setPreventRedirection(true);
      
      // Store user info and role
      setUserInfo({ firstName, lastName });
      setRegisteredUserRole(userType!);
      
      // Store registration state
      localStorage.setItem('registration_step', '2');
      localStorage.setItem('registration_user_role', userType!);
      
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
        console.log("Account created successfully for role:", userType);
        
        // Route based on user type
        if (userType === 'patient') {
          // Patients go to payment step
          setRegistrationStep(2);
          toast({
            title: "Account Created!",
            description: "Please complete the payment to activate your account.",
          });
        } else {
          // All other roles skip payment and go directly to progress step
          setRegistrationStep(2); // For non-patients, step 2 is progress
          toast({
            title: "Account Created!",
            description: "Setting up your account and permissions...",
          });
        }
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      
      // Clean up localStorage if registration fails
      localStorage.removeItem('registration_step');
      localStorage.removeItem('registration_user_role');
      localStorage.removeItem('registration_payment_complete');
      setPreventRedirection(false);
      
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive"
      });
    }
  };

  // Handle payment completion (patients only)
  const handlePaymentComplete = () => {
    console.log("Payment completed, moving to progress step");
    
    localStorage.setItem('registration_payment_complete', 'true');
    localStorage.setItem('registration_step', '3');
    
    toast({
      title: "Payment Complete!",
      description: "Your registration is being processed. Please wait while we set up your account.",
    });
    
    setRegistrationStep(3);
  };

  // Handle final registration completion
  const handleRegistrationComplete = () => {
    console.log("Registration fully complete, redirecting to dashboard");
    
    // Clear all localStorage flags
    localStorage.removeItem('registration_step');
    localStorage.removeItem('registration_user_role');
    localStorage.removeItem('registration_payment_complete');
    setPreventRedirection(false);
    
    toast({
      title: "Welcome!",
      description: "Your account setup is complete. Welcome aboard!",
    });
    
    // Redirect to dashboard
    navigate("/dashboard", { replace: true });
  };

  // Determine step title based on role and step
  const getStepTitle = () => {
    if (registrationStep === 1) return 'Create your account';
    
    if (registeredUserRole === 'patient') {
      if (registrationStep === 2) return 'Complete Payment';
      if (registrationStep === 3) return 'Registration in Progress';
    } else {
      if (registrationStep === 2) return 'Account Setup in Progress';
    }
    
    return 'Registration';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8 pt-16 md:pt-20 overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
        <h2 className="mt-3 text-center text-2xl sm:text-3xl font-bold text-saas-dark mb-8">
          {getStepTitle()}
        </h2>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Step 1: Registration Form (All Roles) */}
        {registrationStep === 1 && (
          <div className="bg-white py-6 sm:py-8 px-4 shadow-lg shadow-saas-light-purple/20 sm:rounded-lg sm:px-10 relative">
            <ScrollArea 
              className="w-full" 
              invisibleScrollbar={true}
              maxHeight="65vh"
            >
              <div className="mobile-form-container pr-1">
                <RegistrationForm 
                  onSubmit={handleFormSubmit}
                  error={error}
                  loading={loading}
                />
              </div>
            </ScrollArea>
          </div>
        )}
        
        {/* Step 2: Payment (Patients Only) or Progress (Others) */}
        {registrationStep === 2 && registeredUserRole === 'patient' && (
          <RegistrationPayment 
            onComplete={handlePaymentComplete}
            userInfo={userInfo}
          />
        )}

        {registrationStep === 2 && registeredUserRole !== 'patient' && (
          <RegistrationProgressReport 
            onComplete={handleRegistrationComplete}
            userRole={registeredUserRole}
          />
        )}

        {/* Step 3: Progress (Patients After Payment) */}
        {registrationStep === 3 && registeredUserRole === 'patient' && (
          <RegistrationProgressReport 
            onComplete={handleRegistrationComplete}
            userRole={registeredUserRole}
          />
        )}
      </div>
    </div>
  );
};

export default RegistrationPage;
