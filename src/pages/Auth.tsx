
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

const Auth = () => {
  const { user, isLoading, userRole } = useAuth();
  const navigate = useNavigate();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const { loading, error, handleLogin, handleSignUp, handleTestLogin } = useAuthHandlers();
  const [shouldShowDoctorForm, setShouldShowDoctorForm] = useState(false);

  useEffect(() => {
    const checkDoctorProfile = async () => {
      // If user is logged in and is a doctor
      if (user && userRole === "doctor") {
        console.log("Checking doctor profile for:", user.id);
        // Check if doctor profile is complete
        const { data, error } = await supabase
          .from("profiles")
          .select("specialty, visiting_hours, clinic_location")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error checking doctor profile:", error);
          return;
        }

        // If profile is incomplete (missing required fields), show doctor form
        if (!data.specialty || !data.visiting_hours || !data.clinic_location) {
          console.log("Doctor profile incomplete, showing form");
          setShouldShowDoctorForm(true);
          return;
        }

        // If profile is complete, redirect to dashboard
        console.log("Doctor profile is complete, redirecting to dashboard");
        navigate("/dashboard");
      } else if (user) {
        // Non-doctor users go straight to dashboard
        console.log("User found in Auth, redirecting to dashboard");
        navigate("/dashboard");
      }
    };

    if (!isLoading) {
      console.log("Auth state resolved:", { user, userRole });
      if (user) {
        checkDoctorProfile();
      }
    }
  }, [user, userRole, navigate, isLoading]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saas-light-purple to-white flex flex-col items-center justify-center">
        <LucideLoader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // If user is a doctor who needs to complete profile, show the doctor profile form
  if (user && shouldShowDoctorForm) {
    return <DoctorProfileForm />;
  }

  // If user is logged in, useEffect will handle redirect (or has already shown doctor form)
  if (user) {
    return null;
  }

  // Handle login with or without patientData
  const handleFormSubmit = async (
    email: string, 
    password: string, 
    userType?: string, 
    firstName?: string, 
    lastName?: string,
    patientData?: any
  ) => {
    console.log("Form submitted with:", { email, userType, firstName, lastName });
    console.log("Patient data:", patientData);
    
    if (isLoginMode) {
      return handleLogin(email, password);
    } else {
      try {
        await handleSignUp(
          email, 
          password, 
          userType as any, 
          firstName, 
          lastName,
          patientData
        );
        
        toast("Account created successfully!");
      } catch (error) {
        console.error("Sign up error:", error);
      }
    }
  };

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
