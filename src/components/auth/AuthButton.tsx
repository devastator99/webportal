
import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState } from "react";

export const AuthButton = () => {
  const { user, signOut, resetInactivityTimer } = useAuth();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    
    try {
      setIsSigningOut(true);
      resetInactivityTimer();
      await signOut();
      // The navigation will be handled by the AuthContext
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("There was a problem signing you out. Please try again.");
      setIsSigningOut(false);
    }
  };

  if (user) {
    return (
      <Button 
        onClick={handleSignOut}
        variant="outline" 
        className="auth-button border-[#9b87f5] text-[#7E69AB] hover:bg-[#E5DEFF] gap-2 font-medium"
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
      onClick={() => navigate("/auth")}
      variant="outline"
      className="auth-button border-[#9b87f5] text-[#7E69AB] hover:bg-[#E5DEFF] gap-2 font-medium"
      size="sm"
    >
      <LogIn className="h-4 w-4" />
      <span className="hidden sm:inline">Sign In</span>
      <span className="sm:hidden">Login</span>
    </Button>
  );
};
