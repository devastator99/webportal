
import { useAuth } from "@/contexts/AuthContext";
import { UserModule } from "@/modules/chat";
import { ChatPageHeader } from "@/components/chat/ChatPageHeader";
import { WhatsAppStyleChatInterface } from "@/components/chat/WhatsAppStyleChatInterface";
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

  const isDoctor = userRole === 'doctor';
  const isNutritionist = userRole === 'nutritionist';
  const isProvider = isDoctor || isNutritionist;

  return (
    <div className="container pt-16 md:pt-20">
      <ErrorBoundary>
        <ChatPageHeader />
        <Separator className="my-4" />
        
        {/* Welcome tooltip */}
        {showWelcomeMessage && (
          <div className="bg-primary/10 p-3 rounded-md mb-4 animate-fade-in text-center">
            <p className="text-primary font-medium">
              {isProvider 
                ? "Care Team Chats - Connect with your patients and their care teams" 
                : "Chat with your healthcare team"}
            </p>
          </div>
        )}
        
        {userRole === 'doctor' || userRole === 'nutritionist' ? (
          <WhatsAppStyleChatInterface />
        ) : (
          <UserModule />
        )}
      </ErrorBoundary>
    </div>
  );
};

export default ChatPage;
