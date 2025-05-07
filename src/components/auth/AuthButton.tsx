
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import '@/styles/glass.css';
import { SignOutButton } from "./SignOutButton";

interface AuthButtonProps {
  openAuthModal?: (view: 'login' | 'register') => void;
}

export const AuthButton: React.FC<AuthButtonProps> = ({ openAuthModal }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  // Handle navigation to auth page or open auth modal
  const handleSignIn = () => {
    if (openAuthModal) {
      openAuthModal('login');
    } else {
      navigate("/auth");
    }
  };

  // Custom styling for landing page
  const buttonClassesForLanding = isLandingPage 
    ? "bg-white/10 backdrop-blur-md border-white text-white hover:bg-white/20" 
    : "border-[#9b87f5] text-[#7E69AB] hover:bg-[#E5DEFF]";

  if (user) {
    return (
      <SignOutButton 
        variant="outline"
        size="sm" 
        className={`auth-button gap-2 font-medium ${buttonClassesForLanding}`}
      />
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
