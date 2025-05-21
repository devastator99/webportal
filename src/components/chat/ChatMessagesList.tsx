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

// Set page size to 200 for more message history
const PAGE_SIZE = 200;

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
  read_by?: any; // Added read_by to fix type issues
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

  const { 
    endRef, 
    containerRef, 
    showScrollButton, 
    scrollToBottom,
    hasScrolledUp
  } = useChatScroll({
    messages: [...messages, ...localMessages],
    loadingMessages: isLoading,
    loadingMore,
    isNewMessage: newMessageAdded,
    messagesToShow: messages.length
  });

  // Helper to fetch messages - ensuring we get most recent messages first
  const fetchMessages = async (roomId: string, pageNum: number, isLoadingMore = false) => {
    if (!roomId) return;
    try {
      if (!isLoadingMore) setIsLoading(true);
      setRoomError(null);
      
      console.log(`Fetching messages for room: ${roomId}, page: ${pageNum}, pageSize: ${PAGE_SIZE}`);
      
      // Important change: added column for read_by and explicitly requesting messages in descending order by created_at
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
      
      // Important: We're keeping the order exactly as received from database
      // Messages are already returned in descending order (newest first)
      // No sorting needed
      const latestMessages = [...data];
      
      if (latestMessages.length > 0) {
        console.log("First message date:", new Date(latestMessages[0]?.created_at).toLocaleString());
        console.log("Last message date:", new Date(latestMessages[latestMessages.length - 1]?.created_at).toLocaleString());
      }
      
      if (isLoadingMore) {
        setMessages(prev => {
          // Avoid duplicates when adding older messages
          const existingIds = new Set(prev.map(m => m.id));
          const nonDuped = latestMessages.filter(m => !existingIds.has(m.id));
          console.log(`Adding ${nonDuped.length} older messages`);
          // Keep newest first order when adding older messages to the end
          return [...prev, ...nonDuped];
        });
      } else {
        console.log(`Setting ${latestMessages.length} new messages`);
        setMessages(latestMessages);
      }

      setHasMoreMessages(Array.isArray(data) && data.length === PAGE_SIZE);
      setNewMessageAdded(false);
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
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line
  }, [roomId, messages]);

  // Merge local messages (optimistic, not in server)
  useEffect(() => {
    if (localMessages.length > 0) {
      const newLocalMessages = localMessages.filter(
        m => !messages.some(serverMsg => serverMsg.id === m.id)
      );
      if (newLocalMessages.length > 0) {
        // For local messages, prepend them (keeping newest first order)
        const updatedMessages = [
          ...newLocalMessages,
          ...messages
        ];
        setMessages(updatedMessages);
        setNewMessageAdded(true);
      }
    }
  }, [localMessages, messages]);

  // Add message delete handler
  const handleMessageDelete = () => {
    console.log("Message deleted, refreshing messages");
    // Trigger a refresh of messages
    setRefreshTrigger(prev => prev + 1);
  };

  // The messages are already loaded in newest-first order
  const allMessages = [...messages];
  
  console.log(`Rendering ${allMessages.length} messages in total`);
  
  // Group messages by date
  const messageGroups = groupMessagesByDate(allMessages);
  console.log(`Grouped into ${Object.keys(messageGroups).length} date groups`);

  // Load more handler: loads the next oldest page
  const handleLoadMore = async () => {
    if (!roomId || loadingMore || !hasMoreMessages) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchMessages(roomId, nextPage, true); // Append older messages
  };

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
        
        {/* Display messages from newest to oldest */}
        <div className="space-y-6 message-groups" data-testid="message-groups-container">
          {Object.keys(messageGroups).length > 0 ? (
            Object.entries(messageGroups)
              .sort(([dateA], [dateB]) => dateB.localeCompare(dateA)) // Newest date groups first
              .map(([dateString, dayMessages], index, array) => {
                const isLatestGroup = index === 0; // First group is now latest
                return (
                  <CollapsibleMessageGroup 
                    key={dateString} 
                    date={dateString}
                    messages={dayMessages}
                    isLatestGroup={isLatestGroup}
                  >
                    {dayMessages
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) // Newest first within each group
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
                            className={`flex ${leftAligned || !isCurrentUser ? 'justify-start' : 'justify-end'} my-2`}
                          >
                            <div className="flex items-start gap-2 max-w-[75%]">
                              {(!isCurrentUser || leftAligned) && !message.is_system_message && (
                                <Avatar className="h-8 w-8">
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
                              
                              <div>
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
                  </CollapsibleMessageGroup>
                );
              })
          ) : (
            <div className="text-center text-muted-foreground">
              No messages to display
            </div>
          )}
        </div>
        
        {showScrollButton && (
          <Button
            size="icon"
            variant="secondary"
            className="fixed bottom-24 right-4 h-8 w-8 rounded-full shadow-md z-10"
            onClick={scrollToBottom}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        )}
        
        <div ref={endRef} />
      </ScrollArea>
    </ErrorBoundary>
  );
};
