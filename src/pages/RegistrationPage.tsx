
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { RegistrationForm } from '@/components/registration/RegistrationForm';
import { RegistrationPayment } from '@/components/auth/RegistrationPayment';
import { RegistrationProgressReport } from '@/components/auth/RegistrationProgressReport';
import { LucideLoader2, ArrowLeft, LogOut } from 'lucide-react';
import { useAuthHandlers } from '@/hooks/useAuthHandlers';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useEnhancedRegistrationState } from '@/hooks/useEnhancedRegistrationState';

const RegistrationPage = () => {
  const { user, userRole, isLoading, isLoadingRole, signOut } = useAuth();
  const { handleSignUp, error, loading, setError } = useAuthHandlers();
  const navigate = useNavigate();
  
  const [registrationStep, setRegistrationStep] = useState(1);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [registeredUserRole, setRegisteredUserRole] = useState<string | null>(null);
  const [isProcessingRegistration, setIsProcessingRegistration] = useState(false);

  const enhancedState = useEnhancedRegistrationState();

  console.log("Registration page state:", { 
    registrationStep, 
    registeredUserRole, 
    user: user?.id, 
    userRole,
    enhancedStateData: enhancedState.getRegistrationState()
  });

  // Check for existing registration state on load
  useEffect(() => {
    const state = enhancedState.getRegistrationState();
    
    console.log("Checking registration state on load:", state);
    
    // If user exists and has completed registration, redirect to dashboard
    if (user && userRole && !state.userRole && state.step === 1) {
      console.log("User has completed registration, redirecting to dashboard");
      navigate('/dashboard', { replace: true });
      return;
    }
    
    // If user has saved registration state, restore it
    if (user && state.userRole && state.step > 1) {
      console.log("Restoring saved registration state");
      setRegisteredUserRole(state.userRole);
      
      if (state.userRole === 'patient') {
        if (state.paymentComplete) {
          setRegistrationStep(3); // Progress step
        } else {
          setRegistrationStep(2); // Payment step
        }
      } else {
        setRegistrationStep(2); // Progress step for non-patients
      }
    }
  }, [user, userRole, navigate, enhancedState]);

  // Redirect authenticated users with roles to dashboard
  useEffect(() => {
    if (!isLoading && !isLoadingRole && user && userRole) {
      const state = enhancedState.getRegistrationState();
      // Only redirect if not in active registration
      if (!state.userRole || state.step === 1) {
        console.log("User with role detected, redirecting to dashboard");
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, userRole, isLoading, isLoadingRole, navigate, enhancedState]);

  // Show loading state
  if (isLoading || isLoadingRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col items-center justify-center pt-16 md:pt-20">
        <LucideLoader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="mt-4 text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  // Handle form submission - SIMPLIFIED
  const handleFormSubmit = async (
    email: string,
    password: string,
    userType?: string,
    firstName?: string,
    lastName?: string,
    patientData?: any
  ) => {
    try {
      console.log("=== FORM SUBMISSION STARTED ===");
      console.log("User type:", userType);
      
      setError(null);
      setIsProcessingRegistration(true);
      
      // Store user info and role
      setUserInfo({ firstName, lastName });
      setRegisteredUserRole(userType!);
      
      // Update enhanced state IMMEDIATELY
      enhancedState.updateUserRole(userType!);
      enhancedState.updateRegistrationStep(2);
      
      console.log("Enhanced state updated, creating user account...");
      
      const enhancedPatientData = patientData ? {
        ...patientData,
        emergencyContact: patientData.emergencyContact || patientData.phone
      } : undefined;
      
      // Create the user account
      const newUser = await handleSignUp(
        email,
        password,
        userType as any,
        firstName,
        lastName,
        enhancedPatientData
      );
      
      if (newUser) {
        console.log("=== ACCOUNT CREATED SUCCESSFULLY ===");
        setIsProcessingRegistration(false);
        
        // Move to next step based on user type
        if (userType === 'patient') {
          console.log("Patient registration - moving to PAYMENT step");
          setRegistrationStep(2);
          toast({
            title: "Account Created!",
            description: "Please complete the payment to activate your account.",
          });
        } else {
          console.log("Non-patient registration - moving to PROGRESS step");
          setRegistrationStep(2);
          toast({
            title: "Account Created!",
            description: "Setting up your account and permissions...",
          });
        }
      } else {
        throw new Error("Failed to create user account");
      }
    } catch (error: any) {
      console.error("=== REGISTRATION ERROR ===", error);
      
      // Clean up state on error
      enhancedState.clearRegistrationState();
      setIsProcessingRegistration(false);
      setRegistrationStep(1);
      setRegisteredUserRole(null);
      
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive"
      });
    }
  };

  // Handle payment completion
  const handlePaymentComplete = () => {
    console.log("Payment completed");
    
    enhancedState.updatePaymentStatus(true, false);
    enhancedState.updateRegistrationStep(3);
    
    setRegistrationStep(3);
    
    toast({
      title: "Payment Complete!",
      description: "Your registration is being processed. Please wait while we set up your account.",
    });
  };

  // Handle registration completion
  const handleRegistrationComplete = () => {
    console.log("Registration fully complete");
    
    enhancedState.clearRegistrationState();
    
    toast({
      title: "Welcome!",
      description: "Your account setup is complete. Welcome aboard!",
    });
    
    navigate("/dashboard", { replace: true });
  };

  // Navigation handlers
  const handleBackToHome = () => {
    enhancedState.clearRegistrationState();
    setRegistrationStep(1);
    setRegisteredUserRole(null);
    setUserInfo(null);
    navigate('/', { replace: true });
  };

  // Determine step title
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

  console.log("=== REGISTRATION PAGE RENDER ===");
  console.log("Current state:", {
    registrationStep,
    registeredUserRole,
    userInfo,
    user: user?.id,
    userRole,
    isProcessingRegistration
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8 pt-16 md:pt-20 overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
        {/* Navigation Buttons */}
        <div className="mb-6 flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={handleBackToHome}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          
          {user && (
            <Button
              variant="outline"
              onClick={signOut}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          )}
        </div>
        
        <h2 className="mt-3 text-center text-2xl sm:text-3xl font-bold text-saas-dark mb-8">
          {getStepTitle()}
        </h2>
        
        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-2 bg-blue-100 border border-blue-300 rounded text-xs">
            <strong>Debug:</strong> Step {registrationStep}, Role: {registeredUserRole || 'none'}, 
            User: {user?.id || 'none'}, Processing: {isProcessingRegistration}
          </div>
        )}
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Step 1: Registration Form */}
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
                  loading={loading || isProcessingRegistration}
                />
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Processing State */}
        {isProcessingRegistration && (
          <div className="bg-white py-6 sm:py-8 px-4 shadow-lg shadow-saas-light-purple/20 sm:rounded-lg sm:px-10 relative">
            <div className="flex flex-col items-center justify-center py-8">
              <LucideLoader2 className="w-8 h-8 animate-spin text-purple-600 mb-4" />
              <p className="text-lg font-medium text-gray-800">Creating your account...</p>
              <p className="text-sm text-gray-600 mt-2">Please wait while we set up everything for you.</p>
            </div>
          </div>
        )}
        
        {/* Step 2: Payment (Patients Only) or Progress (Others) */}
        {registrationStep === 2 && !isProcessingRegistration && registeredUserRole === 'patient' && (
          <RegistrationPayment 
            onComplete={handlePaymentComplete}
            userInfo={userInfo}
          />
        )}

        {registrationStep === 2 && !isProcessingRegistration && registeredUserRole !== 'patient' && (
          <RegistrationProgressReport 
            onComplete={handleRegistrationComplete}
            userRole={registeredUserRole}
          />
        )}

        {/* Step 3: Progress (Patients After Payment) */}
        {registrationStep === 3 && !isProcessingRegistration && registeredUserRole === 'patient' && (
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
