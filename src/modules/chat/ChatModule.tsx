
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
  
  // Check if the user is a doctor or nutritionist to render the appropriate chat interface
  const isDoctorRole = userRole === "doctor";
  const isNutritionistRole = userRole === "nutritionist";
  
  return (
    <>
      {showChatInterface && (
        <>
          {isDoctorRole ? (
            <DoctorWhatsAppChat />
          ) : (
            <UsersProvider>
              {({ careTeamGroup, assignedUsers, isLoading, error }) => {
                if (isLoading || error) {
                  return null; // Don't render anything if loading or error
                }
                
                // All users should use the same storage backend for chats,
                // but we customize the interface based on role
                return (
                  <ChatInterface 
                    assignedUsers={assignedUsers}
                    careTeamGroup={careTeamGroup}
                    showGroupChat={true} // Enable group chat for everyone to ensure full access to historical messages
                    whatsAppStyle={isNutritionistRole || isDoctorRole}
                    includeAiBot={true} // Ensure AI bot is always available
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
