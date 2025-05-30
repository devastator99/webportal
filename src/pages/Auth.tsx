
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SupabaseAuthUI } from "@/components/auth/SupabaseAuthUI";
import { LucideLoader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Auth = () => {
  const { user, userRole, isLoading, isLoadingRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isCheckingRegistrationStatus, setIsCheckingRegistrationStatus] = useState(false);

  // Helper function to check if user is in active registration
  const isUserInActiveRegistration = (): boolean => {
    const registrationStep = localStorage.getItem('registration_step');
    const registrationRole = localStorage.getItem('registration_user_role');
    return !!(registrationStep && registrationRole);
  };

  // Enhanced redirect logic for authenticated users - respects registration flow
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
      
      console.log("Auth page detected logged in user. Role:", userRole);
      
      // Check if user is in active registration flow
      if (isUserInActiveRegistration()) {
        console.log("User in active registration, redirecting to /register");
        navigate("/register", { replace: true });
        return;
      }
      
      // For users with roles, redirect to dashboard
      if (userRole) {
        console.log("User has role, redirecting to dashboard:", userRole);
        navigate("/dashboard", { replace: true });
        return;
      }
      
      // User has no role and no active registration - redirect to registration
      if (user && !userRole && !isUserInActiveRegistration()) {
        console.log("User has no role and no active registration, redirecting to registration");
        navigate("/register", { replace: true });
        return;
      }
    };
    
    handleRedirect();
  }, [user, userRole, isLoading, isLoadingRole, navigate, isCheckingRegistrationStatus]);

  // Show loading state while auth is loading
  if (isLoading || isLoadingRole || isCheckingRegistrationStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col items-center justify-center pt-16 md:pt-20">
        <LucideLoader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="mt-4 text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  // Login form for unauthenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 pt-16 md:pt-20">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-saas-dark">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <button
            onClick={() => navigate('/register')}
            className="font-medium text-purple-600 hover:text-purple-500"
          >
            create a new account
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg shadow-saas-light-purple/20 sm:rounded-lg sm:px-10">
          <SupabaseAuthUI 
            view="sign_in"
            redirectTo={`${window.location.origin}/dashboard`}
            showLinks={false}
          />
        </div>
      </div>
    </div>
  );
};

export default Auth;
