import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuthHandlers } from "@/hooks/useAuthHandlers";
import { TestLoginButtons } from "@/components/auth/TestLoginButtons";
import { Button } from "@/components/ui/button";

const Auth = () => {
  const { user, isInitialized } = useAuth();
  const navigate = useNavigate();
  const { loading, error, handleLogin, handleSignUp, handleTestLogin } = useAuthHandlers();
  const [isLoginMode, setIsLoginMode] = useState(true);

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  if (!isInitialized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isLoginMode ? "Welcome back" : "Create your account"}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isLoginMode ? "Sign in to your account" : "Sign up for a new account"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {isLoginMode ? (
            <>
              <AuthForm
                type="login"
                onSubmit={handleLogin}
                error={error}
                loading={loading}
              />
              
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      Or continue with test accounts
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <TestLoginButtons 
                    onTestLogin={handleTestLogin} 
                    loading={loading} 
                  />
                </div>
              </div>
            </>
          ) : (
            <AuthForm
              type="register"
              onSubmit={handleSignUp}
              error={error}
              loading={loading}
            />
          )}
          
          <div className="mt-6">
            <Button
              type="button"
              variant="ghost"
              className="w-full text-[#7E69AB]"
              onClick={() => setIsLoginMode(!isLoginMode)}
              disabled={loading}
            >
              {isLoginMode ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;