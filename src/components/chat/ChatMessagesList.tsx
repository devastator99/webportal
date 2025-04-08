
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatMessagesListProps {
  selectedUserId?: string | null;
  groupChat?: boolean;
  roomId?: string;
  careTeamMembers?: any[];
  localMessages?: any[];
  useRoomMessages?: boolean;
  specificEmail?: string;
  offlineMode?: boolean;
  careTeamGroup?: any;
  includeCareTeamMessages?: boolean;
}

export const ChatMessagesList = ({
  selectedUserId,
  groupChat = false,
  roomId,
  careTeamMembers = [],
  localMessages = [],
  useRoomMessages = false,
  specificEmail,
  offlineMode = false
}: ChatMessagesListProps) => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  // Common function to get sender name and role
  const getSenderInfo = (senderId: string) => {
    const careTeamMember = careTeamMembers.find(m => m.id === senderId);
    if (careTeamMember) {
      return {
        name: `${careTeamMember.first_name || ''} ${careTeamMember.last_name || ''}`.trim(),
        role: careTeamMember.role
      };
    }
    // Default values if sender not found
    return { name: "Unknown User", role: "unknown" };
  };

  // Query for specific email if provided
  const {
    data: emailMessagesData,
    isLoading: isLoadingEmailMessages,
    error: emailMessagesError
  } = useQuery({
    queryKey: ["email_messages", specificEmail],
    queryFn: async () => {
      if (!specificEmail || !user?.id) return { messages: [], hasMore: false };
      
      try {
        console.log(`Searching messages for email: ${specificEmail}`);
        
        const { data, error } = await supabase.functions.invoke('search-messages-by-email', {
          body: { 
            user_id: user.id,
            email: specificEmail,
            page: 1,
            per_page: 50
          }
        });
        
        if (error) throw error;
        
        return { 
          messages: data?.messages || [], 
          hasMore: data?.hasMore || false 
        };
      } catch (error) {
        console.error("Error searching messages by email:", error);
        throw error;
      }
    },
    enabled: !!specificEmail && !!user?.id,
    staleTime: 5000 // Cache for 5 seconds
  });

  // Query Room Messages if roomId is provided and useRoomMessages is true
  const {
    data: roomMessagesData,
    isLoading: isLoadingRoomMessages,
    error: roomMessagesError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch
  } = useQuery({
    queryKey: ["room_messages", roomId, page],
    queryFn: async () => {
      if (!roomId) return { messages: [], hasMore: false };
      
      try {
        console.log(`Fetching room messages for room: ${roomId}, page: ${page}`);
        const limit = 50;
        const offset = (page - 1) * limit;
        
        const { data, error } = await supabase.rpc('get_room_messages', {
          p_room_id: roomId,
          p_limit: limit,
          p_offset: offset
        });
        
        if (error) throw error;
        
        console.log(`Retrieved ${data?.length || 0} room messages for page ${page}`);
        
        // Format the messages to match the structure expected by the component
        const formattedMessages = data.map(msg => ({
          id: msg.id,
          message: msg.message,
          message_type: 'text',
          created_at: msg.created_at,
          read: true, // Room messages don't have a read status in the same way
          sender: {
            id: msg.sender_id,
            // We'll populate these from care team members or use defaults
            first_name: getSenderInfo(msg.sender_id).name.split(' ')[0],
            last_name: getSenderInfo(msg.sender_id).name.split(' ').slice(1).join(' '),
            role: getSenderInfo(msg.sender_id).role
          }
        }));
        
        return { 
          messages: formattedMessages || [], 
          hasMore: (data?.length || 0) >= limit,
          page: page
        };
      } catch (error) {
        console.error("Error fetching room messages:", error);
        throw error;
      }
    },
    enabled: !!roomId && useRoomMessages,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    keepPreviousData: true // Keep previous data while fetching new data
  });

  // Original query for direct/group chat messages
  const {
    data: chatMessagesData,
    isLoading: isLoadingChatMessages,
    error: chatMessagesError
  } = useQuery({
    queryKey: ["chat_messages", user?.id, selectedUserId, groupChat, page],
    queryFn: async () => {
      if (!user?.id || !selectedUserId) return { messages: [], hasMore: false };
      
      try {
        console.log("Fetching messages for user:", selectedUserId);
        
        const { data, error } = await supabase.functions.invoke('get-chat-messages', {
          body: { 
            user_id: user.id,
            other_user_id: selectedUserId,
            is_group_chat: groupChat,
            care_team_members: careTeamMembers.map(m => m.id),
            include_care_team_messages: true,
            page,
            per_page: 50
          }
        });
        
        if (error) throw error;
        
        return { 
          messages: data.messages || [], 
          hasMore: data.hasMore || false 
        };
      } catch (error) {
        console.error("Error fetching messages:", error);
        throw error;
      }
    },
    enabled: !!user?.id && !!selectedUserId && !useRoomMessages && !specificEmail && !offlineMode,
    staleTime: 5000 // Cache for 5 seconds
  });

  // Choose the appropriate data source
  let isLoading = false;
  let error = null;
  let messagesData = { messages: [], hasMore: false };
  
  if (specificEmail) {
    isLoading = isLoadingEmailMessages;
    error = emailMessagesError;
    messagesData = emailMessagesData || { messages: [], hasMore: false };
  } else if (useRoomMessages) {
    isLoading = isLoadingRoomMessages;
    error = roomMessagesError;
    messagesData = roomMessagesData || { messages: [], hasMore: false };
  } else if (!offlineMode) {
    isLoading = isLoadingChatMessages;
    error = chatMessagesError;
    messagesData = chatMessagesData || { messages: [], hasMore: false };
  }
  
  // State to track all historical messages
  const [allHistoricalMessages, setAllHistoricalMessages] = useState<any[]>([]);
  
  // Update historical messages when new messages come in
  useEffect(() => {
    if (messagesData && messagesData.messages) {
      if (page === 1) {
        setAllHistoricalMessages(messagesData.messages);
      } else {
        // For page > 1, add messages at the beginning (older messages)
        setAllHistoricalMessages(prev => {
          // Create a Set of IDs for O(1) lookup
          const existingIds = new Set(prev.map(msg => msg.id));
          // Only add messages that don't already exist
          const newMessages = messagesData.messages.filter(msg => !existingIds.has(msg.id));
          return [...newMessages, ...prev];
        });
      }
      
      // Update hasMore state
      setHasMoreMessages(messagesData.hasMore);
    }
  }, [messagesData, page]);
  
  // Combine all messages - historical and local
  const allMessages = [
    ...allHistoricalMessages,
    ...localMessages
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && page === 1) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [allMessages, page]);
  
  // Handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      // If less than 100px from the bottom, hide the scroll button
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
      
      // If at the top and there are more messages, load more
      if (scrollTop === 0 && hasMoreMessages) {
        setPage(prev => prev + 1);
      }
    };
    
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [hasMoreMessages]);
  
  // Function to scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getDateLabel = (timestamp: string) => {
    return format(new Date(timestamp), 'MMM d, yyyy');
  };

  // Group messages by date for better readability
  const groupedMessages: { [key: string]: typeof allMessages } = {};
  allMessages.forEach(msg => {
    const date = getDateLabel(msg.created_at);
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(msg);
  });

  if (isLoading && allMessages.length === 0) {
    return (
      <div className="flex-1 p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
            <Skeleton className={`h-14 w-2/3 rounded-lg ${i % 2 === 0 ? 'bg-primary/5' : 'bg-muted'}`} />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-destructive text-center p-4">
          <p>Error loading messages</p>
          <p className="text-sm mt-1">Please try again later</p>
        </div>
      </div>
    );
  }

  if (!selectedUserId && !specificEmail && !roomId) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>Select a contact to start chatting</p>
      </div>
    );
  }

  return (
    <ScrollArea 
      className="flex-1 p-4 relative" 
      ref={scrollRef}
    >
      {allMessages.length === 0 ? (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          <p>No messages yet. Start a conversation!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {hasMoreMessages && page === 1 && (
            <div className="text-center mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(prev => prev + 1)}
                disabled={isFetchingNextPage}
                className="text-xs"
              >
                {isFetchingNextPage ? 'Loading...' : 'Load older messages'}
              </Button>
            </div>
          )}
          
          {isFetchingNextPage && page > 1 && (
            <div className="text-center mb-4">
              <Skeleton className="h-8 w-32 mx-auto" />
            </div>
          )}
          
          {Object.entries(groupedMessages).map(([date, messages]) => (
            <div key={date} className="space-y-4">
              <div className="relative flex py-2">
                <div className="flex-grow border-t border-muted-foreground/20 my-2"></div>
                <span className="flex-shrink mx-4 text-muted-foreground text-xs">{date}</span>
                <div className="flex-grow border-t border-muted-foreground/20 my-2"></div>
              </div>
              
              {messages.map((message) => {
                const isCurrentUser = message.sender?.id === user?.id;
                const senderName = `${message.sender?.first_name || ''} ${message.sender?.last_name || ''}`.trim();
                const senderRole = message.sender?.role || 'user';
                
                return (
                  <div 
                    key={message.id} 
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-lg p-3 shadow-sm ${
                        isCurrentUser 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-background'
                      }`}
                    >
                      {!isCurrentUser && (groupChat || useRoomMessages) && (
                        <div className="mb-1">
                          <p className={`text-xs font-medium capitalize ${
                            senderRole === 'doctor' ? 'text-blue-600 dark:text-blue-400' :
                            senderRole === 'nutritionist' ? 'text-green-600 dark:text-green-400' :
                            senderRole === 'aibot' ? 'text-cyan-600 dark:text-cyan-400' :
                            'text-muted-foreground'
                          }`}>
                            {senderName}
                          </p>
                        </div>
                      )}
                      
                      <p className="whitespace-pre-wrap break-words text-sm">{message.message}</p>
                      
                      <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70">
                        {format(new Date(message.created_at), 'p')}
                        {isCurrentUser && message.read && (
                          <CheckCircle className="h-3 w-3 text-blue-400 ml-0.5" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
      
      {showScrollButton && (
        <Button 
          size="icon"
          variant="secondary"
          className="absolute bottom-4 right-4 h-8 w-8 rounded-full shadow-md"
          onClick={scrollToBottom}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      )}
    </ScrollArea>
  );
};
