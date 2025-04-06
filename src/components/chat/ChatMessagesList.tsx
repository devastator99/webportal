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

// Add the includeCareTeamMessages prop to the ChatMessagesListProps interface
interface ChatMessagesListProps {
  selectedUserId?: string | null;
  isGroupChat?: boolean;
  careTeamGroup?: CareTeamGroup | null;
  careTeamMembers?: UserProfile[];
  offlineMode?: boolean;
  localMessages?: any[];
  includeCareTeamMessages?: boolean;
}

export const ChatMessagesList = ({ 
  selectedUserId, 
  isGroupChat = false, 
  careTeamGroup = null,
  careTeamMembers = [],
  offlineMode = false,
  localMessages = [],
  includeCareTeamMessages = false
}: ChatMessagesListProps) => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading, error } = useQuery({
    queryKey: ["chat_messages", user?.id, selectedUserId, isGroupChat],
    queryFn: async () => {
      if (!user?.id) return [];

      if (isGroupChat && careTeamGroup) {
        const allMessages = [];
        for (const member of careTeamGroup.members) {
          if (member.role === 'aibot' || member.id === '00000000-0000-0000-0000-000000000000') continue;
          
          const { data, error } = await supabase
            .from('chat_messages')
            .select('*, sender:sender_id(id, first_name, last_name, role), receiver:receiver_id(id, first_name, last_name, role)')
            .or(`sender_id.eq.${user.id},and(receiver_id.eq.${member.id}),sender_id.eq.${member.id},and(receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: true });

          if (error) {
            console.error(`Error fetching messages for user ${member.id}:`, error);
            continue;
          }
          
          allMessages.push(...(data || []));
        }
        
        // Fetch AI bot messages if AI bot is in the care team
        if (careTeamGroup.members.some(member => 
          member.role === 'aibot' || member.id === '00000000-0000-0000-0000-000000000000'
        )) {
          const { data: aiMessages, error: aiError } = await supabase
            .from('chat_messages')
            .select('*, sender:sender_id(id, first_name, last_name, role), receiver:receiver_id(id, first_name, last_name, role)')
            .or(`sender_id.eq.00000000-0000-0000-0000-000000000000,and(receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: true });
          
          if (aiError) {
            console.error("Error fetching AI messages:", aiError);
          } else {
            allMessages.push(...(aiMessages || []));
          }
        }

        // Filter out messages not intended for the current user
        const filteredMessages = allMessages.filter(msg => {
          const isSentToUser = msg.receiver_id === user.id;
          const isSentByUser = msg.sender_id === user.id;
          const isSentByAI = msg.sender_id === '00000000-0000-0000-0000-000000000000';
          
          return isSentToUser || isSentByUser || isSentByAI;
        });
        
        // Sort messages by created_at timestamp
        filteredMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        
        return filteredMessages;
      } else if (selectedUserId && user?.id) {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*, sender:sender_id(id, first_name, last_name, role), receiver:receiver_id(id, first_name, last_name, role)')
          .or(`sender_id.eq.${user.id},and(receiver_id.eq.${selectedUserId}),sender_id.eq.${selectedUserId},and(receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
      }

      return [];
    },
    enabled: !!user?.id && (!!selectedUserId || (isGroupChat && !!careTeamGroup)),
    staleTime: 20000 // 20 seconds
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages, localMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const allMessages = [...(messages || []), ...localMessages];
  
  allMessages.sort((a, b) => (new Date(a.created_at)).getTime() - (new Date(b.created_at)).getTime());

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center">Loading messages...</div>;
  }

  if (error) {
    return <div className="flex-1 flex items-center justify-center text-red-500">Error loading messages.</div>;
  }

  return (
    <div className="flex-1 overflow-hidden relative">
      <ScrollArea className="h-full w-full p-4">
        <div className="flex flex-col gap-2">
          {allMessages.map((message, index) => {
            if (!isGroupChat && selectedUserId) {
              const isLocal = localMessages.some(localMessage => localMessage.id === message.id);
              const isCurrentUser = message.sender?.id === user?.id;
              const showAvatar = allMessages[index + 1]?.sender?.id !== message.sender?.id;
              
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
            } else if (isGroupChat && careTeamGroup) {
              const isLocal = localMessages.some(localMessage => localMessage.id === message.id);
              const isCurrentUser = message.sender?.id === user?.id;
              const showAvatar = allMessages[index + 1]?.sender?.id !== message.sender?.id;
              
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
            }
            return null;
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
};
