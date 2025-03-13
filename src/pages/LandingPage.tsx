
import { lazy, Suspense, useEffect } from "react";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Lazy load non-critical components with proper error handling
const Features = lazy(() => import("@/components/Features").then(module => ({ default: module.Features })));
const Testimonials = lazy(() => import("@/components/Testimonials").then(module => ({ default: module.Testimonials })));
const Pricing = lazy(() => import("@/components/Pricing").then(module => ({ default: module.Pricing })));
const Footer = lazy(() => import("@/components/Footer").then(module => ({ default: module.Footer })));

// Use a simpler import for VideoList to avoid potential issues
const VideoList = lazy(() => import("@/components/videos/VideoList").then(module => ({ default: module.StandaloneVideoList })));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9b87f5]"></div>
  </div>
);

export const LandingPage = () => {
  const { user, forceSignOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Force logout effect - with non-blocking approach
  useEffect(() => {
    let isMounted = true;
    
    if (user) {
      // Show toast
      toast({
        title: "Logging out...",
        description: "Signing you out of your account",
      });
      
      // Use a small timeout to avoid blocking the render
      const timeoutId = setTimeout(() => {
        if (isMounted) {
          forceSignOut().catch(error => {
            console.error("Force logout error:", error);
          });
        }
      }, 100);
      
      return () => {
        isMounted = false;
        clearTimeout(timeoutId);
      };
    }
  }, [user, forceSignOut, toast]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      <Hero />
      
      <Suspense fallback={<LoadingSpinner />}>
        <Features />
      </Suspense>
      
      <Suspense fallback={<LoadingSpinner />}>
        <Testimonials />
      </Suspense>
      
      <Suspense fallback={<LoadingSpinner />}>
        <Pricing />
      </Suspense>
      
      <div id="video-section" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-[#7E69AB] mb-12">
          Knowledge Sharing
        </h2>
        <Suspense fallback={<LoadingSpinner />}>
          <VideoList />
        </Suspense>
      </div>
      
      <Suspense fallback={<LoadingSpinner />}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default LandingPage;
