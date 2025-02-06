
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Testimonials } from "@/components/Testimonials";
import { Pricing } from "@/components/Pricing";
import { Footer } from "@/components/Footer";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Index() {
  const { user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    console.log("Index page authentication state:", { 
      isLoading, 
      userEmail: user?.email,
      userId: user?.id,
      userRole: user?.role,
      timestamp: new Date().toISOString(),
      localStorageKeys: Object.keys(localStorage),
      sessionStorageKeys: Object.keys(sessionStorage)
    });

    // If user is authenticated, redirect to dashboard
    if (user && !isLoading) {
      console.log("User is authenticated, redirecting to dashboard");
      navigate("/dashboard", { replace: true });
      return;
    }
  }, [user, isLoading, navigate]);

  const handleForceSignOut = async () => {
    try {
      console.log("Force sign out initiated", {
        timestamp: new Date().toISOString(),
        beforeClear: {
          localStorageKeys: Object.keys(localStorage),
          sessionStorageKeys: Object.keys(sessionStorage)
        }
      });
      
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      console.log("Storage cleared", {
        afterClear: {
          localStorageKeys: Object.keys(localStorage),
          sessionStorageKeys: Object.keys(sessionStorage)
        }
      });
      
      await signOut();
      
      toast({
        title: "Signed out successfully",
        description: "You have been forcefully signed out.",
      });
      
      // Force reload the page
      window.location.reload();
    } catch (error) {
      console.error("Force sign out error:", error);
      // Even if signOut fails, clear storage and reload
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  // Show loading state with force sign out button
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#9b87f5]"></div>
        <Button 
          variant="destructive"
          onClick={handleForceSignOut}
          className="mt-4"
        >
          Force Sign Out
        </Button>
      </div>
    );
  }

  // If not loading and no user, render landing page
  if (!isLoading && !user) {
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

  // This is a fallback return, though it should never be reached
  return null;
}
