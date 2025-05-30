
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SupabaseAuthUI } from "@/components/auth/SupabaseAuthUI";
import { LucideLoader2 } from "lucide-react";
import { useRegistrationState } from "@/hooks/useRegistrationState";

const Auth = () => {
  const { user, userRole, isLoading, isLoadingRole } = useAuth();
  const navigate = useNavigate();
  const { isUserInActiveRegistration } = useRegistrationState();

  // ONLY redirect users who are fully authenticated AND have roles to dashboard
  // Do NOT redirect users during registration process
  useEffect(() => {
    const handleRedirect = async () => {
      // Don't redirect while still loading
      if (isLoading || isLoadingRole) {
        console.log("Auth page: Still loading auth state, waiting...");
        return;
      }
      
      // If user is in active registration, don't redirect to dashboard
      if (user && isUserInActiveRegistration()) {
        console.log("Auth page: User in active registration, not redirecting to dashboard");
        return;
      }
      
      // Only redirect if user is FULLY authenticated with a role
      // This prevents redirects during registration
      if (user && userRole) {
        console.log("Auth page: User has complete authentication, redirecting to dashboard:", userRole);
        navigate("/dashboard", { replace: true });
        return;
      }
      
      // For all other cases (no user, or user without role), stay on auth page
      console.log("Auth page: User not fully authenticated, staying on auth page");
    };
    
    handleRedirect();
  }, [user, userRole, isLoading, isLoadingRole, navigate, isUserInActiveRegistration]);

  // Show loading state while auth is loading
  if (isLoading || isLoadingRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col items-center justify-center pt-16 md:pt-20">
        <LucideLoader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="mt-4 text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  // Login form for unauthenticated users OR users in registration process
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
            redirectTo={`${window.location.origin}/auth`}
            showLinks={false}
          />
        </div>
      </div>
    </div>
  );
};

export default Auth;
