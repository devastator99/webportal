
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CollapsibleMessageGroup } from './CollapsibleMessageGroup';
import { sortByDate, groupMessagesByDate, isToday } from "@/utils/dateUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { useChatScroll } from "@/hooks/useChatScroll";

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  message: string;
  is_system_message: boolean;
  is_ai_message: boolean;
  created_at: string;
}

interface ChatMessagesListProps {
  roomId?: string;
  localMessages?: any[];
  careTeamMembers?: any[];
  useRoomMessages?: boolean;
  selectedUserId?: string;
  offlineMode?: boolean;
}

export const ChatMessagesList = ({ 
  roomId, 
  localMessages = [], 
  careTeamMembers = [],
  useRoomMessages = false,
  selectedUserId,
  offlineMode = false
}: ChatMessagesListProps) => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalMessageCount, setTotalMessageCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [newMessageAdded, setNewMessageAdded] = useState(false);
  
  // Use our custom scroll hook
  const { 
    endRef, 
    containerRef, 
    showScrollButton, 
    scrollToBottom,
    hasScrolledUp
  } = useChatScroll({
    messages: [...messages, ...localMessages],
    loadingMessages: isLoadingMessages,
    loadingMore,
    isNewMessage: newMessageAdded,
    messagesToShow: messages.length
  });

  // Setup real-time subscription for new messages
  useEffect(() => {
    if (!roomId) return;

    // Subscribe to realtime updates for the chat room
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
          console.log('New message received via realtime:', payload);
          // Don't add duplicates
          if (!messages.some(m => m.id === payload.new.id)) {
            fetchMessages(roomId, 1);
            setNewMessageAdded(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, messages]);

  const fetchMessages = async (roomId: string, pageNum: number, isLoadingMore = false) => {
    if (!roomId) return;
    
    try {
      if (!isLoadingMore) {
        setIsLoadingMessages(true);
      }
      setRoomError(null);
      console.log(`Fetching messages for room ${roomId}, page ${pageNum}, isLoadingMore: ${isLoadingMore}`);
      
      const { data, error } = await supabase.rpc('get_room_messages_with_role', {
        p_room_id: roomId,
        p_limit: 50,
        p_offset: (pageNum - 1) * 50,
        p_user_role: userRole || 'patient'
      });
      
      if (error) {
        console.error("Error fetching messages:", error);
        setRoomError(`Failed to load messages: ${error.message}`);
        throw error;
      }
      
      console.log(`Retrieved ${data?.length || 0} messages from API`);
      
      if (data && data.length > 0) {
        if (isLoadingMore) {
          // When loading older messages, add them before current messages
          setMessages(prev => {
            // Filter out duplicates
            const newMessages = data.filter(
              newMsg => !prev.some(existingMsg => existingMsg.id === newMsg.id)
            );
            return [...newMessages, ...prev];
          });
        } else {
          // For initial load or refresh, replace the messages
          setMessages(data);
        }
        setHasMoreMessages(data.length === 50);
      } else {
        if (!isLoadingMore) {
          setMessages([]);
        }
        setHasMoreMessages(false);
      }
      
      // Reset the new message flag after message fetch
      setNewMessageAdded(false);
    } catch (error) {
      console.error("Error in fetchMessages:", error);
      if (!isLoadingMore) {
        setIsLoading(false);
      }
      toast({
        title: "Error loading messages",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      if (!isLoadingMore) {
        setIsLoadingMessages(false);
      }
      setLoadingMore(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (roomId && useRoomMessages) {
      setIsLoading(true);
      fetchMessages(roomId, 1);
    } else {
      setIsLoading(false);
    }
  }, [roomId, useRoomMessages]);

  // Update the message combination logic to include new localMessages
  useEffect(() => {
    if (localMessages.length > 0) {
      // First, check if there are actually new messages
      const newLocalMessages = localMessages.filter(
        m => !messages.some(serverMsg => serverMsg.id === m.id)
      );
      
      if (newLocalMessages.length > 0) {
        // Combine server messages with local messages
        const updatedMessages = [
          ...messages,
          ...newLocalMessages
        ].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        setMessages(updatedMessages);
        setNewMessageAdded(true);
      }
    }
  }, [localMessages, messages]);

  // This function is commented out as requested
  /*
  const handleLoadMore = () => {
    if (roomId && hasMoreMessages && !isLoadingMessages && !loadingMore) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMessages(roomId, nextPage, true);
    }
  };
  */

  // Get all messages from both server and local sources
  const allMessages = [
    ...messages,
    ...localMessages.filter(m => !messages.some(serverMsg => serverMsg.id === m.id))
  ].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Use the utility function to group messages by date
  const messageGroups = groupMessagesByDate(allMessages);

  if (isLoading) {
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

  if (roomId && !allMessages.length) {
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
      >
        {/* Load more button commented out as requested
        {hasMoreMessages && !isLoadingMessages && messages.length > 0 && (
          <div className="flex justify-center mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLoadMore}
              className="text-xs text-muted-foreground hover:text-foreground"
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load older messages'
              )}
            </Button>
          </div>
        )}
        */}
        
        {isLoadingMessages && page === 1 ? (
          <div className="flex flex-col space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-start gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-16 w-72" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 && allMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
            <ChevronDown className="h-12 w-12 mb-2 opacity-20" />
            <p>No messages yet</p>
            <p className="text-xs">Start a conversation with your care team</p>
          </div>
        ) : (
          <div className="space-y-6 message-groups" data-testid="message-groups-container">
            {Object.keys(messageGroups).length > 0 ? (
              Object.entries(messageGroups)
                // Sort by date - oldest first (ascending) to have newest at bottom
                .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                .map(([day, dayMessages], index, array) => {
                  const isLatestGroup = index === array.length - 1; // Last group is the latest
                  const isTodayGroup = isToday(new Date(day));
                  
                  return (
                    <CollapsibleMessageGroup 
                      key={day} 
                      date={day}
                      messages={dayMessages}
                      isLatestGroup={isTodayGroup}
                    >
                      {dayMessages
                        // Sort messages within a day by time (oldest to newest for proper chronological display)
                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                        .map((message) => {
                          const isCurrentUser = message.sender_id === user?.id;
                          const isAi = message.is_ai_message || message.sender_id === '00000000-0000-0000-0000-000000000000';
                          
                          return (
                            <div 
                              key={message.id} 
                              id={`message-${message.id}`}
                              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} my-2 message-item`}
                              data-message-id={message.id}
                              data-created-at={message.created_at}
                            >
                              <div className="flex items-start gap-2 max-w-[80%]">
                                {!isCurrentUser && !message.is_system_message && (
                                  <Avatar className="h-8 w-8">
                                    {isAi ? (
                                      <AvatarFallback className="bg-purple-100 text-purple-800">
                                        AI
                                      </AvatarFallback>
                                    ) : (
                                      <AvatarFallback>
                                        {message.sender_name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                )}
                                
                                <div className={`space-y-1 ${isCurrentUser ? 'order-first mr-2' : 'ml-0'}`}>
                                  {!isCurrentUser && !message.is_system_message && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs font-medium">
                                        {isAi ? 'AI Assistant' : message.sender_name}
                                      </span>
                                      {message.sender_role && (
                                        <Badge variant="outline" className="text-[10px] py-0 px-1">
                                          {message.sender_role}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                  
                                  <div 
                                    className={`p-3 rounded-lg ${
                                      message.is_system_message 
                                        ? 'bg-muted text-muted-foreground text-xs italic' 
                                        : isCurrentUser
                                          ? 'bg-primary text-primary-foreground'
                                          : isAi
                                            ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800'
                                            : 'bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700'
                                    }`}
                                  >
                                    {message.message.startsWith('[FILE]') ? (
                                      <div>
                                        <div className="flex items-center gap-2 text-xs">
                                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file">
                                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                                            <polyline points="14 2 14 8 20 8"/>
                                          </svg>
                                          <a 
                                            href={message.message.split(' - ')[1]} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="underline"
                                          >
                                            {message.message.split(' - ')[0].replace('[FILE] ', '')}
                                          </a>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                                    )}
                                    <p className="text-[10px] opacity-70 mt-1">
                                      {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </CollapsibleMessageGroup>
                  );
                })
            ) : (
              <div className="text-center text-muted-foreground">
                No messages to display
              </div>
            )}
          </div>
        )}
        
        <div ref={endRef} />
      </ScrollArea>
      
      {showScrollButton && (
        <Button
          size="icon"
          variant="secondary"
          className="fixed bottom-20 right-4 h-8 w-8 rounded-full shadow-md z-10"
          onClick={scrollToBottom}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      )}
    </ErrorBoundary>
  );
};
