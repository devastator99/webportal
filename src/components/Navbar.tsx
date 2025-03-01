
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, LogIn } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuthHandlers } from "@/hooks/useAuthHandlers";

export const Navbar = () => {
  const { user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const { loading, error, handleLogin, handleSignUp } = useAuthHandlers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  // Check if we're on the dashboard page
  const isDashboardPage = location.pathname === '/dashboard';

  useEffect(() => {
    if (user && !isLoading) {
      navigate('/dashboard');
      setIsDialogOpen(false);
    }
  }, [user, isLoading, navigate]);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
    } catch (error) {
      console.error("Sign out error in Navbar:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  if (isLoading && !isSigningOut) {
    return null;
  }

  return (
    <nav className="fixed top-0 w-full bg-white/90 dark:bg-black/90 backdrop-blur-md z-50 border-b border-[#D6BCFA] shadow-sm">
      <div className="container mx-auto px-4 py-2.5 flex justify-between items-center">
        <div 
          className="text-xl sm:text-2xl font-bold text-[#9b87f5] cursor-pointer" 
          onClick={() => navigate("/")}
        >
          Anubhuti
        </div>
        {!user && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white flex items-center gap-2 shadow-md"
                size="sm"
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
                  onClick={() => setIsLoginMode(!isLoginMode)}
                  disabled={loading}
                >
                  {isLoginMode ? "Need an account? Sign up" : "Already have an account? Sign in"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
        {user && (
          <Button 
            onClick={handleSignOut}
            variant="outline" 
            className="border-[#9b87f5] text-[#7E69AB] hover:bg-[#E5DEFF] gap-2 font-medium shadow-sm"
            size="sm"
            disabled={isSigningOut}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
            <span className="sm:hidden">{isSigningOut ? "..." : "Logout"}</span>
          </Button>
        )}
      </div>
    </nav>
  );
};
