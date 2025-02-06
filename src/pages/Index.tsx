import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Testimonials } from "@/components/Testimonials";
import { Pricing } from "@/components/Pricing";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { user, isLoading } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { toast } = useToast();

  // Add debug logs
  useEffect(() => {
    console.log("Index component mounted");
    console.log("Auth state:", { user, isLoading });
    
    // Handle any rendering errors
    const handleError = (error: Error) => {
      console.error("Rendering error:", error);
      toast({
        variant: "destructive",
        title: "Error loading page",
        description: "Please refresh the page or try again later.",
      });
    };

    window.addEventListener('error', (e) => handleError(e.error));
    return () => {
      window.removeEventListener('error', (e) => handleError(e.error));
      console.log("Index component unmounted");
    };
  }, [toast]);

  // Add loading state handling
  if (isLoading) {
    console.log("Auth is loading...");
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#9b87f5]"></div>
    </div>;
  }

  console.log("Rendering Index components");

  return (
    <div className="relative min-h-screen bg-white">
      <Navbar />
      <div className="w-full">
        <Hero />
        <Features />
        <Testimonials />
        <Pricing />
        <Footer />

        {user && (
          <>
            {isChatOpen ? (
              <div className="fixed bottom-4 right-4 w-[400px] z-50">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 z-50"
                    onClick={() => setIsChatOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <ChatInterface />
                </div>
              </div>
            ) : (
              <Button
                className="fixed bottom-4 right-4 shadow-lg"
                onClick={() => setIsChatOpen(true)}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Chat with Doctor
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Index;