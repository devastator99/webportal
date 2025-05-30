
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
import { useRegistrationState } from '@/hooks/useRegistrationState';

const RegistrationPage = () => {
  const { user, userRole, isLoading, isLoadingRole, signOut } = useAuth();
  const { handleSignUp, error, loading, setError } = useAuthHandlers();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [registrationStep, setRegistrationStep] = useState(1);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [registeredUserRole, setRegisteredUserRole] = useState<string | null>(null);
  const [preventRedirection, setPreventRedirection] = useState(false);
  const [isProcessingRegistration, setIsProcessingRegistration] = useState(false);
  const [hasIncompleteRegistration, setHasIncompleteRegistration] = useState(false);

  const {
    getRegistrationState,
    isUserInActiveRegistration,
    updateRegistrationStep,
    updateUserRole,
    updatePaymentStatus,
    clearRegistrationState,
    validateState,
    fixStateIssues,
    debugMode
  } = useRegistrationState();

  // Check for existing registration state on load
  useEffect(() => {
    const checkRegistrationState = () => {
      const state = getRegistrationState();
      
      if (debugMode) {
        console.log("Registration page loaded with state:", state);
      }
      
      // Fix any state issues first
      fixStateIssues();
      
      // If user exists but has no role and no active registration, they have incomplete registration
      if (user && !userRole && !state.userRole && state.step === 1) {
        if (debugMode) {
          console.log("Detected incomplete registration for existing user");
        }
        setHasIncompleteRegistration(true);
        setPreventRedirection(true);
        return;
      }
      
      if (user && state.userRole && state.step > 1) {
        setRegisteredUserRole(state.userRole);
        
        // For patients, if payment is complete, go to progress step
        if (state.userRole === 'patient' && state.paymentComplete) {
          if (debugMode) {
            console.log("Patient with completed payment, setting step to 3");
          }
          setRegistrationStep(3);
        } else if (state.userRole === 'patient' && state.step >= 2) {
          if (debugMode) {
            console.log("Patient registration, setting step to 2 (payment)");
          }
          setRegistrationStep(2); // Payment step for patients
        } else if (state.userRole !== 'patient' && state.step >= 2) {
          if (debugMode) {
            console.log("Non-patient registration, setting step to 2 (progress)");
          }
          setRegistrationStep(2); // Progress step for non-patients
        } else {
          if (debugMode) {
            console.log("Starting from form step");
          }
          setRegistrationStep(1); // Start from form
        }
        
        setPreventRedirection(true);
      } else {
        if (debugMode) {
          console.log("No saved registration state");
        }
        setRegistrationStep(1);
      }
    };
    
    checkRegistrationState();
  }, [user, userRole, getRegistrationState, fixStateIssues, debugMode]);

  // Enhanced redirect logic for authenticated users with completed registration
  useEffect(() => {
    if (!isLoading && !isLoadingRole && user && userRole && !preventRedirection && !hasIncompleteRegistration) {
      if (debugMode) {
        console.log("User with role detected, checking if should redirect to dashboard");
      }
      
      // Check if this is a completed registration
      const state = getRegistrationState();
      if (state.step === 1 && !state.userRole) {
        if (debugMode) {
          console.log("No registration in progress, redirecting to dashboard");
        }
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, userRole, isLoading, isLoadingRole, navigate, preventRedirection, hasIncompleteRegistration, getRegistrationState, debugMode]);

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
      if (debugMode) {
        console.log("=== FORM SUBMISSION STARTED ===");
        console.log("Registration form submitted with user type:", userType);
      }
      
      setError(null);
      setPreventRedirection(true);
      setIsProcessingRegistration(true);
      
      // Store user info and role FIRST
      setUserInfo({ firstName, lastName });
      setRegisteredUserRole(userType!);
      
      // Store registration state using new state manager
      updateRegistrationStep(2);
      updateUserRole(userType!);
      
      const enhancedPatientData = patientData ? {
        ...patientData,
        emergencyContact: patientData.emergencyContact || patientData.phone
      } : undefined;
      
      if (debugMode) {
        console.log("Calling handleSignUp...");
      }
      
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
        if (debugMode) {
          console.log("=== ACCOUNT CREATED SUCCESSFULLY ===");
          console.log("Account created successfully for role:", userType);
        }
        
        // Clear incomplete registration flag
        setHasIncompleteRegistration(false);
        
        // IMMEDIATELY update state synchronously - don't wait for anything
        setIsProcessingRegistration(false);
        
        if (userType === 'patient') {
          if (debugMode) {
            console.log("Patient registration - IMMEDIATELY moving to PAYMENT step");
          }
          setRegistrationStep(2);
          toast({
            title: "Account Created!",
            description: "Please complete the payment to activate your account.",
          });
        } else {
          if (debugMode) {
            console.log("Non-patient registration - IMMEDIATELY moving to PROGRESS step");
          }
          setRegistrationStep(2);
          toast({
            title: "Account Created!",
            description: "Setting up your account and permissions...",
          });
        }
        
        if (debugMode) {
          console.log("=== FORM SUBMISSION COMPLETED ===");
        }
      } else {
        console.error("User creation failed - no user returned");
        throw new Error("Failed to create user account");
      }
    } catch (error: any) {
      console.error("=== REGISTRATION ERROR ===");
      console.error("Registration error:", error);
      
      // Clean up state if registration fails
      clearRegistrationState();
      setPreventRedirection(false);
      setIsProcessingRegistration(false);
      
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive"
      });
    }
  };

  // Handle payment completion (patients only)
  const handlePaymentComplete = () => {
    if (debugMode) {
      console.log("Payment completed, moving to progress step");
    }
    
    updatePaymentStatus(true, false);
    updateRegistrationStep(3);
    
    toast({
      title: "Payment Complete!",
      description: "Your registration is being processed. Please wait while we set up your account.",
    });
    
    setRegistrationStep(3);
  };

  // Handle final registration completion
  const handleRegistrationComplete = () => {
    if (debugMode) {
      console.log("Registration fully complete, redirecting to dashboard");
    }
    
    // Clear all registration state
    clearRegistrationState();
    setPreventRedirection(false);
    setHasIncompleteRegistration(false);
    
    toast({
      title: "Welcome!",
      description: "Your account setup is complete. Welcome aboard!",
    });
    
    // Redirect to dashboard
    navigate("/dashboard", { replace: true });
  };

  // Enhanced navigation back to home with proper cleanup
  const handleBackToHome = () => {
    if (debugMode) {
      console.log('[RegistrationPage] Handling back to home navigation');
    }
    
    // Clear any registration state
    clearRegistrationState();
    
    // Reset component state that prevents redirection
    setPreventRedirection(false);
    setRegistrationStep(1);
    setRegisteredUserRole(null);
    setUserInfo(null);
    setIsProcessingRegistration(false);
    setHasIncompleteRegistration(false);
    
    // Navigate back to home
    navigate('/', { replace: true });
  };

  // Handle sign out for users with incomplete registration
  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been signed out. You can now create a new account or sign in with a different account.",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Sign out error",
        description: "There was an error signing you out. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Determine step title based on role and step
  const getStepTitle = () => {
    if (hasIncompleteRegistration) return 'Complete Your Registration';
    if (registrationStep === 1) return 'Create your account';
    
    if (registeredUserRole === 'patient') {
      if (registrationStep === 2) return 'Complete Payment';
      if (registrationStep === 3) return 'Registration in Progress';
    } else {
      if (registrationStep === 2) return 'Account Setup in Progress';
    }
    
    return 'Registration';
  };

  if (debugMode) {
    console.log("=== REGISTRATION PAGE RENDER ===");
    console.log("Current state:", {
      registrationStep,
      registeredUserRole,
      userInfo,
      preventRedirection,
      user: user?.id,
      userRole,
      isProcessingRegistration,
      hasIncompleteRegistration
    });
  }

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
          
          {/* Show sign out button for users with incomplete registration */}
          {(hasIncompleteRegistration || user) && (
            <Button
              variant="outline"
              onClick={handleSignOut}
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
        
        {/* Show incomplete registration notice */}
        {hasIncompleteRegistration && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm text-center">
              It looks like your registration was not completed. Please fill out the form below to complete your account setup.
            </p>
          </div>
        )}
        
        {/* Debug info in development */}
        {debugMode && (
          <div className="mb-4 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
            <strong>Debug:</strong> Step {registrationStep}, Role: {registeredUserRole || 'none'}, User: {user?.id || 'none'}, Processing: {isProcessingRegistration}, Incomplete: {hasIncompleteRegistration}
          </div>
        )}
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Step 1: Registration Form (All Roles) */}
        {(registrationStep === 1 || hasIncompleteRegistration) && (
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
        {registrationStep === 2 && !isProcessingRegistration && !hasIncompleteRegistration && registeredUserRole === 'patient' && (
          <RegistrationPayment 
            onComplete={handlePaymentComplete}
            userInfo={userInfo}
          />
        )}

        {registrationStep === 2 && !isProcessingRegistration && !hasIncompleteRegistration && registeredUserRole !== 'patient' && (
          <RegistrationProgressReport 
            onComplete={handleRegistrationComplete}
            userRole={registeredUserRole}
          />
        )}

        {/* Step 3: Progress (Patients After Payment) */}
        {registrationStep === 3 && !isProcessingRegistration && !hasIncompleteRegistration && registeredUserRole === 'patient' && (
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
