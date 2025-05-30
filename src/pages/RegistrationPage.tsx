
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RegistrationProvider, useRegistration } from '@/contexts/RegistrationContext';
import { IsolatedRegistrationForm } from '@/components/registration/IsolatedRegistrationForm';
import { IsolatedRegistrationPayment } from '@/components/registration/IsolatedRegistrationPayment';
import { IsolatedRegistrationSuccess } from '@/components/registration/IsolatedRegistrationSuccess';
import { LucideLoader2, ArrowLeft, LogOut } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

const RegistrationPageContent = () => {
  const { step, userType, user, isLoading, signOut, clearState } = useRegistration();
  const navigate = useNavigate();

  console.log("RegistrationPage:", { user: user?.id, step, userType });

  const handleSignOut = async () => {
    console.log("RegistrationPage: User requested sign out");
    try {
      clearState();
      await signOut();
      navigate("/auth", { replace: true });
    } catch (error) {
      console.error("RegistrationPage: Error signing out:", error);
      navigate("/auth", { replace: true });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col items-center justify-center pt-16 md:pt-20">
        <LucideLoader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="mt-4 text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  const getStepTitle = () => {
    if (step === 1) return 'Create your account';
    if (step === 2) return 'Complete Payment';
    if (step === 3) return 'Registration Complete';
    return 'Registration';
  };

  console.log("RegistrationPage: Rendering step:", step, "UserType:", userType);

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
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Step 1: Registration Form */}
        {step === 1 && (
          <div className="bg-white py-6 sm:py-8 px-4 shadow-lg shadow-saas-light-purple/20 sm:rounded-lg sm:px-10">
            <ScrollArea className="w-full" maxHeight="65vh">
              <IsolatedRegistrationForm />
            </ScrollArea>
          </div>
        )}
        
        {/* Step 2: Payment - Only for patients */}
        {step === 2 && userType === 'patient' && (
          <div className="bg-white shadow-lg shadow-saas-light-purple/20 sm:rounded-lg">
            <IsolatedRegistrationPayment />
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="bg-white shadow-lg shadow-saas-light-purple/20 sm:rounded-lg">
            <IsolatedRegistrationSuccess />
          </div>
        )}
      </div>
    </div>
  );
};

const RegistrationPage = () => {
  return (
    <RegistrationProvider>
      <RegistrationPageContent />
    </RegistrationProvider>
  );
};

export default RegistrationPage;
