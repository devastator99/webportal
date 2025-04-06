
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

  // Update the query key to include relevant identifiers for the entire care team context
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
        console.log("Fetching group chat messages for members:", careTeamGroup.members.map(m => m.id));
        
        // Get all member IDs excluding the AI bot and special IDs
        const memberIds = careTeamGroup.members
          .filter(member => 
            member.role !== 'aibot' && 
            member.id !== '00000000-0000-0000-0000-000000000000'
          )
          .map(m => m.id);
        
        // Create all possible pair combinations for communication
        let allPairs: Array<[string, string]> = [];
        
        // Add pairs between the current user and each care team member
        for (const memberId of memberIds) {
          if (memberId !== user.id) {
            allPairs.push([user.id, memberId]);
          }
        }
        
        // Add all possible communication pairs between care team members
        // This ensures everyone can see all messages between any care team members
        for (let i = 0; i < memberIds.length; i++) {
          for (let j = i + 1; j < memberIds.length; j++) {
            // Don't duplicate pairs with the current user
            if (memberIds[i] !== user.id && memberIds[j] !== user.id) {
              allPairs.push([memberIds[i], memberIds[j]]);
            }
          }
        }
        
        console.log("Fetching messages for all pairs:", allPairs);
        
        // Fetch messages for all pairs
        const promises = allPairs.map(([senderId, receiverId]) => {
          return supabase.functions.invoke('get-chat-messages', {
            body: {
              user_id: senderId,
              other_user_id: receiverId,
              page: page,
              per_page: MESSAGES_PER_PAGE
            }
          });
        });
        
        // Add AI bot messages if present in the care team
        if (careTeamGroup.members.some(m => m.role === 'aibot' || m.id === '00000000-0000-0000-0000-000000000000')) {
          for (const memberId of memberIds) {
            promises.push(
              supabase.functions.invoke('get-chat-messages', {
                body: {
                  user_id: memberId,
                  other_user_id: '00000000-0000-0000-0000-000000000000',
                  page: page,
                  per_page: MESSAGES_PER_PAGE
                }
              })
            );
          }
        }
        
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
              // Assign roles to messages based on care team member roles
              const senderMember = careTeamGroup.members.find(m => m.id === msg.sender.id);
              const receiverMember = careTeamGroup.members.find(m => m.id === msg.receiver.id);
              
              return {
                ...msg,
                sender: {
                  ...msg.sender,
                  role: senderMember?.role || "unknown"
                },
                receiver: {
                  ...msg.receiver,
                  role: receiverMember?.role || "unknown" 
                }
              };
            });
            
            allMessages = [...allMessages, ...messagesWithRoles];
          }
        });
        
        // Sort all messages by timestamp
        allMessages.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        console.log(`Total group chat messages: ${allMessages.length}`);
        
        // Mark unread messages as read
        const unreadMessagesGrouped = allMessages.filter(
          (msg: MessageData) => 
            msg.sender?.id !== user.id && 
            !msg.read
        );
        
        if (unreadMessagesGrouped.length > 0) {
          await Promise.all(
            [...new Set(unreadMessagesGrouped.map(msg => msg.sender?.id))].map(senderId => {
              if (senderId) {
                return supabase.functions.invoke("mark-messages-as-read", {
                  body: {
                    user_id: user.id,
                    sender_id: senderId
                  }
                });
              }
              return Promise.resolve();
            })
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
          console.log("Including care team messages with selected user:", selectedUserId);
          
          // Get messages between all care team members and the selected user
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
              // Enhance messages with sender and receiver roles
              const enhancedMessages = careTeamResult.data.messages.map((msg: MessageData) => {
                const senderMember = careTeamMembers.find(m => m.id === msg.sender.id);
                const receiverMember = careTeamMembers.find(m => m.id === msg.receiver.id);
                
                return {
                  ...msg,
                  sender: {
                    ...msg.sender,
                    role: senderMember?.role || (msg.sender.id === selectedUserId ? "patient" : "unknown")
                  },
                  receiver: {
                    ...msg.receiver,
                    role: receiverMember?.role || (msg.receiver.id === selectedUserId ? "patient" : "unknown")
                  }
                };
              });
              
              allMessages = [...allMessages, ...enhancedMessages];
            }
          }
          
          // Also get messages between care team members about this patient
          for (let i = 0; i < careTeamMembers.length; i++) {
            for (let j = i + 1; j < careTeamMembers.length; j++) {
              if (careTeamMembers[i].id !== user.id && careTeamMembers[j].id !== user.id) {
                const internalResult = await supabase.functions.invoke('get-chat-messages', {
                  body: {
                    user_id: careTeamMembers[i].id,
                    other_user_id: careTeamMembers[j].id,
                    page: 1,
                    per_page: 50
                  }
                });
                
                if (internalResult.data && internalResult.data.messages) {
                  // Add internal care team messages
                  const enhancedMessages = internalResult.data.messages.map((msg: MessageData) => {
                    const senderMember = careTeamMembers.find(m => m.id === msg.sender.id);
                    const receiverMember = careTeamMembers.find(m => m.id === msg.receiver.id);
                    
                    return {
                      ...msg,
                      sender: {
                        ...msg.sender,
                        role: senderMember?.role || "unknown"
                      },
                      receiver: {
                        ...msg.receiver,
                        role: receiverMember?.role || "unknown"
                      }
                    };
                  });
                  
                  allMessages = [...allMessages, ...enhancedMessages];
                }
              }
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
      // Create a more comprehensive filter for the group chat subscription
      // to catch all messages between care team members
      const memberIds = careTeamGroup.members
        .filter(member => 
          member.role !== 'aibot' && 
          member.id !== '00000000-0000-0000-0000-000000000000'
        )
        .map(m => m.id);
      
      // Generate filter conditions for all possible communication pairs
      let allPairConditions: string[] = [];
      
      // Create conditions for each pair of members
      for (let i = 0; i < memberIds.length; i++) {
        for (let j = i + 1; j < memberIds.length; j++) {
          allPairConditions.push(
            `or(and(sender_id=eq.${memberIds[i]},receiver_id=eq.${memberIds[j]}),and(sender_id=eq.${memberIds[j]},receiver_id=eq.${memberIds[i]}))`
          );
        }
      }
      
      // Add AI bot conditions if present
      if (careTeamGroup.members.some(m => m.role === 'aibot' || m.id === '00000000-0000-0000-0000-000000000000')) {
        for (const memberId of memberIds) {
          allPairConditions.push(
            `or(and(sender_id=eq.${memberId},receiver_id=eq.00000000-0000-0000-0000-000000000000),and(sender_id=eq.00000000-0000-0000-0000-000000000000,receiver_id=eq.${memberId}))`
          );
        }
      }
      
      const finalFilter = `or(${allPairConditions.join(',')})`;
      console.log("Setting up comprehensive realtime subscription with filter:", finalFilter);
      
      channel = supabase
        .channel('comprehensive_group_chat_updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: finalFilter,
          },
          () => {
            console.log("New message detected in group chat, invalidating query");
            queryClient.invalidateQueries({ queryKey: queryKey.slice(0, -1) });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_messages',
            filter: finalFilter,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: queryKey.slice(0, -1) });
          }
        )
        .subscribe();
    } 
    else if (selectedUserId) {
      // For individual chat, also listen to all care team messages
      if (includeCareTeamMessages && careTeamMembers.length > 0) {
        const memberIds = careTeamMembers.map(m => m.id);
        memberIds.push(selectedUserId);
        
        if (!memberIds.includes(user.id)) {
          memberIds.push(user.id);
        }
        
        // Generate filter conditions for all possible communication pairs
        let allPairConditions: string[] = [];
        
        // Create conditions for each pair of members
        for (let i = 0; i < memberIds.length; i++) {
          for (let j = i + 1; j < memberIds.length; j++) {
            allPairConditions.push(
              `or(and(sender_id=eq.${memberIds[i]},receiver_id=eq.${memberIds[j]}),and(sender_id=eq.${memberIds[j]},receiver_id=eq.${memberIds[i]}))`
            );
          }
        }
        
        const finalFilter = `or(${allPairConditions.join(',')})`;
        console.log("Setting up comprehensive individual chat with team updates:", finalFilter);
        
        channel = supabase
          .channel('comprehensive_care_team_updates')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'chat_messages',
              filter: finalFilter,
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
              filter: finalFilter,
            },
            () => {
              queryClient.invalidateQueries({ queryKey: queryKey.slice(0, -1) });
            }
          )
          .subscribe();
      } else {
        // Standard individual chat subscription
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
  }, [user?.id, selectedUserId, isGroupChat, careTeamGroup, careTeamMembers, queryClient, queryKey, userRole]);

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
