
import { lazy, Suspense, useEffect, useState, useCallback } from "react";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { CollapsibleSection } from "@/components/ui/collapsible-section";

// Lazy load non-critical components with minimal wrapping
const Features = lazy(() => import("@/components/Features").then(m => ({ default: m.Features })));
const Testimonials = lazy(() => import("@/components/Testimonials").then(m => ({ default: m.Testimonials })));
const Pricing = lazy(() => import("@/components/Pricing").then(m => ({ default: m.Pricing })));
const Footer = lazy(() => import("@/components/Footer").then(m => ({ default: m.Footer })));
const VideoList = lazy(() => import("@/components/videos/VideoList").then(m => ({ default: m.StandaloneVideoList })));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#9b87f5]"></div>
  </div>
);

export const LandingPage = () => {
  const { user, forceSignOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [visibleSections, setVisibleSections] = useState({
    features: false,
    testimonials: false,
    pricing: false,
    videos: false,
    footer: false
  });
  
  // Fix: Handle force logout with try/catch and check if user exists
  useEffect(() => {
    // Only attempt to log out if there's actually a user
    if (user) {
      const handleLogout = async () => {
        try {
          toast({
            title: "Logging out...",
            description: "Signing you out of your account",
          });
          
          await forceSignOut();
        } catch (error) {
          console.error("Force logout error:", error);
        }
      };
      
      // Use a small timeout to avoid blocking initial render
      const timer = setTimeout(handleLogout, 50);
      return () => clearTimeout(timer);
    }
  }, [user, forceSignOut, toast]);

  // Optimized intersection observer setup
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback for browsers without IntersectionObserver support
      setVisibleSections({
        features: true,
        testimonials: true,
        pricing: true,
        videos: true,
        footer: true
      });
      return;
    }

    // Use a single IntersectionObserver instance for better performance
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            
            // Use functional update to avoid stale state
            setVisibleSections(prev => {
              if (sectionId === 'features-section' && !prev.features) {
                return { ...prev, features: true };
              } 
              if (sectionId === 'testimonials-section' && !prev.testimonials) {
                return { ...prev, testimonials: true };
              }
              if (sectionId === 'pricing-section' && !prev.pricing) {
                return { ...prev, pricing: true };
              }
              if (sectionId === 'video-section' && !prev.videos) {
                return { ...prev, videos: true };
              }
              if (sectionId === 'footer-section' && !prev.footer) {
                return { ...prev, footer: true };
              }
              return prev;
            });
            
            // Unobserve to save resources once section is visible
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '200px',
        threshold: 0.01
      }
    );
    
    // Begin observing with a small delay for better initial load performance
    const timer = setTimeout(() => {
      const sections = [
        'features-section', 
        'testimonials-section', 
        'pricing-section', 
        'video-section', 
        'footer-section'
      ];
      
      sections.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          observer.observe(element);
        }
      });
    }, 50);
    
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      <Hero />
      
      <div id="features-section" className="min-h-[20px]">
        {visibleSections.features ? (
          <Suspense fallback={<LoadingSpinner />}>
            <Features />
          </Suspense>
        ) : <div className="h-10"></div>}
      </div>
      
      <div id="testimonials-section" className="min-h-[20px]">
        {visibleSections.testimonials ? (
          <Suspense fallback={<LoadingSpinner />}>
            <Testimonials />
          </Suspense>
        ) : <div className="h-10"></div>}
      </div>
      
      <div id="pricing-section" className="min-h-[20px]">
        {visibleSections.pricing ? (
          <Suspense fallback={<LoadingSpinner />}>
            <Pricing />
          </Suspense>
        ) : <div className="h-10"></div>}
      </div>
      
      <div id="video-section" className="container mx-auto px-4 py-6 min-h-[20px]">
        {visibleSections.videos && (
          <CollapsibleSection 
            title="Knowledge Sharing" 
            className="bg-white dark:bg-gray-800 shadow-md border-[#D6BCFA]"
            defaultOpen={false}
            lazyLoad={true}
          >
            <Suspense fallback={<LoadingSpinner />}>
              <VideoList />
            </Suspense>
          </CollapsibleSection>
        )}
      </div>
      
      <div id="footer-section" className="min-h-[20px]">
        {visibleSections.footer ? (
          <Suspense fallback={<LoadingSpinner />}>
            <Footer />
          </Suspense>
        ) : <div className="h-10"></div>}
      </div>
    </div>
  );
};

export default LandingPage;
