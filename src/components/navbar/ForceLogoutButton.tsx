
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const ForceLogoutButton = () => {
  const { forceSignOut } = useAuth();
  const { toast } = useToast();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleForceLogout = async () => {
    if (isSigningOut) return;
    
    try {
      setIsSigningOut(true);
      toast({
        title: "Logging out...",
        description: "Forcefully signing you out of your account",
      });
      
      await forceSignOut();
      
      // This toast might not be seen due to redirect
      toast({
        title: "Logged out",
        description: "You have been successfully signed out",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: "There was a problem signing you out. Please try again.",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <Button
      onClick={handleForceLogout}
      variant="destructive"
      className="gap-2 shadow-sm"
      size="sm"
      disabled={isSigningOut}
    >
      <LogOut className="h-4 w-4" />
      <span>{isSigningOut ? "Logging Out..." : "Force Logout"}</span>
    </Button>
  );
};
