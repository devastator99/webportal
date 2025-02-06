import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuthHandlers } from "@/hooks/useAuthHandlers";
import { TestLoginButtons } from "@/components/auth/TestLoginButtons";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const Auth = () => {
  const { user, isInitialized } = useAuth();
  const navigate = useNavigate();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const { loading, error, handleLogin, handleSignUp, handleTestLogin } = useAuthHandlers();

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  if (!isInitialized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mt-6 text-center text-3xl font-extrabold text-saas-dark">
            {isLoginMode ? "Welcome back" : "Create your account"}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isLoginMode ? "Sign in to your account" : "Sign up for a new account"}
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-4 shadow-lg shadow-saas-light-purple/20 sm:rounded-lg sm:px-10">
          <AuthForm
            type={isLoginMode ? "login" : "register"}
            onSubmit={isLoginMode ? handleLogin : handleSignUp}
            error={error}
            loading={loading}
          />
          
          {isLoginMode && (
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
          )}
          
          <div className="mt-6">
            <Button
              type="button"
              variant="ghost"
              className="w-full text-saas-purple hover:text-saas-purple/90 hover:bg-saas-light-purple/50"
              onClick={() => setIsLoginMode(!isLoginMode)}
              disabled={loading}
            >
              {isLoginMode ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;