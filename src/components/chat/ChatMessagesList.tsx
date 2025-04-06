
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
    queryKey: ["chat_messages", user?.id, selectedUserId, isGroupChat, includeCareTeamMessages, careTeamGroup?.groupName, careTeamMembers?.length],
    queryFn: async () => {
      if (!user?.id) return [];

      console.log("Fetching messages with params:", {
        userId: user?.id,
        selectedUserId,
        isGroupChat,
        includeCareTeamMessages,
        careTeamMembersCount: careTeamMembers?.length || 0,
        careTeamGroupName: careTeamGroup?.groupName
      });

      if (isGroupChat && careTeamGroup) {
        const allMessages = [];
        
        // Get all care team member IDs including the current user
        const careTeamIds = careTeamGroup.members.map(member => member.id);
        if (!careTeamIds.includes(user.id)) {
          careTeamIds.push(user.id);
        }
        
        console.log("Care team IDs for group chat:", careTeamIds);
        
        // Fetch ALL messages between ANY care team members
        const { data: allTeamMessages, error: allTeamError } = await supabase
          .from('chat_messages')
          .select('*, sender:sender_id(id, first_name, last_name, role), receiver:receiver_id(id, first_name, last_name, role)')
          .or(`sender_id.in.(${careTeamIds.join(',')}),receiver_id.in.(${careTeamIds.join(',')})`)
          .order('created_at', { ascending: true });
        
        if (allTeamError) {
          console.error("Error fetching all team messages:", allTeamError);
          throw allTeamError;
        }
        
        console.log(`Retrieved ${allTeamMessages?.length || 0} total messages between care team members`);
        allMessages.push(...(allTeamMessages || []));
        
        // Remove duplicate messages based on message ID
        const uniqueMessages = Array.from(
          new Map(allMessages.map(msg => [msg.id, msg])).values()
        );
        
        // Filter to only include messages that involve care team members
        const filteredMessages = uniqueMessages.filter(msg => {
          return careTeamIds.includes(msg.sender.id) && careTeamIds.includes(msg.receiver.id);
        });
        
        // Sort messages by created_at timestamp
        filteredMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        
        console.log(`Returning ${filteredMessages.length} filtered unique care team messages`);
        return filteredMessages;
      } else if (selectedUserId && user?.id) {
        // Direct conversation between two users
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*, sender:sender_id(id, first_name, last_name, role), receiver:receiver_id(id, first_name, last_name, role)')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        if (error) throw error;
        
        // If requested to include care team messages and care team members are provided
        if (includeCareTeamMessages && careTeamMembers && careTeamMembers.length > 0) {
          const careTeamIds = careTeamMembers.map(member => member.id);
          
          // Include the selected user and current user in the care team IDs
          const allRelevantIds = [...careTeamIds];
          if (!allRelevantIds.includes(selectedUserId)) {
            allRelevantIds.push(selectedUserId);
          }
          if (!allRelevantIds.includes(user.id)) {
            allRelevantIds.push(user.id);
          }
          
          console.log("Fetching care team messages with relevant IDs:", allRelevantIds);
          
          // Get ALL messages between ALL care team members and the patient
          const careTeamQuery = allRelevantIds.map(id => {
            return `or(sender_id.eq.${selectedUserId},and(receiver_id.eq.${id}),sender_id.eq.${id},and(receiver_id.eq.${selectedUserId}))`;
          }).join(',');
          
          const { data: careTeamData, error: careTeamError } = await supabase
            .from('chat_messages')
            .select('*, sender:sender_id(id, first_name, last_name, role), receiver:receiver_id(id, first_name, last_name, role)')
            .or(careTeamQuery)
            .order('created_at', { ascending: true });
            
          if (careTeamError) {
            console.error("Error fetching care team messages:", careTeamError);
          } else {
            console.log(`Retrieved ${careTeamData?.length || 0} care team related messages`);
            
            // Combine messages and remove duplicates
            const allMessages = [...(data || []), ...(careTeamData || [])];
            const uniqueMessages = Array.from(
              new Map(allMessages.map(msg => [msg.id, msg])).values()
            );
            
            // Sort messages by created_at timestamp
            uniqueMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            
            console.log(`Returning ${uniqueMessages.length} unique messages after care team merging`);
            return uniqueMessages;
          }
        }
        
        console.log(`Returning ${data?.length || 0} direct messages`);
        return data || [];
      }

      return [];
    },
    enabled: !!user?.id && (!!selectedUserId || (isGroupChat && !!careTeamGroup)),
    staleTime: 5000 // Reduced to 5 seconds for more frequent updates
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
          {allMessages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No messages yet. Start a conversation!
            </div>
          ) : (
            allMessages.map((message, index) => {
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
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
};
