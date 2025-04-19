
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuthHandlers } from "@/hooks/useAuthHandlers";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const LoginDialog = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const { loading, error, handleLogin, handleSignUp, setError } = useAuthHandlers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { resetInactivityTimer } = useAuth();
  const navigate = useNavigate();

  // Handle form submission
  const handleFormSubmit = async (
    email: string, 
    password: string, 
    userType?: string, 
    firstName?: string, 
    lastName?: string,
    patientData?: any
  ) => {
    // Clear any previous errors
    setError(null);
    
    try {
      if (isLoginMode) {
        await handleLogin(email, password);
        setIsDialogOpen(false);
        toast.success('Signed in successfully!');
      } else {
        // For signup, we'll use toast.promise for better feedback
        await toast.promise(
          handleSignUp(email, password, userType as any, firstName, lastName, patientData),
          {
            loading: 'Creating your account...',
            success: () => {
              setIsDialogOpen(false);
              return 'Account created successfully!';
            },
            error: (err) => `Sign up failed: ${err.message || 'Please try again'}`
          }
        );
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      toast.error(`Authentication error: ${error.message || 'Please try again'}`);
    }
  };

  // Handle forgot password - close dialog and redirect to dedicated page
  // Modified to return a Promise<void> to match the expected type
  const handleForgotPassword = async (email: string): Promise<void> => {
    return new Promise<void>(resolve => {
      // First close the dialog explicitly
      setIsDialogOpen(false);
      
      // Then use setTimeout to ensure dialog state is updated before navigation
      setTimeout(() => {
        // Construct the URL with email parameter if provided
        const resetUrl = email 
          ? `/auth?mode=reset&email=${encodeURIComponent(email)}`
          : '/auth?mode=reset';
        
        console.log("Navigating to password reset page:", resetUrl);
        navigate(resetUrl);
        resolve();
      }, 100); // Small delay to ensure dialog closes first
    });
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={(open) => {
      setIsDialogOpen(open);
      if (open) resetInactivityTimer();
    }}>
      <DialogTrigger asChild>
        <Button 
          className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white flex items-center gap-2 shadow-md"
          size="sm"
          onClick={() => resetInactivityTimer()}
        >
          <LogIn className="h-4 w-4" />
          <span className="hidden sm:inline">Sign In</span>
          <span className="sm:hidden">Login</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-800">
        <DialogTitle className="sr-only">
          {isLoginMode ? "Sign In" : "Create an Account"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {isLoginMode ? "Enter your credentials to sign in" : "Fill in the form to create your account"}
        </DialogDescription>
        
        <div className="grid gap-4 py-4">
          <AuthForm
            type={isLoginMode ? "login" : "register"}
            onSubmit={handleFormSubmit}
            onResetPassword={handleForgotPassword}
            error={error}
            loading={loading}
          />
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              resetInactivityTimer();
            }}
            disabled={loading}
          >
            {isLoginMode ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
