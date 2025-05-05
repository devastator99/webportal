
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SupabaseAuthUI } from "@/components/auth/SupabaseAuthUI";
import { AuthForm } from "@/components/auth/AuthForm";
import { LucideLoader2, CheckCircle2 } from "lucide-react";
import { useAuthHandlers } from "@/hooks/useAuthHandlers";
import { RegistrationPayment } from "@/components/auth/RegistrationPayment";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const Auth = () => {
  const { user, userRole, isLoading } = useAuth();
  const { handleSignUp, error, loading, setError } = useAuthHandlers();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [registrationStep, setRegistrationStep] = useState(1);
  const [registeredUser, setRegisteredUser] = useState<any>(null);
  
  const isRegistration = location.pathname.includes('/register');

  // Redirect based on user role with a slight delay to ensure auth state is updated
  useEffect(() => {
    if (!isLoading && user) {
      console.log("Auth page detected logged in user, redirecting...");
      
      // Use setTimeout to ensure state is fully updated
      const redirectTimer = setTimeout(() => {
        if (userRole === 'patient') {
          navigate("/dashboard", { replace: true });
        } else if (userRole) {
          navigate("/dashboard", { replace: true });
        }
      }, 100);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [user, userRole, isLoading, navigate]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col items-center justify-center pt-16 md:pt-20">
        <LucideLoader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="mt-4 text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  // Handle signup form submission
  const handleFormSubmit = async (
    email: string, 
    password: string, 
    userType?: string, 
    firstName?: string, 
    lastName?: string,
    patientData?: any
  ) => {
    try {
      // Fix: Directly assign the returned user
      const user = await handleSignUp(email, password, userType as any, firstName, lastName, patientData);
      
      // If this is a patient registration and we were successful, move to payment step
      if (user && userType === 'patient') {
        setRegisteredUser(user);
        setRegistrationStep(2);
      }
    } catch (error: any) {
      console.error("Registration error:", error);
    }
  };
  
  // When payment is complete, move to final step
  const handlePaymentComplete = () => {
    setRegistrationStep(3);
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
    <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 pt-16 md:pt-20">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-saas-dark">
          {registrationStep === 1 ? 'Create your account' : 
           registrationStep === 2 ? 'Complete registration' : 
           'Registration successful'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {registrationStep === 1 && (
          <div className="bg-white py-8 px-4 shadow-lg shadow-saas-light-purple/20 sm:rounded-lg sm:px-10 max-h-[70vh]">
            <ScrollArea className="h-full max-h-[70vh] pr-4" invisibleScrollbar={true}>
              <AuthForm 
                type="register"
                onSubmit={handleFormSubmit}
                error={error}
                loading={loading}
              />
            </ScrollArea>
          </div>
        )}
        
        {registrationStep === 2 && (
          <RegistrationPayment 
            onComplete={handlePaymentComplete}
            registrationFee={500}
          />
        )}
        
        {registrationStep === 3 && (
          <div className="bg-white py-8 px-4 shadow-lg shadow-saas-light-purple/20 sm:rounded-lg sm:px-10 text-center">
            <div className="mb-6">
              <div className="mx-auto bg-green-100 rounded-full p-3 w-16 h-16 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <h3 className="text-xl font-medium mb-2">Registration Complete!</h3>
            <p className="mb-6 text-gray-600">
              Your care team has been assigned. You can now access all features of AnubhootiHealth.
            </p>
            <Button 
              onClick={() => navigate('/dashboard')}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
