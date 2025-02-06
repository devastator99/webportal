import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, LogIn } from "lucide-react";

interface NavbarProps {
  onForceLogout?: () => void;
}

export const Navbar = ({ onForceLogout }: NavbarProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      console.log("[Navbar] Starting sign out process");
      await signOut();
    } catch (error: any) {
      console.error("[Navbar] Sign out error:", error);
      if (onForceLogout) {
        onForceLogout();
      }
    }
  };

  // Don't show navbar on auth page
  if (location.pathname === "/auth") {
    return null;
  }

  const handleSignIn = () => {
    console.log("[Navbar] Navigating to auth page");
    navigate("/auth", { replace: true });
  };

  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-[#D6BCFA]">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div 
          className="text-2xl font-bold text-[#9b87f5] cursor-pointer" 
          onClick={() => navigate("/")}
        >
          Anubhuti
        </div>
        {!user && (
          <Button 
            onClick={handleSignIn}
            className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white flex items-center gap-2"
          >
            <LogIn className="h-4 w-4" />
            Sign In
          </Button>
        )}
        {user && (
          <Button 
            onClick={handleSignOut}
            variant="outline" 
            className="border-[#9b87f5] text-[#7E69AB] hover:bg-[#E5DEFF] gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        )}
      </div>
    </nav>
  );
};