
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SupabaseAuthUI } from "@/components/auth/SupabaseAuthUI";
import { AuthForm } from "@/components/auth/AuthForm";
import { LucideLoader2 } from "lucide-react";
import { useAuthHandlers } from "@/hooks/useAuthHandlers";
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";

const Auth = () => {
  const { user, isLoading } = useAuth();
  const { handleSignUp, error, loading, setError } = useAuthHandlers();
  const navigate = useNavigate();
  const isRegistration = window.location.pathname.includes('/register');
  const isPasswordReset = window.location.pathname.includes('/update-password');

  // Redirect to dashboard if already logged in and not resetting password
  useEffect(() => {
    if (!isLoading && user && !isPasswordReset) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate, isPasswordReset]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col items-center justify-center pt-16 md:pt-20">
        <LucideLoader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="mt-4 text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  // Show update password form if in password reset mode
  if (isPasswordReset) {
    return <UpdatePasswordForm />;
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
      await handleSignUp(email, password, userType as any, firstName, lastName, patientData);
    } catch (error: any) {
      console.error("Registration error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 pt-16 md:pt-20">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-saas-dark">
          {isRegistration ? 'Create your account' : 'Welcome back'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg shadow-saas-light-purple/20 sm:rounded-lg sm:px-10">
          {isRegistration ? (
            <AuthForm 
              type="register"
              onSubmit={handleFormSubmit}
              error={error}
              loading={loading}
            />
          ) : (
            <SupabaseAuthUI 
              view="sign_in"
              redirectTo={`${window.location.origin}/auth`}
              showLinks={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
