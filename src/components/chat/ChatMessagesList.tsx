
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronDown, ArrowUpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CollapsibleMessageGroup } from './CollapsibleMessageGroup';
import { sortByDate, groupMessagesByDate, normalizeDateString } from "@/utils/dateUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { useChatScroll } from "@/hooks/useChatScroll";
import { ChatMessage, ChatMessageProps } from "./ChatMessage";

// Increase the page size to load more older messages at once
const PAGE_SIZE = 500;

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  message: string;
  is_system_message: boolean;
  is_ai_message: boolean;
  created_at: string;
  attachment?: {
    filename: string;
    url: string;
    size?: number;
    type?: string;
  } | null;
  read_by?: any;
}

interface ChatMessagesListProps {
  roomId?: string;
  localMessages?: any[];
  careTeamMembers?: any[];
  useRoomMessages?: boolean;
  selectedUserId?: string;
  offlineMode?: boolean;
  fullScreen?: boolean;
  leftAligned?: boolean;
}

export const ChatMessagesList = ({ 
  roomId, 
  localMessages = [], 
  careTeamMembers = [],
  useRoomMessages = false,
  selectedUserId,
  offlineMode = false,
  fullScreen = false,
  leftAligned = false
}: ChatMessagesListProps) => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [newMessageAdded, setNewMessageAdded] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [initialScrollComplete, setInitialScrollComplete] = useState(false);

  const { 
    endRef, 
    containerRef, 
    showScrollButton, 
    scrollToBottom,
    hasScrolledUp,
    isScrolling
  } = useChatScroll({
    messages: [...messages, ...localMessages],
    loadingMessages: isLoading,
    loadingMore,
    isNewMessage: newMessageAdded,
    messagesToShow: messages.length,
    fullScreen,
    scrollThreshold: 200 // Make it easier to trigger scroll button
  });

  // Helper to fetch messages with improved error handling
  const fetchMessages = async (roomId: string, pageNum: number, isLoadingMore = false) => {
    if (!roomId) return;
    try {
      if (!isLoadingMore) setIsLoading(true);
      setRoomError(null);
      
      console.log(`Fetching messages for room: ${roomId}, page: ${pageNum}, pageSize: ${PAGE_SIZE}`);
      
      // Get messages from the database in descending order (newest first)
      const { data, error } = await supabase.rpc('get_room_messages_with_role', {
        p_room_id: roomId,
        p_limit: PAGE_SIZE,
        p_offset: (pageNum - 1) * PAGE_SIZE,
        p_user_role: userRole || 'patient'
      });
      
      if (error) {
        setRoomError(`Failed to load messages: ${error.message}`);
        console.error("Error loading messages:", error);
        throw error;
      }

      console.log(`Received ${data?.length || 0} messages from server for page ${pageNum}`);
      
      // Make sure data is an array
      if (!Array.isArray(data)) {
        console.warn("Received non-array data from server:", data);
        if (!isLoadingMore) setIsLoading(false);
        return;
      }
      
      // Process messages - reverse the order for display (oldest first)
      const processedMessages = [...data].reverse(); // Reverse to get oldest first for display
      
      if (isLoadingMore) {
        // Preserve scroll position when loading older messages
        const scrollContainer = containerRef.current;
        const oldScrollHeight = scrollContainer?.scrollHeight || 0;
        
        setMessages(prev => {
          // Avoid duplicates when adding older messages
          const existingIds = new Set(prev.map(m => m.id));
          const nonDuped = processedMessages.filter(m => !existingIds.has(m.id));
          console.log(`Adding ${nonDuped.length} older messages at beginning`);
          // Add older messages at the beginning
          return [...nonDuped, ...prev];
        });
        
        // After new messages are rendered, restore scroll position
        setTimeout(() => {
          if (scrollContainer) {
            const newScrollHeight = scrollContainer.scrollHeight;
            const heightDifference = newScrollHeight - oldScrollHeight;
            scrollContainer.scrollTop = scrollContainer.scrollTop + heightDifference;
          }
        }, 10);
      } else {
        console.log(`Setting ${processedMessages.length} new messages in chronological order`);
        setMessages(processedMessages);
      }

      setHasMoreMessages(Array.isArray(data) && data.length === PAGE_SIZE);
      setNewMessageAdded(false);
      
      // After setting messages, scroll to bottom for new messages
      if (!isLoadingMore && !hasScrolledUp && !initialScrollComplete) {
        setTimeout(() => {
          scrollToBottom();
          setInitialScrollComplete(true);
        }, 100);
      }
    } catch (error) {
      if (!isLoadingMore) setIsLoading(false);
      toast({
        title: "Error loading messages",
        description: "Please try again later",
        variant: "destructive"
      });
      console.error("Error in fetchMessages:", error);
    } finally {
      if (!isLoadingMore) setIsLoading(false);
      setLoadingMore(false);
    }
  };

  // Initial loader: load most recent page
  useEffect(() => {
    if (roomId && useRoomMessages) {
      setIsLoading(true);
      setPage(1);
      setInitialScrollComplete(false);
      fetchMessages(roomId, 1, false);
    } else {
      setIsLoading(false);
      setMessages([]);
    }
  }, [roomId, useRoomMessages, refreshTrigger]);

  // Listen for new real-time messages
  useEffect(() => {
    if (!roomId) return;
    const channel = supabase
      .channel(`room_messages:${roomId}`)
      .on('postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_messages',
          filter: `room_id=eq.${roomId}`
        }, 
        (payload) => {
          if (!messages.some(m => m.id === payload.new.id)) {
            // When a new message comes in, fetch the newest page again to ensure we have the latest messages
            fetchMessages(roomId, 1, false);
            setNewMessageAdded(true);
            // Only auto-scroll if user hasn't scrolled up
            if (!hasScrolledUp) {
              scrollToBottom(); 
            }
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line
  }, [roomId, messages, hasScrolledUp]);

  // Merge local messages (optimistic, not in server)
  useEffect(() => {
    if (localMessages.length > 0) {
      const newLocalMessages = localMessages.filter(
        m => !messages.some(serverMsg => serverMsg.id === m.id)
      );
      if (newLocalMessages.length > 0) {
        // Add local messages at the end (newest)
        const updatedMessages = [
          ...messages,
          ...newLocalMessages
        ];
        setMessages(updatedMessages);
        setNewMessageAdded(true);
        scrollToBottom(); // Auto-scroll for new local messages
      }
    }
  }, [localMessages, messages]);

  // Add message delete handler
  const handleMessageDelete = () => {
    console.log("Message deleted, refreshing messages");
    // Trigger a refresh of messages
    setRefreshTrigger(prev => prev + 1);
  };

  // Using all messages in chronological order
  const allMessages = messages;
  
  // Group messages by date
  const messageGroups = groupMessagesByDate(allMessages);

  // Load more handler: loads older messages
  const handleLoadMore = async () => {
    if (!roomId || loadingMore || !hasMoreMessages) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchMessages(roomId, nextPage, true); // Fetch older messages
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!roomId && !allMessages.length) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 text-muted-foreground">
        Select a conversation to start chatting
      </div>
    );
  }

  if (roomId && !allMessages.length && !isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 text-muted-foreground">
        No messages yet. Start the conversation!
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ScrollArea 
        className="flex-1 p-4"
        data-testid="messages-scroll-area"
        viewportRef={containerRef}
        invisibleScrollbar={fullScreen} // Use invisible scrollbar on mobile
      >
        {/* Load more button at the top for older messages */}
        {hasMoreMessages && (
          <div className="flex justify-center mb-4 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="rounded-full"
            >
              {loadingMore ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <ArrowUpCircle className="w-4 h-4 mr-2" />}
              Load older messages
            </Button>
          </div>
        )}
        
        {/* Display loading spinner when loading more messages */}
        {loadingMore && (
          <div className="flex justify-center mb-4">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          </div>
        )}
        
        {/* Display messages in chronological order (oldest to newest) */}
        <div className="space-y-6 message-groups w-full" data-testid="message-groups-container">
          {Object.keys(messageGroups).length > 0 ? (
            Object.entries(messageGroups)
              .sort(([dateA], [dateB]) => dateA.localeCompare(dateB)) // Oldest date groups first
              .map(([dateString, dayMessages], index, array) => {
                const isLatestGroup = index === array.length - 1; // Last group is latest
                return (
                  <CollapsibleMessageGroup 
                    key={dateString} 
                    date={dateString}
                    messages={dayMessages}
                    isLatestGroup={isLatestGroup}
                  >
                    <div className="chat-message-groups">
                      {dayMessages
                        .map((message) => {
                          const isCurrentUser = message.sender_id === user?.id;
                          const isAi = message.is_ai_message || message.sender_id === '00000000-0000-0000-0000-000000000000';
                          
                          // Define sender role-based styles
                          const getSenderRoleColor = (role: string) => {
                            switch(role?.toLowerCase()) {
                              case 'doctor': return 'text-blue-600';
                              case 'nutritionist': return 'text-green-600';
                              case 'patient': return 'text-orange-600';
                              default: return '';
                            }
                          };
                          
                          // Avatar background and text colors
                          const getAvatarColors = (role: string) => {
                            switch(role?.toLowerCase()) {
                              case 'doctor': return 'bg-blue-100 text-blue-800';
                              case 'nutritionist': return 'bg-green-100 text-green-800';
                              case 'patient': return 'bg-orange-100 text-orange-800';
                              default: return 'bg-gray-100 text-gray-800';
                            }
                          };
                          
                          const senderRoleColor = getSenderRoleColor(message.sender_role);
                          const avatarColors = getAvatarColors(message.sender_role);
                          
                          return (
                            <div 
                              key={message.id} 
                              id={`message-${message.id}`}
                              className={`flex ${leftAligned || !isCurrentUser ? 'justify-start' : 'justify-end'} my-2 w-full`}
                            >
                              <div className="flex items-start gap-2 max-w-[75%] w-full">
                                {(!isCurrentUser || leftAligned) && !message.is_system_message && (
                                  <Avatar className="h-8 w-8 flex-shrink-0">
                                    {isAi ? (
                                      <AvatarFallback className="bg-purple-100 text-purple-800">
                                        AI
                                      </AvatarFallback>
                                    ) : (
                                      <AvatarFallback className={avatarColors}>
                                        {message.sender_name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                )}
                                
                                <div className="w-full">
                                  {(!isCurrentUser || leftAligned) && !message.is_system_message && (
                                    <div className="text-xs font-medium mb-1">
                                      <span className={senderRoleColor}>
                                        {isAi ? 'AI Assistant' : message.sender_name}
                                      </span>
                                      {message.sender_role && (
                                        <Badge variant="outline" className="ml-1 text-[10px] py-0 px-1">
                                          {message.sender_role}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                  
                                  <ChatMessage 
                                    message={{
                                      id: message.id,
                                      message: message.message,
                                      created_at: message.created_at,
                                      read: false,
                                      sender: {
                                        id: message.sender_id,
                                        first_name: message.sender_name?.split(' ')[0] || '',
                                        last_name: message.sender_name?.split(' ').slice(1).join(' ') || '',
                                        role: message.sender_role
                                      },
                                      is_system_message: message.is_system_message,
                                      is_ai_message: message.is_ai_message,
                                      attachment: message.attachment
                                    }}
                                    isCurrentUser={isCurrentUser}
                                    showAvatar={false}
                                    offlineMode={offlineMode}
                                    onMessageDelete={handleMessageDelete}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </CollapsibleMessageGroup>
                );
              })
          ) : (
            <div className="text-center text-muted-foreground">
              No messages to display
            </div>
          )}
        </div>
        
        {/* Floating scroll-to-bottom button */}
        {showScrollButton && (
          <Button
            size="icon"
            variant="secondary"
            className="fixed bottom-24 right-4 h-10 w-10 rounded-full shadow-md z-10"
            onClick={scrollToBottom}
          >
            <ChevronDown className="h-5 w-5" />
          </Button>
        )}
        
        <div ref={endRef} />
      </ScrollArea>
    </ErrorBoundary>
  );
};
