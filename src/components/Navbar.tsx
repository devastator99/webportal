import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-saas-purple">SaaSLogo</div>
        <div className="hidden md:flex space-x-8">
          <a href="#features" className="text-saas-dark hover:text-saas-purple transition-colors">Features</a>
          <a href="#testimonials" className="text-saas-dark hover:text-saas-purple transition-colors">Testimonials</a>
          <a href="#pricing" className="text-saas-dark hover:text-saas-purple transition-colors">Pricing</a>
        </div>
        {user ? (
          <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
        ) : (
          <Button onClick={() => navigate("/auth")} className="bg-saas-purple hover:bg-saas-purple/90">
            Sign In
          </Button>
        )}
      </div>
    </nav>
  );
};