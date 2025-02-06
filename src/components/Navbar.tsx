import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      console.log("Initiating sign out...");
      await signOut();
      console.log("Sign out successful");
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    } catch (error: any) {
      console.error("Error in Navbar signOut:", error);
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message || "An error occurred while signing out.",
      });
    }
  };

  // Don't show navbar on auth page
  if (location.pathname === "/auth") {
    return null;
  }

  const shouldShowAuthButtons = location.pathname !== "/";

  return (
    <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-[#D6BCFA]">
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
        {shouldShowAuthButtons ? (
          !user ? (
            <Button 
              onClick={() => navigate("/auth")} 
              className="bg-[#9b87f5] hover:bg-[#7E69AB]"
            >
              Sign In
            </Button>
          ) : (
            <Button 
              onClick={handleSignOut}
              variant="outline" 
              className="border-[#9b87f5] text-[#7E69AB] hover:bg-[#E5DEFF] gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          )
        ) : (
          <Button 
            onClick={() => navigate("/auth")} 
            className="bg-[#9b87f5] hover:bg-[#7E69AB]"
          >
            Get Started
          </Button>
        )}
      </div>
    </nav>
  );
};