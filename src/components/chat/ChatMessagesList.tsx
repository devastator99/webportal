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
  localMessages?: any[];
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
  synced?: boolean | string;
}

export const ChatMessagesList = ({ 
  selectedUserId, 
  isGroupChat = false, 
  careTeamGroup = null,
  offlineMode = false,
  localMessages = []
}: ChatMessagesListProps) => {
  const { user, userRole } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [offlineMessages, setOfflineMessages] = useState<MessageData[]>([]);

  const queryKey = isGroupChat && careTeamGroup 
    ? ["group_chat_messages", user?.id, careTeamGroup.members.map(m => m.id).join('_')]
    : ["chat_messages", user?.id, selectedUserId];

  useEffect(() => {
    const loadOfflineMessages = async () => {
      if (user?.id) {
        try {
          const messages = await getAllOfflineMessages();
          
          const formattedMessages = messages.map(msg => {
            const senderInfo: ProfileInfo = {
              id: msg.sender_id,
              first_name: msg.sender_id === user.id ? "You (offline)" : "Contact",
              last_name: "",
              role: ""
            };
            
            if (careTeamGroup?.members && msg.sender_id !== user.id) {
              const member = careTeamGroup.members.find(m => m.id === msg.sender_id);
              if (member) {
                senderInfo.first_name = member.first_name;
                senderInfo.last_name = member.last_name;
                senderInfo.role = member.role;
              }
            } else if (msg.sender_id === user.id) {
              senderInfo.first_name = user.user_metadata?.first_name || "You";
              senderInfo.last_name = user.user_metadata?.last_name || "";
              senderInfo.role = userRole;
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
    
    if (offlineMode || localMessages.length > 0) {
      loadOfflineMessages();
    }
  }, [user?.id, offlineMode, careTeamGroup, userRole, localMessages.length]);

  const fetchMessages = async () => {
    if (!user?.id) return [];
    
    try {
      if (isGroupChat && careTeamGroup?.members) {
        const promises = careTeamGroup.members.map(member => {
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
        
        results.forEach(result => {
          if (result && result.data) {
            const messagesData = result.data as MessageData[];
            const messagesWithRoles = messagesData.map((msg: MessageData) => {
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
        
        allMessages.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        const unreadMessagesGrouped = allMessages.filter(
          (msg: MessageData) => 
            careTeamGroup.members.some(member => member.id === msg.sender?.id) && 
            !msg.read
        );
        
        if (unreadMessagesGrouped.length > 0) {
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
        const { data } = await supabase.functions.invoke('get-chat-messages', {
          body: {
            user_id: user.id,
            other_user_id: selectedUserId
          }
        });

        const messages = data as MessageData[];

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

  const { data: onlineMessages, isLoading, error } = useQuery({
    queryKey,
    queryFn: fetchMessages,
    enabled: !!user?.id && (!!selectedUserId || (isGroupChat && !!careTeamGroup)) && !offlineMode,
    refetchInterval: 3000,
  });

  const combinedMessages = () => {
    const online = offlineMode ? [] : (onlineMessages || []);
    const offline = offlineMessages || [];
    const local = localMessages || [];
    
    console.log("Online messages count:", online.length);
    console.log("Offline messages count:", offline.length);
    console.log("Local messages count:", local.length);
    
    const allMessages = [...online, ...offline, ...local];
    
    const uniqueIds = new Set();
    const uniqueMessages = allMessages.filter(msg => {
      if (!uniqueIds.has(msg.id)) {
        uniqueIds.add(msg.id);
        return true;
      }
      return false;
    });
    
    return uniqueMessages.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  };

  const messages = combinedMessages();

  useEffect(() => {
    if (scrollAreaRef.current && messages?.length) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!user?.id) return;
    
    let channel: any;
    
    if (isGroupChat && careTeamGroup?.members.length) {
      const memberIds = careTeamGroup.members.map(m => m.id);
      
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

  if (isLoading && !offlineMode && messages.length === 0) {
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

  if (error && !offlineMode && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-destructive">
        Error loading messages. Please try again.
      </div>
    );
  }

  if (!messages || messages.length === 0) {
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
