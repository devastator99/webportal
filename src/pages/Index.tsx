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

const Index = () => {
  const { user, isLoading } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Add console logs to track component lifecycle and auth state
  useEffect(() => {
    console.log("Index component mounted, auth state:", { user, isLoading });
    return () => {
      console.log("Index component unmounted");
    };
  }, [user, isLoading]);

  console.log("Rendering Index component");

  return (
    <>
      <Navbar />
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          <Hero />
          <Features />
          <Testimonials />
          <Pricing />
        </main>
        <Footer />

        {!isLoading && user && (
          <div className="fixed bottom-4 right-4 z-50">
            {isChatOpen ? (
              <div className="w-[400px]">
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
              <Button onClick={() => setIsChatOpen(true)}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Chat with Doctor
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Index;