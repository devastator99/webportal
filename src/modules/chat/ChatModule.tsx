
import { useEffect } from "react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ChatbotWidget } from "@/components/chat/ChatbotWidget";
import { initOfflineDB } from "@/utils/offlineStorage";

interface ChatModuleProps {
  showChatInterface?: boolean;
  showChatbotWidget?: boolean;
}

/**
 * ChatModule component that encapsulates all chat functionality
 * This allows the chat features to be conditionally rendered based on application needs
 */
export const ChatModule = ({ 
  showChatInterface = true, 
  showChatbotWidget = true 
}: ChatModuleProps) => {
  // Initialize the offline database when the chat module loads
  useEffect(() => {
    const initDb = async () => {
      try {
        await initOfflineDB();
        console.log("Offline chat database initialized");
      } catch (error) {
        console.error("Error initializing offline chat database:", error);
      }
    };
    
    initDb();
  }, []);
  
  return (
    <>
      {showChatInterface && <ChatInterface />}
      {showChatbotWidget && <ChatbotWidget />}
    </>
  );
};
