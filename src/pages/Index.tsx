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

  useEffect(() => {
    console.log("Index component mounted, auth state:", { user, isLoading });
    return () => {
      console.log("Index component unmounted");
    };
  }, [user, isLoading]);

  // Add more detailed logging
  console.log("Index render cycle - Auth state:", { user, isLoading });

  // Always render the main content, regardless of auth state
  return (
    <main className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col">
        <div className="flex-grow">
          <Hero />
          <Features />
          <Testimonials />
          <Pricing />
        </div>
        <Footer />
      </div>

      {/* Only render chat when user is authenticated and loading is complete */}
      {!isLoading && user && (
        <div className="fixed bottom-4 right-4 z-50">
          {isChatOpen ? (
            <div className="w-[400px]">
              <div className="relative bg-white rounded-lg shadow-lg">
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
              onClick={() => setIsChatOpen(true)}
              className="shadow-lg"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Chat with Doctor
            </Button>
          )}
        </div>
      )}
    </main>
  );
};

export default Index;