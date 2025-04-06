
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
    queryKey: ["chat_messages", user?.id, selectedUserId, isGroupChat, includeCareTeamMessages],
    queryFn: async () => {
      if (!user?.id) return [];

      if (isGroupChat && careTeamGroup) {
        const allMessages = [];
        
        // Get all care team member IDs including the current user
        const careTeamIds = careTeamGroup.members.map(member => member.id);
        if (!careTeamIds.includes(user.id)) {
          careTeamIds.push(user.id);
        }
        
        // Fetch messages between all care team members
        for (const memberId of careTeamIds) {
          // Skip AI bot as sender since we'll query it separately
          if (memberId === '00000000-0000-0000-0000-000000000000') continue;
          
          for (const receiverId of careTeamIds) {
            // Don't query messages sent to self
            if (memberId === receiverId) continue;
            
            const { data, error } = await supabase
              .from('chat_messages')
              .select('*, sender:sender_id(id, first_name, last_name, role), receiver:receiver_id(id, first_name, last_name, role)')
              .or(`sender_id.eq.${memberId},and(receiver_id.eq.${receiverId})`)
              .order('created_at', { ascending: true });

            if (error) {
              console.error(`Error fetching messages between ${memberId} and ${receiverId}:`, error);
              continue;
            }
            
            allMessages.push(...(data || []));
          }
        }
        
        // Fetch AI bot messages sent to any care team member
        const { data: aiMessages, error: aiError } = await supabase
          .from('chat_messages')
          .select('*, sender:sender_id(id, first_name, last_name, role), receiver:receiver_id(id, first_name, last_name, role)')
          .eq('sender_id', '00000000-0000-0000-0000-000000000000')
          .in('receiver_id', careTeamIds)
          .order('created_at', { ascending: true });
        
        if (aiError) {
          console.error("Error fetching AI messages:", aiError);
        } else {
          allMessages.push(...(aiMessages || []));
        }
        
        // Also fetch messages sent by any care team member to the AI bot
        const { data: messagesToAI, error: messagesToAIError } = await supabase
          .from('chat_messages')
          .select('*, sender:sender_id(id, first_name, last_name, role), receiver:receiver_id(id, first_name, last_name, role)')
          .eq('receiver_id', '00000000-0000-0000-0000-000000000000')
          .in('sender_id', careTeamIds)
          .order('created_at', { ascending: true });
        
        if (messagesToAIError) {
          console.error("Error fetching messages to AI:", messagesToAIError);
        } else {
          allMessages.push(...(messagesToAI || []));
        }

        // Remove duplicate messages based on message ID
        const uniqueMessages = Array.from(
          new Map(allMessages.map(msg => [msg.id, msg])).values()
        );
        
        // Sort messages by created_at timestamp
        uniqueMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        
        return uniqueMessages;
      } else if (selectedUserId && user?.id) {
        // Direct conversation between two users
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*, sender:sender_id(id, first_name, last_name, role), receiver:receiver_id(id, first_name, last_name, role)')
          .or(`sender_id.eq.${user.id},and(receiver_id.eq.${selectedUserId}),sender_id.eq.${selectedUserId},and(receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        if (error) throw error;
        
        // If requested to include care team messages and care team members are provided
        if (includeCareTeamMessages && careTeamMembers && careTeamMembers.length > 0) {
          const careTeamIds = careTeamMembers.map(member => member.id);
          
          // Get messages between the selected user and all care team members
          const { data: careTeamData, error: careTeamError } = await supabase
            .from('chat_messages')
            .select('*, sender:sender_id(id, first_name, last_name, role), receiver:receiver_id(id, first_name, last_name, role)')
            .or(`sender_id.eq.${selectedUserId},and(receiver_id.in.(${careTeamIds.join(',')})),sender_id.in.(${careTeamIds.join(',')}),and(receiver_id.eq.${selectedUserId})`)
            .order('created_at', { ascending: true });
            
          if (careTeamError) {
            console.error("Error fetching care team messages:", careTeamError);
          } else {
            // Combine messages and remove duplicates
            const allMessages = [...(data || []), ...(careTeamData || [])];
            const uniqueMessages = Array.from(
              new Map(allMessages.map(msg => [msg.id, msg])).values()
            );
            
            // Sort messages by created_at timestamp
            uniqueMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            
            return uniqueMessages;
          }
        }
        
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
