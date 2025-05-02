
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const ForceLogoutButton = () => {
  const { forceSignOut, isSigningOut } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleForceLogout = useCallback(async () => {
    if (isSigningOut || isProcessing) return;
    
    setIsProcessing(true);
    try {
      toast.info("Logging out all users...");
      await forceSignOut();
      // Navigation will be handled by AuthService
    } catch (error) {
      console.error("Error during force logout:", error);
      toast.error("There was a problem signing out. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [forceSignOut, isSigningOut, isProcessing]);

  return (
    <Button
      onClick={handleForceLogout}
      variant="destructive"
      className="gap-2 shadow-sm"
      size="sm"
      disabled={isSigningOut || isProcessing}
    >
      <LogOut className="h-4 w-4" />
      <span>{isSigningOut || isProcessing ? "Logging Out..." : "Force Logout"}</span>
    </Button>
  );
};
