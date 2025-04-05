
import { useEffect, useState, useCallback, Suspense } from "react";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { Features } from "@/components/Features";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { StandaloneVideoList } from "@/components/videos/VideoList";
import { ChatbotWidget } from "@/components/chat/ChatbotWidget";
import { featureFlags } from "@/config/features";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

// Lazy-loaded components
const Testimonials = React.lazy(() => import("@/components/Testimonials").then(module => ({
  default: module.Testimonials
})));

const Pricing = React.lazy(() => import("@/components/Pricing").then(module => ({
  default: module.Pricing
})));

const Footer = React.lazy(() => import("@/components/Footer").then(module => ({
  default: module.Footer
})));

export const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast: uiToast } = useToast();
  const [visibleSections, setVisibleSections] = useState({
    features: false,
    testimonials: false,
    pricing: false,
    videos: false,
    footer: false
  });
  
  useEffect(() => {
    // Immediately show features for better perceived performance
    setVisibleSections(prev => ({ ...prev, features: true }));
    
    if (typeof IntersectionObserver === 'undefined') {
      // For browsers that don't support IntersectionObserver
      setVisibleSections({
        features: true,
        testimonials: true,
        pricing: true,
        videos: true,
        footer: true
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            
            setVisibleSections(prev => {
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
            
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '200px',
        threshold: 0.01
      }
    );
    
    // Stagger the observation to improve initial load
    const sections = [
      'testimonials-section', 
      'pricing-section', 
      'video-section', 
      'footer-section'
    ];
    
    sections.forEach((id, index) => {
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          observer.observe(element);
        }
      }, index * 100); // Stagger by 100ms
    });
    
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      <div className="pt-16 md:pt-20">
        <Hero />
        
        <div id="features-section" className="min-h-[20px]">
          {visibleSections.features && <Features />}
        </div>
        
        <div id="testimonials-section" className="min-h-[20px]">
          {visibleSections.testimonials && (
            <Suspense fallback={<LoadingSpinner />}>
              <Testimonials />
            </Suspense>
          )}
        </div>
        
        <div id="pricing-section" className="min-h-[20px]">
          {visibleSections.pricing && (
            <Suspense fallback={<LoadingSpinner />}>
              <Pricing />
            </Suspense>
          )}
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
                <StandaloneVideoList />
              </Suspense>
            </CollapsibleSection>
          )}
        </div>
        
        <div id="footer-section" className="min-h-[20px]">
          {visibleSections.footer && (
            <Suspense fallback={<LoadingSpinner />}>
              <Footer />
            </Suspense>
          )}
        </div>
      </div>
      
      {featureFlags.enableChatbotWidget && <ChatbotWidget />}
    </div>
  );
};

export default LandingPage;
