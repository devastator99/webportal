
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuthHandlers } from "@/hooks/useAuthHandlers";
import { TestLoginButtons } from "@/components/auth/TestLoginButtons";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LucideLoader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DoctorProfileForm } from "@/components/auth/DoctorProfileForm";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PasswordResetForm } from "@/components/auth/PasswordResetForm";
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";

const Auth = () => {
  const { user, isLoading, userRole, authError, retryRoleFetch } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showPasswordResetForm, setShowPasswordResetForm] = useState(false);
  const [isPasswordResetMode, setIsPasswordResetMode] = useState(false);
  const { 
    loading, 
    error, 
    handleLogin, 
    handleSignUp, 
    handleTestLogin,
    setError,
    handleResetPassword,
    handleUpdatePassword
  } = useAuthHandlers();
  const [shouldShowDoctorForm, setShouldShowDoctorForm] = useState(false);

  // Check for password reset hash in URL
  useEffect(() => {
    const checkForPasswordReset = () => {
      const hash = window.location.hash;
      console.log("URL hash:", hash);
      
      // Check if hash contains access_token and type=recovery
      if (hash && hash.includes('type=recovery') && hash.includes('access_token=')) {
        console.log("Password reset hash detected in URL");
        setIsPasswordResetMode(true);
      }
    };
    
    checkForPasswordReset();
  }, []);

  useEffect(() => {
    const isResetSent = searchParams.get('reset_sent') === 'true';
    const isRecoveryMode = searchParams.get('type') === 'recovery';
    const isResetMode = searchParams.get('mode') === 'reset';
    const emailParam = searchParams.get('email');
    
    // Also check URL hash for type=recovery
    const urlHash = window.location.hash;
    const hashContainsRecovery = urlHash && urlHash.includes('type=recovery');
    
    if (hashContainsRecovery) {
      console.log("Recovery mode detected in URL hash");
      setIsPasswordResetMode(true);
    }
    
    if (isResetSent) {
      setResetEmailSent(true);
      toast.success("Password reset link was sent to your email");
    }
    
    if (isRecoveryMode) {
      console.log("Recovery mode detected in URL params");
      setIsPasswordResetMode(true);
    }

    if (isResetMode) {
      console.log("Reset mode detected in URL params, showing password reset form");
      setShowPasswordResetForm(true);
      
      if (emailParam) {
        console.log("Email parameter found:", emailParam);
      }
    }
  }, [location, searchParams]);

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
      } else if (user && !isPasswordResetMode && !searchParams.get('type')) {
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
      } else if (user && !isPasswordResetMode && !searchParams.get('type')) {
        checkDoctorProfile();
      }
    }
  }, [user, userRole, navigate, isLoading, authError, retryRoleFetch, searchParams, isPasswordResetMode]);

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

  if (user && !isPasswordResetMode && !searchParams.get('type')) {
    return null;
  }

  if (isPasswordResetMode || searchParams.get('type') === 'recovery') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 pt-16 md:pt-20">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-saas-dark">
            Reset Your Password
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

  if (resetEmailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 pt-16 md:pt-20">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="mt-6 text-center text-3xl font-extrabold text-saas-dark">
              Check Your Email
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
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-800">Email Sent</AlertTitle>
              <AlertDescription className="text-green-700">
                We've sent a password reset link to your email address. Please check both your inbox and spam folders.
              </AlertDescription>
            </Alert>
            
            <div className="text-center mt-4 space-y-4">
              <p className="text-sm text-gray-600">
                The link will expire in 1 hour. If you don't see the email, check your spam folder or request a new link.
              </p>
              
              <Button
                type="button"
                variant="outline"
                className="w-full mt-4"
                onClick={() => {
                  setResetEmailSent(false);
                  navigate('/auth');
                }}
              >
                Back to Login
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (searchParams.get('mode') === 'reset' || showPasswordResetForm) {
    const emailParam = searchParams.get('email') || '';
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 pt-16 md:pt-20">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-saas-dark">
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email to receive a password reset link
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-lg shadow-saas-light-purple/20 sm:rounded-lg sm:px-10">
            <PasswordResetForm initialEmail={emailParam} />
          </div>
        </div>
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
                  setShowPasswordResetForm(true);
                  
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
