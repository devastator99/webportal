
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { RegistrationForm } from '@/components/registration/RegistrationForm';
import { RegistrationPayment } from '@/components/auth/RegistrationPayment';
import { LucideLoader2, ArrowLeft, LogOut } from 'lucide-react';
import { useAuthHandlers } from '@/hooks/useAuthHandlers';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useRegistrationProcess } from '@/hooks/useRegistrationProcess';

const RegistrationPage = () => {
  const { user, userRole, isLoading, isLoadingRole, signOut } = useAuth();
  const { handleSignUp, error, loading, setError } = useAuthHandlers();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [registeredUserRole, setRegisteredUserRole] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    registrationProgress,
    fetchRegistrationProgress,
    isPolling,
    startPollingRegistrationStatus,
    stopPollingRegistrationStatus
  } = useRegistrationProcess();

  console.log("=== SIMPLE REGISTRATION STATE ===", {
    currentStep,
    registeredUserRole,
    user: user?.id,
    userRole,
    isProcessing,
    registrationProgress
  });

  // Redirect authenticated users with roles to dashboard
  useEffect(() => {
    if (!isLoading && !isLoadingRole && user && userRole) {
      console.log("User with role detected, redirecting to dashboard");
      navigate('/dashboard', { replace: true });
    }
  }, [user, userRole, isLoading, isLoadingRole, navigate]);

  // Show loading state
  if (isLoading || isLoadingRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col items-center justify-center pt-16 md:pt-20">
        <LucideLoader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="mt-4 text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  // Simple form submission handler
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
      setError(null);
      setIsProcessing(true);
      
      // Store user info and role
      setUserInfo({ firstName, lastName });
      setRegisteredUserRole(userType!);
      
      const newUser = await handleSignUp(
        email,
        password,
        userType as any,
        firstName,
        lastName,
        patientData
      );
      
      if (newUser) {
        console.log("=== ACCOUNT CREATED SUCCESSFULLY ===");
        setIsProcessing(false);
        
        if (userType === 'patient') {
          setCurrentStep(2); // Payment step
          toast({
            title: "Account Created!",
            description: "Please complete the payment to activate your account.",
          });
        } else {
          // For non-patients, go directly to dashboard
          toast({
            title: "Account Created!",
            description: "Your account has been created successfully.",
          });
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 1500);
        }
      }
    } catch (error: any) {
      console.error("=== REGISTRATION ERROR ===", error);
      setIsProcessing(false);
      setCurrentStep(1);
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
    console.log("Payment completed, starting polling for completion");
    
    // Start polling for registration status
    startPollingRegistrationStatus();
    
    setCurrentStep(3); // Progress step
    toast({
      title: "Payment Complete!",
      description: "Your registration is being processed...",
    });
  };

  // Handle registration completion
  const handleRegistrationComplete = () => {
    console.log("Registration fully complete, redirecting to dashboard");
    
    stopPollingRegistrationStatus();
    
    toast({
      title: "Welcome!",
      description: "Your account setup is complete. Welcome aboard!",
    });
    
    navigate("/dashboard", { replace: true });
  };

  // Check if registration is complete
  useEffect(() => {
    if (registrationProgress?.status === 'fully_registered' && currentStep === 3) {
      handleRegistrationComplete();
    }
  }, [registrationProgress, currentStep]);

  // Navigation handlers
  const handleBackToHome = () => {
    setCurrentStep(1);
    setRegisteredUserRole(null);
    setUserInfo(null);
    navigate('/', { replace: true });
  };

  const getStepTitle = () => {
    if (currentStep === 1) return 'Create your account';
    if (currentStep === 2) return 'Complete Payment';
    if (currentStep === 3) return 'Setting up your account...';
    return 'Registration';
  };

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
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Step 1: Registration Form */}
        {currentStep === 1 && (
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
                  loading={loading || isProcessing}
                />
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="bg-white py-6 sm:py-8 px-4 shadow-lg shadow-saas-light-purple/20 sm:rounded-lg sm:px-10 relative">
            <div className="flex flex-col items-center justify-center py-8">
              <LucideLoader2 className="w-8 h-8 animate-spin text-purple-600 mb-4" />
              <p className="text-lg font-medium text-gray-800">Creating your account...</p>
              <p className="text-sm text-gray-600 mt-2">Please wait while we set up everything for you.</p>
            </div>
          </div>
        )}
        
        {/* Step 2: Payment (Patients Only) */}
        {currentStep === 2 && !isProcessing && registeredUserRole === 'patient' && (
          <RegistrationPayment 
            onComplete={handlePaymentComplete}
            userInfo={userInfo}
          />
        )}

        {/* Step 3: Progress (Patients After Payment) */}
        {currentStep === 3 && !isProcessing && registeredUserRole === 'patient' && (
          <div className="bg-white py-6 sm:py-8 px-4 shadow-lg shadow-saas-light-purple/20 sm:rounded-lg sm:px-10 relative">
            <div className="flex flex-col items-center justify-center py-8">
              <LucideLoader2 className="w-8 h-8 animate-spin text-purple-600 mb-4" />
              <p className="text-lg font-medium text-gray-800">Setting up your account...</p>
              <p className="text-sm text-gray-600 mt-2">Your care team is being assigned. This may take a few moments.</p>
              {isPolling && (
                <p className="text-xs text-gray-500 mt-2">Checking status...</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationPage;
