
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SupabaseAuthUI } from "@/components/auth/SupabaseAuthUI";
import { LucideLoader2 } from "lucide-react";
import { EnhancedRegistrationProgress } from "@/components/registration/EnhancedRegistrationProgress";

const Auth = () => {
  const { 
    user, 
    userRole, 
    isLoading, 
    isLoadingRole, 
    isRegistrationComplete, 
    isLoadingRegistrationStatus 
  } = useAuth();
  const navigate = useNavigate();
  
  const [authMode, setAuthMode] = useState<'sign_in' | 'sign_up'>('sign_in');

  // Enhanced redirect logic with registration progress support
  useEffect(() => {
    console.log("Auth page: Current state:", { 
      hasUser: !!user, 
      userRole, 
      isLoading, 
      isLoadingRole,
      isRegistrationComplete,
      isLoadingRegistrationStatus
    });
    
    // Don't redirect while still loading
    if (isLoading || isLoadingRole || isLoadingRegistrationStatus) {
      console.log("Auth page: Still loading, waiting...");
      return;
    }
    
    // If user exists, has a role, AND registration is complete, redirect to dashboard
    if (user && userRole && isRegistrationComplete) {
      console.log("Auth page: User has auth, role, and completed registration - redirecting to dashboard:", userRole);
      navigate("/dashboard", { replace: true });
      return;
    }
    
    // If user exists but no role, log the issue but don't redirect infinitely
    if (user && !userRole) {
      console.log("Auth page: User authenticated but no role found");
      return;
    }
    
    console.log("Auth page: No user or incomplete registration, staying on auth page");
  }, [user, userRole, isLoading, isLoadingRole, isRegistrationComplete, isLoadingRegistrationStatus, navigate]);

  // Show registration progress if user has role but registration is not complete
  const shouldShowRegistrationProgress = user && userRole && !isRegistrationComplete && !isLoadingRegistrationStatus;

  // Show loading while anything is loading
  if (isLoading || isLoadingRole || isLoadingRegistrationStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col items-center justify-center pt-16 md:pt-20">
        <LucideLoader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="mt-4 text-sm text-gray-600">
          {isLoading ? "Loading authentication..." : 
           isLoadingRole ? "Setting up your account..." :
           "Checking registration status..."}
        </p>
      </div>
    );
  }

  // Show registration progress if needed (includes payment flow)
  if (shouldShowRegistrationProgress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 pt-16 md:pt-20">
        <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
          <EnhancedRegistrationProgress 
            onComplete={() => navigate("/dashboard", { replace: true })}
            userRole={userRole}
          />
        </div>
      </div>
    );
  }

  // Show simplified auth form
  return (
    <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 pt-16 md:pt-20">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-saas-dark">
          {authMode === 'sign_in' ? 'Welcome Back' : 'Welcome'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {authMode === 'sign_in' 
            ? 'Sign in to your account' 
            : 'Create your account and start your health journey'
          }
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg shadow-saas-light-purple/20 sm:rounded-lg sm:px-10">
          <SupabaseAuthUI 
            view={authMode}
            redirectTo={`${window.location.origin}/auth`}
            showLinks={true}
          />
          
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setAuthMode(authMode === 'sign_in' ? 'sign_up' : 'sign_in')}
              className="text-sm text-purple-600 hover:text-purple-500 font-medium"
            >
              {authMode === 'sign_in' 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
