import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "./ChatMessage";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllOfflineMessages } from "@/utils/offlineStorage";

interface CareTeamGroup {
  groupName: string;
  members: UserProfile[];
}

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role?: string;
  user_role?: { role: string } | null;
}

interface ChatMessagesListProps {
  selectedUserId?: string | null;
  isGroupChat?: boolean;
  careTeamGroup?: CareTeamGroup | null;
  offlineMode?: boolean;
}

interface ProfileInfo {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role?: string;
}

interface MessageData {
  id: string;
  message: string | null;
  message_type: string | null;
  created_at: string;
  read: boolean;
  sender: ProfileInfo;
  receiver: ProfileInfo;
  synced?: boolean;
}

export const ChatMessagesList = ({ 
  selectedUserId, 
  isGroupChat = false, 
  careTeamGroup = null,
  offlineMode = false
}: ChatMessagesListProps) => {
  const { user } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [offlineMessages, setOfflineMessages] = useState<MessageData[]>([]);

  // Determine query key based on whether we're in group chat or individual chat
  const queryKey = isGroupChat && careTeamGroup 
    ? ["group_chat_messages", user?.id, careTeamGroup.members.map(m => m.id).join('_')]
    : ["chat_messages", user?.id, selectedUserId];

  // Load offline messages
  useEffect(() => {
    const loadOfflineMessages = async () => {
      if (user?.id) {
        try {
          const messages = await getAllOfflineMessages();
          
          // Format offline messages to match MessageData structure
          const formattedMessages = messages.map(msg => {
            // Simple offline message format conversion
            const senderInfo: ProfileInfo = {
              id: msg.sender_id,
              first_name: msg.sender_id === user.id ? "You (offline)" : "Contact",
              last_name: "",
              role: ""
            };
            
            // Try to find sender info in care team if available
            if (careTeamGroup?.members && msg.sender_id !== user.id) {
              const member = careTeamGroup.members.find(m => m.id === msg.sender_id);
              if (member) {
                senderInfo.first_name = member.first_name;
                senderInfo.last_name = member.last_name;
                senderInfo.role = member.role;
              }
            }
            
            return {
              id: msg.id,
              message: msg.message,
              message_type: msg.message_type,
              created_at: msg.created_at,
              read: false,
              sender: senderInfo,
              receiver: {
                id: msg.receiver_id,
                first_name: null,
                last_name: null
              },
              synced: msg.synced
            };
          });
          
          setOfflineMessages(formattedMessages);
        } catch (err) {
          console.error("Error loading offline messages:", err);
        }
      }
    };
    
    if (offlineMode) {
      loadOfflineMessages();
    }
  }, [user?.id, offlineMode, careTeamGroup]);

  // Function to fetch messages for either individual or group chat
  const fetchMessages = async () => {
    if (!user?.id) return [];
    
    try {
      if (isGroupChat && careTeamGroup?.members) {
        // For group chat, collect messages from all care team members
        const promises = careTeamGroup.members.map(member => {
          // Don't try to fetch messages from AI bot if this is a direct query
          if (member.role === 'aibot' || member.id === '00000000-0000-0000-0000-000000000000') {
            return Promise.resolve({ data: [] });
          }
          
          return supabase.functions.invoke('get-chat-messages', {
            body: {
              user_id: user.id,
              other_user_id: member.id
            }
          });
        }).filter(Boolean);
        
        const results = await Promise.all(promises);
        let allMessages: MessageData[] = [];
        
        // Combine all messages from different senders
        results.forEach(result => {
          if (result && result.data) {
            const messagesData = result.data as MessageData[];
            // Enhance messages with role information from care team
            const messagesWithRoles = messagesData.map((msg: MessageData) => {
              // Find the member in care team to get their role
              const senderMember = careTeamGroup.members.find(m => m.id === msg.sender.id);
              if (senderMember && senderMember.role) {
                return {
                  ...msg,
                  sender: {
                    ...msg.sender,
                    role: senderMember.role
                  }
                };
              }
              return msg;
            });
            
            allMessages = [...allMessages, ...messagesWithRoles];
          }
        });
        
        // Sort messages by timestamp
        allMessages.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        // Mark messages as read
        const unreadMessagesGrouped = allMessages.filter(
          (msg: MessageData) => 
            careTeamGroup.members.some(member => member.id === msg.sender?.id) && 
            !msg.read
        );
        
        if (unreadMessagesGrouped.length > 0) {
          // Group by sender ID and mark each group as read
          const senderIds = [...new Set(unreadMessagesGrouped.map(msg => msg.sender?.id))];
          
          await Promise.all(
            senderIds.map(senderId => 
              supabase.functions.invoke("mark-messages-as-read", {
                body: {
                  user_id: user.id,
                  sender_id: senderId
                }
              })
            )
          );
        }
        
        return allMessages;
      } 
      else if (selectedUserId) {
        // For individual chat, use our serverless function
        const { data } = await supabase.functions.invoke('get-chat-messages', {
          body: {
            user_id: user.id,
            other_user_id: selectedUserId
          }
        });

        const messages = data as MessageData[];

        // Mark messages as read
        if (messages && messages.length > 0) {
          const unreadMessages = messages.filter(
            (msg: MessageData) => msg.sender?.id === selectedUserId && !msg.read
          );
          
          if (unreadMessages.length > 0) {
            await supabase.functions.invoke("mark-messages-as-read", {
              body: {
                user_id: user.id,
                sender_id: selectedUserId
              }
            });
          }
        }
        
        // If this is a chat with the AI bot, add role information
        if (selectedUserId === '00000000-0000-0000-0000-000000000000') {
          return messages.map((msg: MessageData) => {
            if (msg.sender.id === selectedUserId) {
              return {
                ...msg,
                sender: {
                  ...msg.sender,
                  role: 'aibot'
                }
              };
            }
            return msg;
          });
        }
        
        return messages || [];
      }
      
      return [];
    } catch (error) {
      console.error("Error in chat messages query:", error);
      return [];
    }
  };

  // Use the fetchMessages function in the query
  const { data: onlineMessages, isLoading, error } = useQuery({
    queryKey,
    queryFn: fetchMessages,
    enabled: !!user?.id && (!!selectedUserId || (isGroupChat && !!careTeamGroup)) && !offlineMode,
    refetchInterval: 3000, // Poll every 3 seconds to ensure we get new messages
  });

  // Combine online and offline messages when needed
  const messages = offlineMode ? offlineMessages : onlineMessages;

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current && messages?.length) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [messages]);

  // Subscribe to real-time updates for the appropriate channels
  useEffect(() => {
    if (!user?.id) return;
    
    let channel: any;
    
    if (isGroupChat && careTeamGroup?.members.length) {
      // For group chat, listen to changes from all care team members
      const memberIds = careTeamGroup.members.map(m => m.id);
      
      // Create a filter for messages to or from any group member
      const filterConditions = memberIds.map(memberId => 
        `or(and(sender_id=eq.${user.id},receiver_id=eq.${memberId}),and(sender_id=eq.${memberId},receiver_id=eq.${user.id}))`
      ).join(',');
      
      channel = supabase
        .channel('group_chat_updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `or(${filterConditions})`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_messages',
            filter: `or(${filterConditions})`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey });
          }
        )
        .subscribe();
    } 
    else if (selectedUserId) {
      // For individual chat, listen to changes between the two users
      channel = supabase
        .channel('chat_updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `or(and(sender_id=eq.${user.id},receiver_id=eq.${selectedUserId}),and(sender_id=eq.${selectedUserId},receiver_id=eq.${user.id}))`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_messages',
            filter: `or(and(sender_id=eq.${user.id},receiver_id=eq.${selectedUserId}),and(sender_id=eq.${selectedUserId},receiver_id=eq.${user.id}))`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey });
          }
        )
        .subscribe();
    }

    // Clean up the subscription
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id, selectedUserId, isGroupChat, careTeamGroup, queryClient, queryKey]);

  if (isGroupChat && !careTeamGroup) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        No care team available. Please contact an administrator.
      </div>
    );
  }

  if (!isGroupChat && !selectedUserId) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Select a user to start a conversation
      </div>
    );
  }

  if (isLoading && !offlineMode) {
    return (
      <div className="flex-1 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
            <Skeleton className={`h-16 w-3/4 rounded-lg ${i % 2 === 0 ? 'bg-primary-50' : 'bg-gray-100'}`} />
          </div>
        ))}
      </div>
    );
  }

  if (error && !offlineMode) {
    return (
      <div className="flex-1 flex items-center justify-center text-destructive">
        Error loading messages. Please try again.
      </div>
    );
  }

  if (!messages || !messages.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        {offlineMode
          ? "No offline messages available."
          : isGroupChat 
            ? "No group messages yet. Start a conversation with your care team!" 
            : "No messages yet. Start a conversation!"
        }
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
      <div className="space-y-4">
        {messages.map((msg: MessageData) => {
          if (!msg || !msg.sender) return null;
          
          return (
            <ChatMessage 
              key={msg.id}
              message={{
                id: msg.id,
                message: msg.message || '',
                created_at: msg.created_at,
                read: msg.read,
                sender: {
                  id: msg.sender.id,
                  first_name: msg.sender.first_name || '',
                  last_name: msg.sender.last_name || '',
                  role: msg.sender.role
                },
                synced: msg.synced
              }}
              isCurrentUser={msg.sender.id === user?.id}
              showSender={isGroupChat}
              offlineMode={offlineMode && msg.synced === false}
            />
          );
        })}
      </div>
    </ScrollArea>
  );
};
