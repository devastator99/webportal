
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDown, MoreHorizontal } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

const ChatMessage = ({ message, isCurrentUser, formatMessageDate }) => {
  // Use string type for messageRole and provide a default
  const messageRole = message.sender?.role || "member";
  
  return (
    <div
      className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
    >
      <div className="flex items-start max-w-[75%]">
        {!isCurrentUser && (
          <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {message.sender?.first_name?.charAt(0) || "?"}{message.sender?.last_name?.charAt(0) || ""}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div
          className={`rounded-xl px-3 py-2 ${
            isCurrentUser
              ? "bg-primary text-white rounded-tr-none"
              : "bg-card border rounded-tl-none"
          }`}
        >
          {!isCurrentUser && (
            <div className="flex items-center gap-1 mb-1">
              <span className="font-medium text-xs">
                {message.sender?.first_name} {message.sender?.last_name}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase bg-muted px-1.5 py-0.5 rounded">
                {messageRole}
              </span>
            </div>
          )}
          
          <div className="space-y-1">
            <p className="text-sm">{message.message}</p>
            <div className="text-right">
              <span className="text-[10px] opacity-70">
                {formatMessageDate(message.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DateSeparator = ({ dateKey }) => {
  const dateObj = new Date(dateKey);
  
  let dateDisplay;
  if (isToday(dateObj)) {
    dateDisplay = "Today";
  } else if (isYesterday(dateObj)) {
    dateDisplay = "Yesterday";
  } else {
    dateDisplay = format(dateObj, "MMMM d, yyyy");
  }
  
  return (
    <div className="text-center my-3">
      <span className="px-2 py-1 bg-muted text-muted-foreground rounded-md text-xs">
        {dateDisplay}
      </span>
    </div>
  );
};

const MessagesList = ({ 
  combinedMessages, 
  currentUserId, 
  formatMessageDate, 
  careTeamMembers = []
}) => {
  const groupedMessages = {};
  combinedMessages.forEach(message => {
    const date = new Date(message.created_at);
    const dateKey = format(date, 'yyyy-MM-dd');
    
    if (!groupedMessages[dateKey]) {
      groupedMessages[dateKey] = [];
    }
    
    groupedMessages[dateKey].push(message);
  });
  
  const getMemberRole = (userId) => {
    const member = careTeamMembers.find(m => m.id === userId);
    return member?.role || "member";
  };
  
  return (
    <>
      {Object.keys(groupedMessages).map(dateKey => {
        const messages = groupedMessages[dateKey];
        
        return (
          <div key={dateKey}>
            <DateSeparator dateKey={dateKey} />
            
            <div className="space-y-3">
              {messages.map((message) => {
                const isCurrentUser = message.sender?.id === currentUserId;
                
                return (
                  <ChatMessage 
                    key={message.id}
                    message={message}
                    isCurrentUser={isCurrentUser}
                    formatMessageDate={formatMessageDate}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
};

const MessagesLoadingState = () => (
  <div className="flex-1 p-4 space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
        <Skeleton className={`h-16 w-3/4 rounded-lg ${i % 2 === 0 ? 'bg-primary/5' : 'bg-muted'}`} />
      </div>
    ))}
  </div>
);

const MessagesErrorState = ({ error, refetch }) => (
  <div className="flex-1 p-4 flex items-center justify-center">
    <div className="text-red-500 text-center">
      <p>Error loading messages</p>
      <p className="text-sm">{error?.message}</p>
      <Button onClick={refetch} className="mt-2">
        Retry
      </Button>
    </div>
  </div>
);

const ScrollToBottomButton = ({ onClick }) => (
  <button
    className="fixed bottom-20 right-4 bg-primary text-white p-2 rounded-full shadow-lg"
    onClick={onClick}
  >
    <ArrowDown className="h-4 w-4" />
  </button>
);

export const ChatMessagesList = ({
  roomId,
  selectedUserId = null,
  groupChat = false,
  careTeamGroup = null,
  careTeamMembers = [],
  offlineMode = false,
  localMessages = [],
  useRoomMessages = false,
  includeCareTeamMessages = false,
  specificEmail
}: {
  roomId?: string;
  selectedUserId?: string | null;
  groupChat?: boolean;
  careTeamGroup?: any;
  careTeamMembers?: any[];
  offlineMode?: boolean;
  localMessages?: any[];
  useRoomMessages?: boolean;
  includeCareTeamMessages?: boolean;
  specificEmail?: string;
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [combinedMessages, setCombinedMessages] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const pageSize = 20;
  
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error("Error getting current user:", error);
          return;
        }
        if (data?.user) {
          setCurrentUserId(data.user.id);
        }
      } catch (error) {
        console.error("Exception getting current user:", error);
      }
    };
    
    loadCurrentUser();
  }, []);

  const {
    data: messagesData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ["room_messages", roomId, page],
    queryFn: async () => {
      if (!roomId && !selectedUserId && !specificEmail) return { messages: [], hasMore: false };

      try {
        let queryResult;
        
        if (useRoomMessages && roomId) {
          if (!currentUserId) {
            console.warn("Current user ID not available yet");
          }
          
          const { data, error } = await supabase
            .from('room_messages')
            .select(`
              id,
              message,
              message_type,
              created_at,
              read_by,
              is_system_message,
              is_ai_message,
              sender_id
            `)
            .eq('room_id', roomId)
            .order('created_at', { ascending: false })
            .range((page - 1) * pageSize, page * pageSize - 1);
            
          if (error) throw error;
          
          const senderIds = [...new Set(data.map(msg => msg.sender_id))];
          
          const { data: senderProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select(`
              id, 
              first_name, 
              last_name
            `)
            .in('id', senderIds);
            
          if (profilesError) throw profilesError;
          
          // Fetch roles one by one to avoid TS errors with the bulk function
          const fetchRoles = async () => {
            const roles = new Map();
            
            for (const senderId of senderIds) {
              try {
                // Use get_user_role (not get_user_role_by_ids)
                const { data: roleData, error: roleError } = await supabase
                  .rpc('get_user_role', { lookup_user_id: senderId });
                
                if (!roleError && roleData) {
                  roles.set(senderId, roleData);
                }
              } catch (e) {
                console.error(`Error fetching role for user ${senderId}:`, e);
              }
            }
            
            return roles;
          };
          
          const rolesMap = await fetchRoles();
          
          const profilesMap = new Map();
          senderProfiles.forEach(profile => {
            profilesMap.set(profile.id, {
              id: profile.id,
              first_name: profile.first_name || 'Unknown',
              last_name: profile.last_name || 'User',
              role: rolesMap.get(profile.id) || 'member'
            });
          });
          
          const messages = data.map((message: any) => {
            const currentUserRead = message.read_by && Array.isArray(message.read_by) 
              ? message.read_by.includes(currentUserId)
              : false;
              
            const senderProfile = profilesMap.get(message.sender_id) || {
              id: message.sender_id,
              first_name: 'Unknown',
              last_name: 'User',
              role: 'unknown'
            };
              
            return {
              ...message,
              read: currentUserRead,
              sender: senderProfile
            };
          }).reverse();
          
          queryResult = { messages, hasMore: data.length === pageSize, page };
        } else if (selectedUserId) {
          if (!currentUserId) {
            throw new Error("Could not determine current user");
          }
          
          const { data: responseData, error } = await supabase.functions.invoke('get-chat-messages', {
            body: { 
              user_id: currentUserId,
              other_user_id: selectedUserId,
              page,
              per_page: pageSize
            }
          });
          
          if (error) throw error;
          queryResult = responseData;
        } else if (specificEmail) {
          const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .ilike('message', `%${specificEmail}%`)
            .order('created_at', { ascending: false })
            .range((page - 1) * pageSize, page * pageSize - 1);
            
          if (error) throw error;
          
          queryResult = { 
            messages: data || [], 
            hasMore: data?.length === pageSize,
            page
          };
        }

        return queryResult || { messages: [], hasMore: false };
      } catch (error) {
        console.error("Error fetching messages:", error);
        throw error;
      }
    },
    enabled: !!(roomId || selectedUserId || specificEmail) && !!currentUserId,
    staleTime: 1000 * 60 // 1 minute
  });

  const handleLoadMore = () => {
    if (messagesData?.hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const bottomThreshold = 100;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < bottomThreshold;
    
    setShowScrollToBottom(!isNearBottom);
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, "h:mm a");
    } else if (isYesterday(date)) {
      return 'Yesterday ' + format(date, "h:mm a");
    } else {
      return format(date, "MMM d, h:mm a");
    }
  };

  useEffect(() => {
    if (messagesData) {
      const remoteMessages = messagesData.messages || [];
      let allMessages;
      
      if (useRoomMessages && page === 1) {
        allMessages = [...remoteMessages, ...localMessages];
      } else {
        allMessages = remoteMessages;
      }
      
      if (page === 1) {
        setCombinedMessages(allMessages);
      } else {
        setCombinedMessages(prev => [...allMessages, ...prev]);
      }
    }
  }, [messagesData, localMessages, page, useRoomMessages]);

  useEffect(() => {
    if (!showScrollToBottom && messagesEndRef.current) {
      scrollToBottom();
    }
  }, [combinedMessages, showScrollToBottom]);

  useEffect(() => {
    if (!roomId && !selectedUserId) return;
    
    const subscription = useRoomMessages && roomId
      ? supabase
          .channel(`room_messages:${roomId}`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'room_messages',
            filter: `room_id=eq.${roomId}`
          }, () => {
            refetch();
          })
          .subscribe()
      : supabase
          .channel(`chat_messages:${selectedUserId}`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages'
          }, () => {
            refetch();
          })
          .subscribe();
          
    return () => {
      subscription.unsubscribe();
    };
  }, [roomId, selectedUserId, refetch, useRoomMessages]);

  if (isLoading && page === 1) {
    return <MessagesLoadingState />;
  }

  if (isError) {
    return <MessagesErrorState error={error as Error} refetch={refetch} />;
  }

  const hasPrevMessages = messagesData?.hasMore && page > 1;

  return (
    <ErrorBoundary>
      <div 
        ref={scrollContainerRef} 
        className="flex-1 overflow-y-auto px-4 py-2"
        onScroll={handleScroll}
      >
        {hasPrevMessages && (
          <div className="flex justify-center my-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLoadMore}
              className="text-xs"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Load older messages"}
            </Button>
          </div>
        )}
        
        <MessagesList 
          combinedMessages={combinedMessages}
          currentUserId={currentUserId}
          formatMessageDate={formatMessageDate}
          careTeamMembers={careTeamMembers}
        />
        
        {showScrollToBottom && (
          <ScrollToBottomButton onClick={scrollToBottom} />
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </ErrorBoundary>
  );
};
