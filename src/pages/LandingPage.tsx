
import { lazy, Suspense, useEffect, useState } from "react";
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
  const [showVideos, setShowVideos] = useState(false);

  // Force logout effect - using the more aggressive approach
  useEffect(() => {
    if (user) {
      // Show toast immediately
      toast({
        title: "Logging out...",
        description: "Forcefully signing you out of your account",
      });
      
      // Use setTimeout to ensure UI updates before the potentially blocking operation
      setTimeout(async () => {
        try {
          await forceSignOut();
          // Toast will show on page reload
        } catch (error) {
          console.error("Force logout error:", error);
          toast({
            variant: "destructive",
            title: "Error signing out",
            description: "There was a problem signing you out. Please try again.",
          });
        }
      }, 100);
    }
  }, [user, forceSignOut, toast]);

  // Detect when video section is near viewport to show videos
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setShowVideos(true);
          observer.disconnect();
        }
      },
      { 
        rootMargin: "200px" // Load when within 200px of viewport
      }
    );

    const videoSection = document.getElementById("video-section");
    if (videoSection) {
      observer.observe(videoSection);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

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
        {showVideos ? (
          <Suspense fallback={<LoadingSpinner />}>
            <VideoList />
          </Suspense>
        ) : (
          <div className="h-48 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        )}
      </div>
      
      <Suspense fallback={<LoadingSpinner />}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default LandingPage;
