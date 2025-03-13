
import { lazy, Suspense, useEffect, useState } from "react";
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
  <div className="flex items-center justify-center p-6">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9b87f5]"></div>
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
  
  // Simplified force logout effect
  useEffect(() => {
    if (user) {
      toast({
        title: "Logging out...",
        description: "Signing you out of your account",
      });
      
      // Use setTimeout to avoid blocking rendering
      setTimeout(() => {
        forceSignOut().catch(error => {
          console.error("Force logout error:", error);
        });
      }, 100);
    }
  }, [user, forceSignOut, toast]);

  // Simplify intersection observer to reduce overhead
  useEffect(() => {
    // Only observe elements once the component is fully mounted
    const timer = setTimeout(() => {
      const observerOptions = {
        rootMargin: '150px', // Load a bit earlier
        threshold: 0.01 // Very small threshold for quicker triggering
      };
      
      const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            if (sectionId === 'features-section') {
              setVisibleSections(prev => ({ ...prev, features: true }));
            } else if (sectionId === 'testimonials-section') {
              setVisibleSections(prev => ({ ...prev, testimonials: true }));
            } else if (sectionId === 'pricing-section') {
              setVisibleSections(prev => ({ ...prev, pricing: true }));
            } else if (sectionId === 'video-section') {
              setVisibleSections(prev => ({ ...prev, videos: true }));
            } else if (sectionId === 'footer-section') {
              setVisibleSections(prev => ({ ...prev, footer: true }));
            }
            sectionObserver.unobserve(entry.target);
          }
        });
      }, observerOptions);
      
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
          sectionObserver.observe(element);
        }
      });
      
      return () => {
        sectionObserver.disconnect();
      };
    }, 100); // Short delay to ensure component is mounted
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      <Hero />
      
      <div id="features-section" className="min-h-[50px]">
        {visibleSections.features ? (
          <Suspense fallback={<LoadingSpinner />}>
            <Features />
          </Suspense>
        ) : <div className="h-16"></div>}
      </div>
      
      <div id="testimonials-section" className="min-h-[50px]">
        {visibleSections.testimonials ? (
          <Suspense fallback={<LoadingSpinner />}>
            <Testimonials />
          </Suspense>
        ) : <div className="h-16"></div>}
      </div>
      
      <div id="pricing-section" className="min-h-[50px]">
        {visibleSections.pricing ? (
          <Suspense fallback={<LoadingSpinner />}>
            <Pricing />
          </Suspense>
        ) : <div className="h-16"></div>}
      </div>
      
      <div id="video-section" className="container mx-auto px-4 py-8 min-h-[50px]">
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
      
      <div id="footer-section" className="min-h-[50px]">
        {visibleSections.footer ? (
          <Suspense fallback={<LoadingSpinner />}>
            <Footer />
          </Suspense>
        ) : <div className="h-16"></div>}
      </div>
    </div>
  );
};

export default LandingPage;
