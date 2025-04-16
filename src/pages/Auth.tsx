import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { Input } from "@/components/ui/input";

const Auth = () => {
  const { user, isLoading, userRole, authError, retryRoleFetch } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isResetMode = searchParams.get('reset') === 'true';
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isPasswordResetMode, setIsPasswordResetMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const { 
    loading, 
    error, 
    handleLogin, 
    handleSignUp, 
    handleTestLogin, 
    handleResetPassword,
    handleUpdatePassword,
    setError 
  } = useAuthHandlers();
  const [shouldShowDoctorForm, setShouldShowDoctorForm] = useState(false);

  useEffect(() => {
    console.log("Checking reset parameter, isResetMode:", isResetMode);
    if (isResetMode) {
      setIsPasswordResetMode(true);
      setIsLoginMode(true); // Make sure we're in login mode
      toast.info("Please enter your new password");
    }
  }, [isResetMode]);

  useEffect(() => {
    const checkDoctorProfile = async () => {
      if (user && userRole === "doctor") {
        console.log("Checking doctor profile for:", user.id);
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
          console.log("Doctor profile incomplete, showing form");
          setShouldShowDoctorForm(true);
          return;
        }

        console.log("Doctor profile is complete, redirecting to dashboard");
        navigate("/dashboard");
      } else if (user) {
        console.log("User found in Auth, redirecting to dashboard");
        navigate("/dashboard");
      }
    };

    if (!isLoading) {
      console.log("Auth state resolved:", { user, userRole, authError });
      
      if (user && authError && !userRole) {
        console.log("Detected auth error with user present, trying to fetch role");
        retryRoleFetch();
        toast.info("Attempting to recover your session information...");
      } else if (user) {
        checkDoctorProfile();
      }
    }
  }, [user, userRole, navigate, isLoading, authError, retryRoleFetch]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col items-center justify-center pt-16 md:pt-20">
        <LucideLoader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (user && shouldShowDoctorForm) {
    return (
      <div className="pt-16 md:pt-20">
        <DoctorProfileForm />
      </div>
    );
  }

  if (user && !isPasswordResetMode) {
    return null;
  }

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    
    try {
      await handleUpdatePassword(newPassword);
      toast.success("Password updated successfully! You can now log in.");
    } catch (error: any) {
      console.error("Password update error:", error);
      toast.error(`Failed to update password: ${error.message || "Unknown error"}`);
    }
  };

  const handleFormSubmit = async (
    email: string, 
    password: string, 
    userType?: string, 
    firstName?: string, 
    lastName?: string,
    patientData?: any
  ) => {
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
  };

  const handleForgotPassword = async (email: string) => {
    try {
      await handleResetPassword(email);
    } catch (error: any) {
      console.error("Reset password error:", error);
    }
  };

  if (isPasswordResetMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 pt-16 md:pt-20">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="mt-6 text-center text-3xl font-extrabold text-saas-dark">
              Reset Your Password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your new password below
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
            <form onSubmit={handlePasswordResetSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="mt-1">
                  <Input
                    id="new-password"
                    name="new-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-white/50 backdrop-blur-sm border-purple-200 focus:border-purple-400"
                    minLength={6}
                  />
                </div>
              </div>
              
              <div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#9b87f5] to-[#8B5CF6] hover:from-[#8B5CF6] hover:to-[#7C3AED] text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Password...
                    </span>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

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
            onSubmit={handleFormSubmit}
            onResetPassword={handleForgotPassword}
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
