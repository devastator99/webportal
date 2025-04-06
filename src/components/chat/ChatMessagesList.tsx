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
      
      if (selectedUserId && includeCareTeamMessages) {
        try {
          // Use Edge Function to get all care team messages
          console.log("Getting care team messages via edge function");
          const { data, error } = await supabase.functions.invoke('get-chat-messages', {
            body: {
              user_id: user.id,
              other_user_id: selectedUserId,
              include_care_team: true
            }
          });

          if (error) {
            console.error("Error invoking get-chat-messages:", error);
            throw error;
          }

          console.log(`Retrieved ${data?.messages?.length || 0} care team messages via edge function`);
          return data?.messages || [];
        } catch (err) {
          console.error("Error in care team messages retrieval:", err);
          throw err;
        }
      } else if (isGroupChat && careTeamGroup) {
        const allMessages: ChatMessageType[] = [];
        
        const careTeamIds = careTeamGroup.members.map(member => member.id);
        if (!careTeamIds.includes(user.id)) {
          careTeamIds.push(user.id);
        }
        
        console.log("Care team IDs for group chat:", careTeamIds);
        
        // Query messages with sender and receiver information
        const { data: allTeamMessages, error: allTeamError } = await supabase
          .from('chat_messages')
          .select(`
            id,
            message,
            message_type,
            created_at,
            file_url,
            sender_id,
            receiver_id,
            sender:profiles!sender_id(id, first_name, last_name),
            receiver:profiles!receiver_id(id, first_name, last_name)
          `)
          .or(`sender_id.in.(${careTeamIds.join(',')}),receiver_id.in.(${careTeamIds.join(',')})`)
          .order('created_at', { ascending: true });
        
        if (allTeamError) {
          console.error("Error fetching all team messages:", allTeamError);
          throw allTeamError;
        }
        
        // Get user roles separately
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', careTeamIds);
          
        if (rolesError) {
          console.error("Error fetching user roles:", rolesError);
          throw rolesError;
        }
        
        // Create a lookup map for roles
        const roleMap = new Map();
        userRoles?.forEach(ur => {
          roleMap.set(ur.user_id, ur.role);
        });
        
        console.log(`Retrieved ${allTeamMessages?.length || 0} total messages between care team members`);
        if (allTeamMessages) {
          // Transform the data to include the role from our lookup map
          const transformedMessages = allTeamMessages.map(msg => ({
            id: msg.id,
            message: msg.message,
            message_type: msg.message_type,
            created_at: msg.created_at,
            file_url: msg.file_url,
            read: false, // Default value
            sender: {
              id: msg.sender?.id || '',
              first_name: msg.sender?.first_name || '',
              last_name: msg.sender?.last_name || '',
              role: roleMap.get(msg.sender?.id) || 'unknown'
            },
            receiver: {
              id: msg.receiver?.id || '',
              first_name: msg.receiver?.first_name || '',
              last_name: msg.receiver?.last_name || '',
              role: roleMap.get(msg.receiver?.id) || 'unknown'
            }
          }));
          allMessages.push(...transformedMessages);
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
        // Get user roles first
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', [user.id, selectedUserId]);
          
        if (rolesError) {
          console.error("Error fetching user roles:", rolesError);
          throw rolesError;
        }
        
        // Create a lookup map for roles
        const roleMap = new Map();
        userRoles?.forEach(ur => {
          roleMap.set(ur.user_id, ur.role);
        });
        
        // Direct conversation query
        const { data, error } = await supabase
          .from('chat_messages')
          .select(`
            id,
            message,
            message_type,
            created_at,
            file_url,
            sender_id,
            receiver_id,
            sender:profiles!sender_id(id, first_name, last_name),
            receiver:profiles!receiver_id(id, first_name, last_name)
          `)
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        if (error) throw error;
        
        console.log(`Returning ${data?.length || 0} direct messages`);
        
        // Transform data to match ChatMessageType with explicit role field added from roleMap
        const transformedData = data?.map(msg => ({
          id: msg.id,
          message: msg.message,
          message_type: msg.message_type,
          created_at: msg.created_at,
          file_url: msg.file_url,
          read: false, // Add missing property
          sender: {
            id: msg.sender?.id || '',
            first_name: msg.sender?.first_name || '',
            last_name: msg.sender?.last_name || '',
            role: roleMap.get(msg.sender?.id) || 'unknown'
          },
          receiver: {
            id: msg.receiver?.id || '',
            first_name: msg.receiver?.first_name || '',
            last_name: msg.receiver?.last_name || '',
            role: roleMap.get(msg.receiver?.id) || 'unknown'
          }
        })) || [];
        
        return transformedData;
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
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
};
