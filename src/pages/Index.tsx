
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Testimonials } from "@/components/Testimonials";
import { Pricing } from "@/components/Pricing";
import { Footer } from "@/components/Footer";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Index() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

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

  return (
    <>
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
