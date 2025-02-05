
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
import { useState } from "react";

const Index = () => {
  console.log("Rendering Index page"); // Debug log
  const { user } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="relative min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <Features />
        <Testimonials />
        <Pricing />
      </main>
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
  );
};

export default Index;
