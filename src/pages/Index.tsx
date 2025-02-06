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
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#9b87f5]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <Testimonials />
        <Pricing />
      </main>
      <Footer />

      {user && (
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
              className="shadow-lg bg-[#9b87f5] hover:bg-[#7E69AB]"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Chat with Doctor
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Index;