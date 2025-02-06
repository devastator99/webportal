import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Testimonials } from "@/components/Testimonials";
import { Pricing } from "@/components/Pricing";
import { Footer } from "@/components/Footer";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function Index() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  const forceSignOut = async () => {
    try {
      // First check if there's an active session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        await supabase.auth.signOut();
      }
      
      // Clear storage after successful sign out
      localStorage.clear();
      sessionStorage.clear();
      
      toast({
        title: "Forced sign out successful",
        description: "All session data has been cleared.",
      });
      
      // Force page reload after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error("Force sign out error:", error);
      
      // Even if sign out fails, clear storage
      localStorage.clear();
      sessionStorage.clear();
      
      toast({
        variant: "destructive",
        title: "Error during force sign out",
        description: "Please try clearing your browser cache and reloading.",
      });
      
      // Force page reload after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Only show loading timeout if we're actually stuck
    const timeoutId = setTimeout(() => {
      if (mounted && isLoading) {
        setLoadingTimeout(true);
      }
    }, 5000); // 5 seconds timeout

    // Only redirect if we have a user and are not loading
    if (user && !isLoading) {
      navigate("/dashboard", { replace: true });
    }

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [user, isLoading, navigate]);

  // Loading overlay with timeout message and force sign out button
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex flex-col items-center justify-center z-40">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#9b87f5] mb-4"></div>
        {loadingTimeout && (
          <div className="text-center px-4 py-2 bg-white rounded-md shadow">
            <p>Loading is taking longer than expected.</p>
            <p>You can try forcing a sign out below if needed.</p>
            <Button 
              onClick={forceSignOut}
              className="mt-4 bg-red-500 hover:bg-red-600 text-white"
            >
              Force Sign Out
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Only render the main content if not authenticated and not loading
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Hero />
      <Features />
      <Testimonials />
      <Pricing />
      <Footer />
    </main>
  );
}