
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

export default function Index() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    // Add a timeout to detect stuck loading states
    const timeoutId = setTimeout(() => {
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
    }, 5000); // 5 seconds timeout

    // Check current session on mount
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Index page session check:", {
        hasSession: !!session,
        timestamp: new Date().toISOString()
      });
    };
    
    checkSession();

    console.log("Index page authentication state:", { 
      isLoading, 
      userEmail: user?.email,
      userId: user?.id,
      userRole: user?.role,
      timestamp: new Date().toISOString(),
      localStorageKeys: Object.keys(localStorage),
      sessionStorageKeys: Object.keys(sessionStorage)
    });

    if (user && !isLoading) {
      console.log("User is authenticated, redirecting to dashboard");
      navigate("/dashboard", { replace: true });
      return;
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [user, isLoading, navigate, toast]);

  // Loading overlay with timeout message
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex flex-col items-center justify-center z-40">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#9b87f5] mb-4"></div>
        {loadingTimeout && (
          <div className="text-center px-4 py-2 bg-white rounded-md shadow">
            <p>Loading is taking longer than expected.</p>
            <p>Clearing session data...</p>
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
