import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NavbarProps {
  onForceLogout?: () => void;
}

export const Navbar = ({ onForceLogout }: NavbarProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      toast({
        title: "Signing out...",
        description: "Please wait while we sign you out.",
      });
      
      await Promise.race([
        signOut(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Sign out timed out")), 5000)
        )
      ]);
    } catch (error: any) {
      console.error("Error in Navbar signOut:", error);
      
      if (onForceLogout) {
        onForceLogout();
      } else {
        localStorage.clear();
        sessionStorage.clear();
        navigate('/', { replace: true });
        window.location.reload();
      }
      
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: "You have been forcefully signed out due to an error.",
      });
    }
  };

  // Don't show navbar on auth page
  if (location.pathname === "/auth") {
    return null;
  }

  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-[#D6BCFA]">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div 
          className="text-2xl font-bold text-[#9b87f5] cursor-pointer" 
          onClick={() => navigate("/")}
        >
          Anubhuti
        </div>
        <div className="hidden md:flex space-x-8">
          <a href="#features" className="text-[#7E69AB] hover:text-[#9b87f5] transition-colors">Services</a>
          <a href="#testimonials" className="text-[#7E69AB] hover:text-[#9b87f5] transition-colors">Patient Stories</a>
          <a href="#pricing" className="text-[#7E69AB] hover:text-[#9b87f5] transition-colors">Plans</a>
        </div>
        {!user && (
          <Button 
            onClick={() => navigate("/auth")}
            className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white"
          >
            Get Started
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