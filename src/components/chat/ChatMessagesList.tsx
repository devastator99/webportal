
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role?: string;
  user_role?: { role: string } | null;
}

interface CareTeamGroup {
  groupName: string;
  members: UserProfile[];
}

interface ChatMessagesListProps {
  selectedUserId?: string | null;
  isGroupChat?: boolean;
  careTeamGroup?: CareTeamGroup | null;
  careTeamMembers?: UserProfile[];
  offlineMode?: boolean;
  localMessages?: any[];
  includeCareTeamMessages?: boolean;
}

// Define proper types for the chat message
interface ChatMessageType {
  id: string;
  message: string;
  message_type: string;
  created_at: string;
  read?: boolean; // Optional since it's not always in the query response
  sender: UserProfile;
  receiver: UserProfile;
  file_url?: string | null;
}

export const ChatMessagesList = ({ 
  selectedUserId, 
  isGroupChat = false, 
  careTeamGroup = null,
  careTeamMembers = [],
  offlineMode = false,
  localMessages = []
}: ChatMessagesListProps) => {
  const { user, userRole } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading, error } = useQuery({
    queryKey: ["chat_messages", user?.id, selectedUserId, isGroupChat, 
      careTeamGroup?.groupName, 
      careTeamMembers?.length, 
      careTeamMembers?.map(m => m.id).join('-')],
    queryFn: async () => {
      if (!user?.id) return [];

      console.log("Fetching messages with params:", {
        userId: user?.id,
        selectedUserId,
        isGroupChat,
        careTeamMembersCount: careTeamMembers?.length || 0,
        careTeamGroupName: careTeamGroup?.groupName,
        userRole
      });
      
      if (selectedUserId) {
        try {
          // Always use the care team approach for consistency
          console.log("Getting messages via edge function");
          const { data, error } = await supabase.functions.invoke('get-chat-messages', {
            body: {
              user_id: user.id,
              other_user_id: selectedUserId
            }
          });

          if (error) {
            console.error("Error invoking get-chat-messages:", error);
            throw error;
          }

          console.log(`Retrieved ${data?.messages?.length || 0} messages via edge function`);
          return data?.messages || [];
        } catch (err) {
          console.error("Error in messages retrieval:", err);
          throw err;
        }
      }

      return [];
    },
    enabled: !!user?.id && (!!selectedUserId || (isGroupChat && !!careTeamGroup)),
    staleTime: 5000,
    refetchInterval: 10000 // Add polling to refresh messages automatically every 10 seconds
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages, localMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Make sure we're working with arrays for both messages and localMessages
  const serverMessages = Array.isArray(messages) ? messages : [];
  const allMessages = [...serverMessages, ...localMessages];
  
  // Sort messages by timestamp
  allMessages.sort((a, b) => (new Date(a.created_at)).getTime() - (new Date(b.created_at)).getTime());

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center">Loading messages...</div>;
  }

  if (error) {
    console.error("Error loading messages:", error);
    return <div className="flex-1 flex items-center justify-center text-red-500">Error loading messages: {error.message || "Unknown error"}</div>;
  }

  return (
    <div className="flex-1 overflow-hidden relative">
      <ScrollArea className="h-full w-full p-4">
        <div className="flex flex-col gap-2">
          {allMessages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No messages yet. Start a conversation!
            </div>
          ) : (
            allMessages.map((message, index) => {
              if (!message) return null;
              
              const isLocal = localMessages.some(localMessage => localMessage.id === message.id);
              const isCurrentUser = message.sender?.id === user?.id;
              const showAvatar = index === 0 || allMessages[index - 1]?.sender?.id !== message.sender?.id;
              
              return (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isCurrentUser={isCurrentUser}
                  showAvatar={showAvatar}
                  offlineMode={offlineMode}
                  isLocal={isLocal}
                />
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
};
