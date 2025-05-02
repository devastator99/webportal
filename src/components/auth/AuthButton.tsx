
import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useCallback } from "react";
import '../styles/glass.css';

interface AuthButtonProps {
  openAuthModal?: (view: 'login' | 'register') => void;
}

export const AuthButton: React.FC<AuthButtonProps> = ({ openAuthModal }) => {
  const { user, signOut, resetInactivityTimer, isSigningOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  // Handle sign-out with proper error handling
  const handleSignOut = useCallback(async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isSigningOut) return;
    
    try {
      resetInactivityTimer();
      await signOut();
      // The navigation will be handled by the AuthService
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("There was a problem signing you out. Please try again.");
    }
  }, [isSigningOut, resetInactivityTimer, signOut]);

  // Handle navigation to auth page or open auth modal
  const handleSignIn = useCallback(() => {
    if (openAuthModal) {
      openAuthModal('login');
    } else {
      navigate("/auth");
    }
  }, [navigate, openAuthModal]);

  // Custom styling for landing page
  const buttonClassesForLanding = isLandingPage 
    ? "bg-white/10 backdrop-blur-md border-white text-white hover:bg-white/20" 
    : "border-[#9b87f5] text-[#7E69AB] hover:bg-[#E5DEFF]";

  if (user) {
    return (
      <Button 
        onClick={handleSignOut}
        variant="outline" 
        className={`auth-button gap-2 font-medium ${buttonClassesForLanding}`}
        size="sm"
        disabled={isSigningOut}
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
        <span className="sm:hidden">{isSigningOut ? "..." : "Logout"}</span>
      </Button>
    );
  }

  return (
    <Button
      onClick={handleSignIn}
      variant="outline"
      className={`auth-button gap-2 font-medium ${buttonClassesForLanding}`}
      size="sm"
    >
      <LogIn className="h-4 w-4" />
      <span className="hidden sm:inline">Sign In</span>
      <span className="sm:hidden">Login</span>
    </Button>
  );
};
