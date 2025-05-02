
import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AuthForm } from "@/components/auth/AuthForm";
import { SupabaseAuthUI } from "@/components/auth/SupabaseAuthUI";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthHandlers } from "@/hooks/useAuthHandlers";
import { PatientData } from "@/hooks/useAuthHandlers";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import '../styles/glass.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: "login" | "register";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialView = "login",
}) => {
  const [view, setView] = useState<"login" | "register">(initialView);
  const { handleSignUp, error, loading, setError } = useAuthHandlers();
  const location = useLocation();
  const navigate = useNavigate();

  // Form submission handler
  const handleFormSubmit = async (
    email: string,
    password: string,
    userType?: string,
    firstName?: string,
    lastName?: string,
    patientData?: PatientData
  ) => {
    try {
      if (view === "register") {
        await handleSignUp(email, password, userType as any, firstName, lastName, patientData);
        // After successful registration, user will be logged in automatically
        // and AuthContext will handle the redirect
      }
      // For login, the SupabaseAuthUI handles the submission
    } catch (error: any) {
      console.error("Authentication error:", error);
    }
  };

  // Switch between login and register views
  const toggleView = () => {
    setView(view === "login" ? "register" : "login");
    setError(null); // Clear any previous errors when switching views
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass-dialog border-0 p-0 overflow-hidden max-w-md w-full">
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-2 z-10 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <motion.div
            className="p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-2xl font-bold text-center mb-6">
              {view === "login" ? "Welcome Back" : "Create Your Account"}
            </h1>
            
            {view === "login" ? (
              <SupabaseAuthUI
                view="sign_in"
                redirectTo={`${window.location.origin}/dashboard`}
                showLinks={false}
              />
            ) : (
              <AuthForm
                type="register"
                onSubmit={handleFormSubmit}
                error={error}
                loading={loading}
              />
            )}
            
            <div className="mt-6 text-center">
              <button
                onClick={toggleView}
                className="text-sm font-medium text-purple-600 hover:text-purple-500"
              >
                {view === "login"
                  ? "Don't have an account? Register now"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
