
import { lazy, Suspense, useEffect, useState } from "react";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { CollapsibleSection } from "@/components/ui/collapsible-section";

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
  const [visibleSections, setVisibleSections] = useState({
    features: false,
    testimonials: false,
    pricing: false,
    videos: false,
    footer: false
  });
  
  // Track whether video section has been expanded
  const [isVideoSectionExpanded, setIsVideoSectionExpanded] = useState(false);

  // Force logout effect - use a non-blocking approach 
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

  // Set up intersection observers for each section
  useEffect(() => {
    const observerOptions = {
      rootMargin: '100px',
      threshold: 0.1
    };

    const sectionObservers = {} as Record<string, IntersectionObserver>;
    const sections = [
      { id: 'features-section', key: 'features' },
      { id: 'testimonials-section', key: 'testimonials' },
      { id: 'pricing-section', key: 'pricing' },
      { id: 'video-section', key: 'videos' },
      { id: 'footer-section', key: 'footer' }
    ];

    sections.forEach(({ id, key }) => {
      sectionObservers[key] = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          setVisibleSections(prev => ({ ...prev, [key]: true }));
          sectionObservers[key].disconnect();
        }
      }, observerOptions);

      const element = document.getElementById(id);
      if (element) {
        sectionObservers[key].observe(element);
      }
    });

    return () => {
      Object.values(sectionObservers).forEach(observer => {
        observer.disconnect();
      });
    };
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      <Hero />
      
      <div id="features-section" className="min-h-[200px]">
        {visibleSections.features ? (
          <Suspense fallback={<LoadingSpinner />}>
            <Features />
          </Suspense>
        ) : <LoadingSpinner />}
      </div>
      
      <div id="testimonials-section" className="min-h-[200px]">
        {visibleSections.testimonials ? (
          <Suspense fallback={<LoadingSpinner />}>
            <Testimonials />
          </Suspense>
        ) : <LoadingSpinner />}
      </div>
      
      <div id="pricing-section" className="min-h-[200px]">
        {visibleSections.pricing ? (
          <Suspense fallback={<LoadingSpinner />}>
            <Pricing />
          </Suspense>
        ) : <LoadingSpinner />}
      </div>
      
      <div id="video-section" className="container mx-auto px-4 py-16 min-h-[200px]">
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
      
      <div id="footer-section" className="min-h-[200px]">
        {visibleSections.footer ? (
          <Suspense fallback={<LoadingSpinner />}>
            <Footer />
          </Suspense>
        ) : <LoadingSpinner />}
      </div>
    </div>
  );
};

export default LandingPage;
