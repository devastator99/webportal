
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

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#9b87f5]"></div>
  </div>
);

// Lazy-loaded components with better suspense handling
const Testimonials = () => {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    import("@/components/Testimonials").then((module) => {
      setComponent(() => module.Testimonials);
    });
  }, []);

  if (!Component) return <LoadingSpinner />;
  return <Component />;
};

const Pricing = () => {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    import("@/components/Pricing").then((module) => {
      setComponent(() => module.Pricing);
    });
  }, []);

  if (!Component) return <LoadingSpinner />;
  return <Component />;
};

const Footer = () => {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    import("@/components/Footer").then((module) => {
      setComponent(() => module.Footer);
    });
  }, []);

  if (!Component) return <LoadingSpinner />;
  return <Component />;
};

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
    if (typeof IntersectionObserver === 'undefined') {
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
            
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '200px',
        threshold: 0.01
      }
    );
    
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
      {/* Add padding-top to ensure content doesn't hide under navbar */}
      <div className="pt-16 md:pt-20">
        <Hero />
        
        <div id="features-section" className="min-h-[20px]">
          {visibleSections.features && <Features />}
        </div>
        
        <div id="testimonials-section" className="min-h-[20px]">
          {visibleSections.testimonials && <Testimonials />}
        </div>
        
        <div id="pricing-section" className="min-h-[20px]">
          {visibleSections.pricing && <Pricing />}
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
          {visibleSections.footer && <Footer />}
        </div>
      </div>
      
      {featureFlags.enableChatbotWidget && <ChatbotWidget />}
    </div>
  );
};

export default LandingPage;
