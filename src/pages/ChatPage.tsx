
import { useAuth } from "@/contexts/AuthContext";
import { ChatPageHeader } from "@/components/chat/ChatPageHeader";
import { WhatsAppStyleChatInterface } from "@/components/chat/WhatsAppStyleChatInterface";
import { DoctorWhatsAppChat } from "@/components/chat/DoctorWhatsAppChat";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const ChatPage = () => {
  const { user, userRole, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);
  
  useEffect(() => {
    // Hide welcome message after 3 seconds
    const timer = setTimeout(() => {
      setShowWelcomeMessage(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="container pt-24 animate-fade-in">
        <div className="mx-auto flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container pt-16 md:pt-20">
      <ErrorBoundary>
        <h1 className="text-2xl font-bold mb-2">Care Team Chat</h1>
        <p className="text-muted-foreground mb-4">
          {userRole === 'patient' 
            ? "Chat with your healthcare team" 
            : "Connect with your patients and their care teams"}
        </p>
        <Separator className="my-4" />
        
        {/* Welcome tooltip */}
        {showWelcomeMessage && (
          <div className="bg-primary/10 p-3 rounded-md mb-4 animate-fade-in text-center">
            <p className="text-primary font-medium">
              {userRole === 'patient' 
                ? "Chat with your healthcare team" 
                : "Care Team Chats - Connect with your patients and their care teams"}
            </p>
          </div>
        )}
        
        <div className="h-[calc(100vh-220px)]">
          <WhatsAppStyleChatInterface />
        </div>
      </ErrorBoundary>
    </div>
  );
};

export default ChatPage;
