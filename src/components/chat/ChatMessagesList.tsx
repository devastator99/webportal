
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
    queryKey: ["chat_messages", user?.id, selectedUserId, isGroupChat, includeCareTeamMessages, careTeamGroup?.groupName, careTeamMembers?.length, careTeamMembers?.map(m => m.id).join('-')],
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
        
        const careTeamIds = careTeamGroup.members.map(member => member.id);
        if (!careTeamIds.includes(user.id)) {
          careTeamIds.push(user.id);
        }
        
        console.log("Care team IDs for group chat:", careTeamIds);
        
        // Fixed query with explicit column hints for the relationships
        const { data: allTeamMessages, error: allTeamError } = await supabase
          .from('chat_messages')
          .select(`
            *,
            sender:sender_id(id, first_name, last_name, role),
            receiver:receiver_id(id, first_name, last_name, role)
          `)
          .or(`sender_id.in.(${careTeamIds.join(',')}),receiver_id.in.(${careTeamIds.join(',')})`)
          .order('created_at', { ascending: true });
        
        if (allTeamError) {
          console.error("Error fetching all team messages:", allTeamError);
          throw allTeamError;
        }
        
        console.log(`Retrieved ${allTeamMessages?.length || 0} total messages between care team members`);
        if (allTeamMessages) {
          allMessages.push(...allTeamMessages);
        }
        
        const uniqueMessages = Array.from(
          new Map(allMessages.map(msg => [msg.id, msg])).values()
        );
        
        // Only filter if we have valid messages and valid sender/receiver objects
        const filteredMessages = uniqueMessages.filter(msg => {
          if (!msg || !msg.sender || !msg.receiver) return false;
          // Check if both sender and receiver IDs are included in the careTeamIds
          return careTeamIds.includes(msg.sender.id) && careTeamIds.includes(msg.receiver.id);
        });
        
        filteredMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        
        console.log(`Returning ${filteredMessages.length} filtered unique care team messages`);
        return filteredMessages;
      } else if (selectedUserId && user?.id) {
        if (includeCareTeamMessages && careTeamMembers && careTeamMembers.length > 0) {
          console.log("Doctor/care team view: Fetching all messages for patient:", selectedUserId);
          
          const allRelevantIds = [selectedUserId, user.id];
          
          careTeamMembers.forEach(member => {
            if (!allRelevantIds.includes(member.id)) {
              allRelevantIds.push(member.id);
            }
          });
          
          console.log("All relevant IDs for message fetching:", allRelevantIds);
          
          // Fixed direct messages query with explicit column hints
          const { data: directMessages, error: directError } = await supabase
            .from('chat_messages')
            .select(`
              *,
              sender:sender_id(id, first_name, last_name, role),
              receiver:receiver_id(id, first_name, last_name, role)
            `)
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: true });
            
          if (directError) {
            console.error("Error fetching direct messages:", directError);
            throw directError;
          }

          // Fixed patient care team messages query with explicit column hints
          const { data: patientCareTeamMessages, error: careTeamError } = await supabase
            .from('chat_messages')
            .select(`
              *,
              sender:sender_id(id, first_name, last_name, role),
              receiver:receiver_id(id, first_name, last_name, role)
            `)
            .or(`sender_id.eq.${selectedUserId},receiver_id.eq.${selectedUserId}`)
            .order('created_at', { ascending: true });
            
          if (careTeamError) {
            console.error("Error fetching care team messages:", careTeamError);
            throw careTeamError;
          }
          
          // Safe filtering with null/undefined checks
          const filteredPatientMessages = patientCareTeamMessages ? patientCareTeamMessages.filter(msg => {
            if (!msg || !msg.sender || !msg.receiver) return false;
            
            const isFromPatient = msg.sender.id === selectedUserId;
            const isToPatient = msg.receiver.id === selectedUserId;
            
            if (isFromPatient) {
              return allRelevantIds.includes(msg.receiver.id);
            }
            
            if (isToPatient) {
              return allRelevantIds.includes(msg.sender.id);
            }
            
            return false;
          }) : [];
          
          const allMessages = [...(directMessages || []), ...filteredPatientMessages];
          
          const uniqueMessages = Array.from(
            new Map(allMessages.map(msg => [msg.id, msg])).values()
          );
          
          uniqueMessages.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          
          console.log(`Returning ${uniqueMessages.length} unique messages in total`);
          return uniqueMessages;
        } else {
          // Fixed direct conversation query with explicit column hints
          const { data, error } = await supabase
            .from('chat_messages')
            .select(`
              *,
              sender:sender_id(id, first_name, last_name, role),
              receiver:receiver_id(id, first_name, last_name, role)
            `)
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: true });

          if (error) throw error;
          
          console.log(`Returning ${data?.length || 0} direct messages`);
          return data || [];
        }
      }

      return [];
    },
    enabled: !!user?.id && (!!selectedUserId || (isGroupChat && !!careTeamGroup)),
    staleTime: 5000
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
