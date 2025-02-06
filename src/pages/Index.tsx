
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
import { LogOut } from "lucide-react";

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
      
      window.location.reload();
    } catch (error) {
      console.error("Force sign out error:", error);
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  // Force sign out button now rendered at the top level, outside of any conditions
  return (
    <>
      {/* Force Sign Out button - always visible */}
      <div className="fixed top-20 right-4 z-[9999] bg-destructive rounded-md shadow-lg">
        <Button 
          variant="destructive"
          onClick={handleForceSignOut}
          className="flex items-center gap-2 !bg-destructive hover:!bg-destructive/90"
        >
          <LogOut className="h-4 w-4" />
          Force Sign Out
        </Button>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#9b87f5]"></div>
        </div>
      )}

      {/* Main content */}
      <main className="min-h-screen flex flex-col bg-white">
        <Hero />
        <Features />
        <Testimonials />
        <Pricing />
        <Footer />
      </main>
    </>
  );
}
