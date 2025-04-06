
import { useEffect } from "react";
import { UsersProvider } from "@/components/chat/UsersProvider";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ChatbotWidget } from "@/components/chat/ChatbotWidget";
import { initOfflineDB } from "@/utils/offlineStorage";
import { useAuth } from "@/contexts/AuthContext";
import { DoctorWhatsAppChat } from "@/components/chat/DoctorWhatsAppChat";

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
  const { userRole } = useAuth();
  
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
      {showChatInterface && (
        <>
          {userRole === "doctor" ? (
            <DoctorWhatsAppChat />
          ) : (
            <UsersProvider>
              {({ careTeamGroup, assignedUsers, isLoading, error }) => {
                if (isLoading || error) {
                  return null; // Don't render anything if loading or error
                }
                
                // Control the chat interface based on user role
                // All roles can access the chat, but with different views 
                return (
                  <ChatInterface 
                    assignedUsers={assignedUsers}
                    careTeamGroup={careTeamGroup}
                    showGroupChat={userRole !== "nutritionist"}
                    whatsAppStyle={userRole === "nutritionist"}
                    includeAiBot={true} // Always include AI bot in all chats
                  />
                );
              }}
            </UsersProvider>
          )}
        </>
      )}
      {showChatbotWidget && <ChatbotWidget />}
    </>
  );
};
