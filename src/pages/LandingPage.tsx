
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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

// Simple loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#9b87f5]"></div>
  </div>
);

// Lazy load only non-critical components with dynamic import()
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
  const [creatingTestData, setCreatingTestData] = useState(false);
  const [visibleSections, setVisibleSections] = useState({
    features: false,
    testimonials: false,
    pricing: false,
    videos: false,
    footer: false
  });
  
  // Function to handle test data creation
  const createTestData = async () => {
    setCreatingTestData(true);
    try {
      const response = await fetch("https://hcaqodjylicmppxcbqbh.supabase.co/functions/v1/create-test-data", {
        method: 'POST',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjYXFvZGp5bGljbXBweGNicWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzMDIxNDksImV4cCI6MjA1Mzg3ODE0OX0.h4pO6UShabHNPWC9o_EMbbhOVHsR-fuZQ5-b85hNB4w`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create test data: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Test data created:", result);
      
      toast.success("Test data created successfully! Admin login: admin@example.com / testpassword123", {
        duration: 8000,
      });
    } catch (error: any) {
      console.error("Error creating test data:", error);
      toast.error(`Error creating test data: ${error.message}`, {
        duration: 5000,
      });
    } finally {
      setCreatingTestData(false);
    }
  };
  
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
      
      {/* Test Data Creation Button */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-amber-50 border border-amber-300 p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-lg font-semibold text-amber-800 mb-2">Create Test Data</h2>
          <p className="text-amber-700 mb-4">
            Click the button below to create test users including an admin account. 
            After creation, you can log in with the following credentials:
          </p>
          <div className="mb-4">
            <p className="text-amber-700"><strong>Admin:</strong> admin@example.com / testpassword123</p>
            <p className="text-amber-700"><strong>Patient:</strong> ram.naresh@example.com / testpassword123</p>
            <p className="text-amber-700"><strong>Doctor:</strong> vinay.pulkit@example.com / testpassword123</p>
          </div>
          <Button
            onClick={createTestData}
            disabled={creatingTestData}
            className="bg-amber-600 hover:bg-amber-700"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {creatingTestData ? "Creating Test Data..." : "Create Test Users"}
          </Button>
        </div>
      </div>
      
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
            {/* Manual loading of VideoList to prevent dynamic import errors */}
            <Suspense fallback={<LoadingSpinner />}>
              <StandaloneVideoList />
            </Suspense>
          </CollapsibleSection>
        )}
      </div>
      
      <div id="footer-section" className="min-h-[20px]">
        {visibleSections.footer && <Footer />}
      </div>

      {featureFlags.enableChatbotWidget && <ChatbotWidget />}
    </div>
  );
};

export default LandingPage;
