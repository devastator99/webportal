import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "./ChatMessage";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllOfflineMessages } from "@/utils/offlineStorage";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";

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
  careTeamMembers?: UserProfile[];
  offlineMode?: boolean;
  localMessages?: any[];
  includeCareTeamMessages?: boolean;
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

interface ChatMessagesResponse {
  messages: MessageData[];
  hasMore: boolean;
  totalCount: number;
  page: number;
  perPage: number;
}

const MESSAGES_PER_PAGE = 50; // Number of messages to load per page

export const ChatMessagesList = ({ 
  selectedUserId, 
  isGroupChat = false, 
  careTeamGroup = null,
  careTeamMembers = [],
  offlineMode = false,
  localMessages = [],
  includeCareTeamMessages = false
}: ChatMessagesListProps) => {
  const { user, userRole } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [offlineMessages, setOfflineMessages] = useState<MessageData[]>([]);
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const queryKey = isGroupChat && careTeamGroup 
    ? ["group_chat_messages", user?.id, careTeamGroup.members.map(m => m.id).join('_'), page]
    : ["chat_messages", user?.id, selectedUserId, page];

  useEffect(() => {
    if (!initialLoad) {
      setPage(1);
      setHasMoreMessages(false);
    }
  }, [selectedUserId, careTeamGroup, initialLoad]);

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

  const fetchMessages = async (): Promise<{ data: MessageData[], hasMore: boolean }> => {
    if (!user?.id) return { data: [], hasMore: false };
    
    try {
      if (isGroupChat && careTeamGroup?.members) {
        const promises = careTeamGroup.members.map(member => {
          if (member.role === 'aibot' || member.id === '00000000-0000-0000-0000-000000000000') {
            return Promise.resolve({ data: [] });
          }
          
          return supabase.functions.invoke('get-chat-messages', {
            body: {
              user_id: user.id,
              other_user_id: member.id,
              page: page,
              per_page: MESSAGES_PER_PAGE
            }
          });
        }).filter(Boolean);
        
        const results = await Promise.all(promises);
        let allMessages: MessageData[] = [];
        let hasMore = false;
        
        results.forEach(result => {
          if (result && result.data) {
            if (result.data.hasMore) {
              hasMore = true;
            }
            
            const messagesData = result.data.messages || [];
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
          await Promise.all(
            [...new Set(unreadMessagesGrouped.map(msg => msg.sender?.id))].map(senderId => 
              supabase.functions.invoke("mark-messages-as-read", {
                body: {
                  user_id: user.id,
                  sender_id: senderId
                }
              })
            )
          );
        }
        
        return { data: allMessages, hasMore };
      } 
      else if (selectedUserId) {
        let allMessages: MessageData[] = [];
        let hasMore = false;
        
        const directResult = await supabase.functions.invoke('get-chat-messages', {
          body: {
            user_id: user.id,
            other_user_id: selectedUserId,
            page: page,
            per_page: MESSAGES_PER_PAGE
          }
        });

        const directResponseData = directResult.data as ChatMessagesResponse;
        const directMessages = directResponseData.messages || [];
        hasMore = directResponseData.hasMore || false;
        
        allMessages = [...directMessages];
        
        if (includeCareTeamMessages && careTeamMembers.length > 0) {
          for (const member of careTeamMembers) {
            if (member.id === user.id) continue;
            
            const careTeamResult = await supabase.functions.invoke('get-chat-messages', {
              body: {
                user_id: member.id,
                other_user_id: selectedUserId,
                page: 1,
                per_page: 50
              }
            });
            
            if (careTeamResult.data && careTeamResult.data.messages) {
              allMessages = [...allMessages, ...careTeamResult.data.messages];
            }
          }
        }
        
        if (allMessages.length > 0) {
          const unreadMessages = allMessages.filter(
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
        
        allMessages.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        if (selectedUserId === '00000000-0000-0000-0000-000000000000') {
          return { 
            data: allMessages.map((msg: MessageData) => {
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
            }),
            hasMore
          };
        }
        
        return { data: allMessages || [], hasMore };
      }
      
      return { data: [], hasMore: false };
    } catch (error) {
      console.error("Error in chat messages query:", error);
      return { data: [], hasMore: false };
    }
  };

  const { data: messagesData, isLoading, error } = useQuery({
    queryKey,
    queryFn: fetchMessages,
    enabled: !!user?.id && (!!selectedUserId || (isGroupChat && !!careTeamGroup)) && !offlineMode,
    refetchInterval: 3000
  });

  useEffect(() => {
    if (messagesData) {
      setHasMoreMessages(messagesData.hasMore);
      setInitialLoad(false);
    }
  }, [messagesData]);

  const onlineMessages = messagesData?.data || [];

  const loadMoreMessages = async () => {
    setIsLoadingMore(true);
    setPage(prev => prev + 1);
    setIsLoadingMore(false);
  };

  const combinedMessages = () => {
    const online = offlineMode ? [] : (onlineMessages || []);
    const offline = offlineMessages || [];
    const local = localMessages || [];
    
    console.log("Local messages:", local);
    console.log("Online messages:", online);
    
    const allMessages = [...online, ...local, ...offline];
    
    const uniqueIds = new Set();
    const uniqueMessages = allMessages.filter(msg => {
      if (!msg || !msg.id) return false;
      
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
  
  console.log("Combined messages:", messages);

  useEffect(() => {
    if (messagesEndRef.current && !isLoadingMore) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isLoadingMore]);

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
            queryClient.invalidateQueries({ queryKey: queryKey.slice(0, -1) });
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
            queryClient.invalidateQueries({ queryKey: queryKey.slice(0, -1) });
          }
        )
        .subscribe();
    } 
    else if (selectedUserId) {
      if (includeCareTeamMessages && careTeamMembers.length > 0) {
        const filterConditions = [
          `or(and(sender_id=eq.${user.id},receiver_id=eq.${selectedUserId}),and(sender_id=eq.${selectedUserId},receiver_id=eq.${user.id}))`,
        ];
        
        for (const member of careTeamMembers) {
          if (member.id !== user.id) {
            filterConditions.push(
              `or(and(sender_id=eq.${member.id},receiver_id=eq.${selectedUserId}),and(sender_id=eq.${selectedUserId},receiver_id=eq.${member.id}))`
            );
          }
        }
        
        const combinedFilter = filterConditions.join(',');
        
        channel = supabase
          .channel('care_team_chat_updates')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'chat_messages',
              filter: `or(${combinedFilter})`,
            },
            () => {
              queryClient.invalidateQueries({ queryKey: queryKey.slice(0, -1) });
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'chat_messages',
              filter: `or(${combinedFilter})`,
            },
            () => {
              queryClient.invalidateQueries({ queryKey: queryKey.slice(0, -1) });
            }
          )
          .subscribe();
      } else {
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
              queryClient.invalidateQueries({ queryKey: queryKey.slice(0, -1) });
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
              queryClient.invalidateQueries({ queryKey: queryKey.slice(0, -1) });
            }
          )
          .subscribe();
      }
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id, selectedUserId, isGroupChat, careTeamGroup, careTeamMembers, queryClient, queryKey]);

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
    <ScrollArea className="flex-1 pr-4 h-full" ref={scrollAreaRef}>
      {hasMoreMessages && (
        <div className="flex justify-center my-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={loadMoreMessages}
            disabled={isLoadingMore}
          >
            <ArrowUp className="h-4 w-4" /> 
            {isLoadingMore ? "Loading..." : "Load older messages"}
          </Button>
        </div>
      )}
      
      <div className="space-y-4 pb-2">
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
              showSender={isGroupChat || (includeCareTeamMessages && msg.sender.id !== user?.id && msg.sender.id !== selectedUserId)}
              offlineMode={offlineMode && msg.synced === false}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};
