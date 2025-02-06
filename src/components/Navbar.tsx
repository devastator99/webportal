import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
      console.log("[Navbar] Starting sign out process");
      
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
      console.error("[Navbar] Sign out error:", error);
      
      if (onForceLogout) {
        console.log("[Navbar] Initiating force logout");
        onForceLogout();
      } else {
        console.log("[Navbar] Fallback logout cleanup");
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
    console.log("[Navbar] On auth page, hiding navbar");
    return null;
  }

  const handleSignIn = async () => {
    console.log("[Navbar] Sign In clicked, checking current session");
    
    try {
      // First check if there's any existing session
      const { data: { session } } = await supabase.auth.getSession();
      console.log("[Navbar] Current session state:", {
        hasSession: !!session,
        sessionUser: session?.user?.email,
        pathname: location.pathname,
        timestamp: new Date().toISOString()
      });

      // Clear any existing auth state
      if (session) {
        console.log("[Navbar] Existing session found, clearing it");
        await supabase.auth.signOut();
      }
      
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
      
      console.log("[Navbar] Navigating to /auth");
      navigate("/auth", { replace: true });
      
    } catch (error) {
      console.error("[Navbar] Error during sign in preparation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to prepare for sign in. Please try again.",
      });
    }
  };

  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-[#D6BCFA]">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div 
          className="text-2xl font-bold text-[#9b87f5] cursor-pointer" 
          onClick={() => {
            console.log("[Navbar] Logo clicked, navigating to /");
            navigate("/");
          }}
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