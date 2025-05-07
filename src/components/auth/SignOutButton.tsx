
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SignOutButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onlyIcon?: boolean;
  onSignOutStart?: () => void;
  onSignOutComplete?: () => void;
}

export const SignOutButton = ({
  variant = "ghost",
  size = "default",
  className,
  onlyIcon = false,
  onSignOutStart,
  onSignOutComplete,
}: SignOutButtonProps) => {
  const { signOut, isSigningOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSigningOut || isLoading) return;
    
    try {
      setIsLoading(true);
      onSignOutStart?.();
      
      await signOut();
      
      // The navigation will be handled by the AuthService
      onSignOutComplete?.();
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("There was a problem signing you out. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const buttonText = isSigningOut || isLoading ? "Signing Out..." : "Sign Out";
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSignOut}
      disabled={isSigningOut || isLoading}
      className={cn(
        "gap-2 font-medium",
        className
      )}
    >
      <LogOut className={cn("h-4 w-4", onlyIcon && "h-5 w-5")} />
      {!onlyIcon && <span>{buttonText}</span>}
    </Button>
  );
};
