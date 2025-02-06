
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
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Reset Supabase session
      await supabase.auth.signOut();
      
      toast({
        title: "Forced sign out successful",
        description: "All session data has been cleared.",
      });
      
      // Force page reload
      window.location.reload();
    } catch (error) {
      console.error("Force sign out error:", error);
      toast({
        variant: "destructive",
        title: "Error during force sign out",
        description: "Please try clearing your browser cache and reloading.",
      });
    }
  };

  useEffect(() => {
    let mounted = true;
    
    // Add a timeout to detect stuck loading states
    const timeoutId = setTimeout(() => {
      if (mounted && isLoading) {
        setLoadingTimeout(true);
        // Force clear the session if we're stuck loading
        localStorage.clear();
        sessionStorage.clear();
        supabase.auth.signOut();
        window.location.reload();
        
        toast({
          title: "Session cleared",
          description: "Your session was cleared due to a timeout.",
          variant: "default"
        });
      }
    }, 5000); // 5 seconds timeout

    // Only log session check in development
    if (process.env.NODE_ENV === 'development') {
      const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Index page session check:", {
          hasSession: !!session,
          timestamp: new Date().toISOString()
        });
      };
      checkSession();
    }

    // Only redirect if we have a user and are not loading
    if (user && !isLoading) {
      navigate("/dashboard", { replace: true });
    }

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [user, isLoading, navigate, toast]);

  // Loading overlay with timeout message and force sign out button
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex flex-col items-center justify-center z-40">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#9b87f5] mb-4"></div>
        {loadingTimeout && (
          <div className="text-center px-4 py-2 bg-white rounded-md shadow">
            <p>Loading is taking longer than expected.</p>
            <p>Session data will be cleared automatically...</p>
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
