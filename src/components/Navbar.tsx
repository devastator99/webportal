import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

export const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      // Don't navigate here - let the AuthContext handle navigation
      // The AuthContext's onAuthStateChange will detect the sign out
      // and handle the navigation automatically
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-[#D6BCFA]">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-[#9b87f5]">Anubhuti</div>
        <div className="hidden md:flex space-x-8">
          <a href="#features" className="text-[#7E69AB] hover:text-[#9b87f5] transition-colors">Services</a>
          <a href="#testimonials" className="text-[#7E69AB] hover:text-[#9b87f5] transition-colors">Patient Stories</a>
          <a href="#pricing" className="text-[#7E69AB] hover:text-[#9b87f5] transition-colors">Plans</a>
        </div>
        {user ? (
          <Button onClick={handleSignOut} variant="outline" className="border-[#9b87f5] text-[#7E69AB] hover:bg-[#E5DEFF]">
            Sign Out
          </Button>
        ) : (
          <Button onClick={() => navigate("/auth")} className="bg-[#9b87f5] hover:bg-[#7E69AB]">
            Sign In
          </Button>
        )}
      </div>
    </nav>
  );
};