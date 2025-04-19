
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SupabaseAuthUI } from "@/components/auth/SupabaseAuthUI";
import { AuthForm } from "@/components/auth/AuthForm";
import { LucideLoader2 } from "lucide-react";
import { AuthView } from "@/types/auth";

const Auth = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Extract and validate auth parameters
  const rawView = searchParams.get('view');
  // Ensure view is a valid AuthView type or default to sign_in
  const view: AuthView = rawView as AuthView && ['sign_in', 'sign_up', 'magic_link', 'forgotten_password', 'update_password'].includes(rawView as string) 
    ? (rawView as AuthView) 
    : "sign_in";
  const token = searchParams.get('token') || searchParams.get('access_token');
  const type = searchParams.get('type');
  const isRegistration = window.location.pathname.includes('/register');
  const isPasswordReset = type === 'recovery' || view === 'update_password';

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    // Only redirect if user is authenticated and not in password reset flow
    if (!isLoading && user && !isPasswordReset) {
      timeoutId = setTimeout(() => {
        navigate("/dashboard");
      }, 100);
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user, isLoading, navigate, isPasswordReset]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col items-center justify-center pt-16 md:pt-20">
        <LucideLoader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="mt-4 text-sm text-gray-600">
          {isPasswordReset ? "Preparing password reset..." : "Verifying your authentication..."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 pt-16 md:pt-20">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-saas-dark">
          {isRegistration ? 'Create your account' :
           isPasswordReset ? 'Reset your password' :
           view === 'sign_in' ? 'Welcome back' :
           view === 'forgotten_password' ? 'Reset your password' :
           view === 'update_password' ? 'Set new password' : 'Welcome'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg shadow-saas-light-purple/20 sm:rounded-lg sm:px-10">
          {isRegistration ? (
            <AuthForm 
              type="register"
              onSubmit={async () => {}} // Will be handled by AuthForm's internal logic
              error={null}
              loading={false}
            />
          ) : (
            <SupabaseAuthUI 
              view={isPasswordReset ? "update_password" : view}
              redirectTo={`${window.location.origin}/auth`}
              token={token}
              showLinks={!isPasswordReset}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
