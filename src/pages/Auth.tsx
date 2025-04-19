
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuthHandlers } from "@/hooks/useAuthHandlers";
import { TestLoginButtons } from "@/components/auth/TestLoginButtons";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LucideLoader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DoctorProfileForm } from "@/components/auth/DoctorProfileForm";
import { toast } from "sonner";
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";

const Auth = () => {
  const { user, isLoading, userRole } = useAuth();
  const navigate = useNavigate();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [shouldShowDoctorForm, setShouldShowDoctorForm] = useState(false);
  const { loading, error, handleLogin, handleSignUp, handleTestLogin: testLoginHandler, setError, handleResetPassword } = useAuthHandlers();
  const location = useLocation();

  // Check if we're in password update mode based on URL
  const isPasswordUpdateMode = location.pathname === '/auth/update-password' || 
                             new URLSearchParams(location.search).get('type') === 'recovery' ||
                             window.location.hash.includes('type=recovery');

  useEffect(() => {
    console.log("Auth page rendered with path:", location.pathname);
    console.log("Is password update mode:", isPasswordUpdateMode);
    console.log("Current URL:", window.location.href);
    
    const checkDoctorProfile = async () => {
      if (user && userRole === "doctor") {
        const { data, error } = await supabase
          .from("profiles")
          .select("specialty, visiting_hours, clinic_location")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error checking doctor profile:", error);
          return;
        }

        if (!data.specialty || !data.visiting_hours || !data.clinic_location) {
          setShouldShowDoctorForm(true);
          return;
        }

        navigate("/dashboard");
      } else if (user && !isPasswordUpdateMode) {
        navigate("/dashboard");
      }
    };

    if (!isLoading) {
      checkDoctorProfile();
    }
  }, [user, userRole, navigate, isLoading, isPasswordUpdateMode, location]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col items-center justify-center pt-16 md:pt-20">
        <LucideLoader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (isPasswordUpdateMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 pt-16 md:pt-20">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-saas-dark">
            Set New Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-lg shadow-saas-light-purple/20 sm:rounded-lg sm:px-10">
            <UpdatePasswordForm />
          </div>
        </div>
      </div>
    );
  }

  if (user && !isPasswordUpdateMode) {
    return null;
  }

  // Handle test login using the imported function
  const handleTestLogin = async (userType: 'doctor' | 'patient' | 'nutritionist' | 'admin') => {
    try {
      await testLoginHandler(userType);
      toast.success('Logged in successfully!');
    } catch (error: any) {
      console.error("Test login error:", error);
      toast.error(`Login failed: ${error.message || 'Please try again'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 pt-16 md:pt-20">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mt-6 text-center text-3xl font-extrabold text-saas-dark">
            {isLoginMode ? "Welcome back" : "Create your account"}
          </h2>
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
            onSubmit={
              async (email, password, userType, firstName, lastName, patientData) => {
                console.log("Form submitted with:", { email, userType, firstName, lastName });
                
                if (patientData) {
                  console.log("Patient data received:", patientData);
                }
                
                setError(null);
                
                if (isLoginMode) {
                  try {
                    await handleLogin(email, password);
                    toast.success('Logged in successfully!');
                  } catch (error: any) {
                    console.error("Login error:", error);
                    toast.error(`Login failed: ${error.message || 'Please try again'}`);
                  }
                } else {
                  try {
                    await toast.promise(
                      handleSignUp(email, password, userType as any, firstName, lastName, patientData),
                      {
                        loading: 'Creating your account...',
                        success: 'Account created successfully!',
                        error: (err) => `Sign up failed: ${err.message || 'Please try again'}`
                      }
                    );
                  } catch (error: any) {
                    console.error("Sign up error:", error);
                    toast.error(`Sign up failed: ${error.message || 'Please try again'}`);
                  }
                }
              }
            }
            onResetPassword={(email) => {
              return new Promise<void>((resolve, reject) => {
                try {
                  if (email) {
                    handleResetPassword(email)
                      .then(() => resolve())
                      .catch(error => reject(error));
                  } else {
                    resolve();
                  }
                } catch (error) {
                  reject(error);
                }
              });
            }}
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
