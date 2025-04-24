
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface SignOutButtonProps {
  onSignOutStart?: () => void;
  onSignOutEnd?: () => void;
}

export const SignOutButton = ({ onSignOutStart, onSignOutEnd }: SignOutButtonProps = {}) => {
  const { signOut, resetInactivityTimer } = useAuth();
  const { toast } = useToast();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      if (onSignOutStart) onSignOutStart();
      
      await signOut();
      
      toast({
        title: "Successfully signed out",
        description: "You have been signed out of your account",
      });
      
      // Force redirect to home page
      navigate('/', { replace: true });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: "There was a problem signing you out. Please try again.",
      });
    } finally {
      setIsSigningOut(false);
      if (onSignOutEnd) onSignOutEnd();
    }
  };

  return (
    <Button 
      onClick={() => {
        resetInactivityTimer();
        handleSignOut();
      }}
      variant="outline" 
      className="border-[#9b87f5] text-[#7E69AB] hover:bg-[#E5DEFF] gap-2 font-medium shadow-sm"
      size="sm"
      disabled={isSigningOut}
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
      <span className="sm:hidden">{isSigningOut ? "..." : "Logout"}</span>
    </Button>
  );
};
