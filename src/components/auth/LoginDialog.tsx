
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuthHandlers } from "@/hooks/useAuthHandlers";
import { useAuth } from "@/contexts/AuthContext";

export const LoginDialog = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const { loading, error, handleLogin, handleSignUp } = useAuthHandlers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { resetInactivityTimer } = useAuth();

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
        <div className="grid gap-4 py-4">
          <AuthForm
            type={isLoginMode ? "login" : "register"}
            onSubmit={isLoginMode ? handleLogin : handleSignUp}
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
