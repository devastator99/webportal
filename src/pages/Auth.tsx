import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SupabaseAuthUI } from "@/components/auth/SupabaseAuthUI";
import { AuthForm } from "@/components/auth/AuthForm";
import { LucideLoader2 } from "lucide-react";
import { useAuthHandlers } from "@/hooks/useAuthHandlers";
import { toast } from "sonner";
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";

const Auth = () => {
  const { user, isLoading } = useAuth();
  const { handleSignUp, error, loading, setError } = useAuthHandlers();
  const navigate = useNavigate();
  const isRegistration = window.location.pathname.includes('/register');
  const searchParams = new URLSearchParams(window.location.search);
  const view = searchParams.get('view');

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (!isLoading && user && !view) {
      timeoutId = setTimeout(() => {
        navigate("/dashboard");
      }, 100);
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user, isLoading, navigate, view]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col items-center justify-center pt-16 md:pt-20">
        <LucideLoader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="mt-4 text-sm text-gray-600">
          Verifying your authentication...
        </p>
      </div>
    );
  }

  // Show update password form if view is update_password
  if (view === 'update_password') {
    return <UpdatePasswordForm />;
  }

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

const handleFormSubmit = async (
  email: string, 
  password: string, 
  userType?: string, 
  firstName?: string, 
  lastName?: string,
  patientData?: any
) => {
  try {
    await toast.promise(
      handleSignUp(email, password, userType as any, firstName, lastName, patientData),
      {
        loading: 'Creating your account...',
        success: 'Account created successfully! Redirecting to dashboard...',
        error: (err) => `Registration failed: ${err.message || 'Please try again'}`
      }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
  }
};

export default Auth;
