
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { RegistrationForm } from '@/components/registration/RegistrationForm';
import { RegistrationPayment } from '@/components/auth/RegistrationPayment';
import { RegistrationSuccess } from '@/components/registration/RegistrationSuccess';
import { LucideLoader2, ArrowLeft, LogOut } from 'lucide-react';
import { useAuthHandlers } from '@/hooks/useAuthHandlers';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const RegistrationPage = () => {
  const { user, userRole, isLoading, signOut } = useAuth();
  const { handleSignUp, error, loading } = useAuthHandlers();
  const navigate = useNavigate();
  
  // Simple step tracking: 1 = form, 2 = payment, 3 = success
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);

  console.log("RegistrationPage:", { user: user?.id, userRole, step, userType });

  // Redirect existing users with roles to dashboard
  useEffect(() => {
    if (user && userRole && !loading) {
      console.log("User has role, redirecting to dashboard");
      navigate('/dashboard', { replace: true });
    }
  }, [user, userRole, loading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col items-center justify-center pt-16 md:pt-20">
        <LucideLoader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="mt-4 text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  const handleFormSubmit = async (
    email: string,
    password: string,
    userType?: string,
    firstName?: string,
    lastName?: string,
    patientData?: any
  ) => {
    try {
      console.log("Form submission started:", { userType });
      
      setUserType(userType!);
      setUserInfo({ firstName, lastName, email });
      
      // Create user without role for patients, with role for others
      const newUser = await handleSignUp(
        email,
        password,
        userType as any,
        firstName,
        lastName,
        patientData,
        userType !== 'patient' // skipRoleCreation for patients
      );
      
      if (newUser) {
        console.log("User created successfully:", newUser.id, "UserType:", userType);
        
        if (userType === 'patient') {
          console.log("Patient account created, moving to payment step");
          setStep(2);
          toast({
            title: "Account Created!",
            description: "Please complete the payment to activate your account.",
          });
        } else {
          console.log("Non-patient account created, showing success");
          setStep(3);
          toast({
            title: "Account Created!",
            description: "Your account has been created successfully.",
          });
        }
      } else {
        throw new Error("Failed to create user account");
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

  const handlePaymentComplete = async () => {
    console.log("Payment completed, triggering backend tasks");
    setStep(3);
    
    try {
      // Trigger backend processing for patient registration
      if (user?.id) {
        const { error } = await supabase.functions.invoke('trigger-registration-notifications', {
          body: { patient_id: user.id }
        });
        
        if (error) {
          console.error("Error triggering backend tasks:", error);
        } else {
          console.log("Backend registration tasks triggered successfully");
        }
      }
    } catch (error) {
      console.error("Exception triggering backend tasks:", error);
    }
    
    toast({
      title: "Payment Complete!",
      description: "Your registration is being processed. Check your email/SMS for login instructions.",
    });
  };

  const handleSuccessComplete = async () => {
    console.log("Registration complete, signing out user");
    await signOut();
    navigate("/auth", { replace: true });
  };

  const getStepTitle = () => {
    if (step === 1) return 'Create your account';
    if (step === 2) return 'Complete Payment';
    if (step === 3) return 'Registration Complete';
    return 'Registration';
  };

  console.log("Rendering step:", step, "UserType:", userType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8 pt-16 md:pt-20 overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
        {/* Navigation */}
        <div className="mb-6 flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/', { replace: true })}
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
        {step === 1 && (
          <div className="bg-white py-6 sm:py-8 px-4 shadow-lg shadow-saas-light-purple/20 sm:rounded-lg sm:px-10">
            <ScrollArea className="w-full" maxHeight="65vh">
              <RegistrationForm 
                onSubmit={handleFormSubmit}
                error={error}
                loading={loading}
              />
            </ScrollArea>
          </div>
        )}
        
        {/* Step 2: Payment - Only for patients */}
        {step === 2 && userType === 'patient' && (
          <div className="bg-white shadow-lg shadow-saas-light-purple/20 sm:rounded-lg">
            <RegistrationPayment 
              onComplete={handlePaymentComplete}
              userInfo={userInfo}
            />
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="bg-white shadow-lg shadow-saas-light-purple/20 sm:rounded-lg">
            <RegistrationSuccess 
              userType={userType}
              onComplete={handleSuccessComplete}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationPage;
