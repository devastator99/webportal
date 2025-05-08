
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
  fullScreen?: boolean;
  leftAligned?: boolean;
}

const PAGE_SIZE = 100;

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

  // Helper to fetch messages (with DESC order for pagination)
  const fetchMessages = async (roomId: string, pageNum: number, isLoadingMore = false) => {
    if (!roomId) return;
    try {
      if (!isLoadingMore) setIsLoading(true);
      setRoomError(null);
      // Pull messages in DESC order for most-recent pagination
      const { data, error } = await supabase.rpc('get_room_messages_with_role', {
        p_room_id: roomId,
        p_limit: PAGE_SIZE,
        p_offset: (pageNum - 1) * PAGE_SIZE,
        p_user_role: userRole || 'patient'
      });
      if (error) {
        setRoomError(`Failed to load messages: ${error.message}`);
        throw error;
      }

      // Messages are sorted ASC from SQL, so reverse for DESC
      const latestPage = Array.isArray(data) ? [...data].reverse() : [];

      if (isLoadingMore) {
        setMessages(prev => {
          // Prepend older messages--nothing duplicated
          const existingIds = new Set(prev.map(m => m.id));
          const nonDuped = latestPage.filter(
            m => !existingIds.has(m.id)
          );
          // Prepend older ones at start
          return [...nonDuped, ...prev];
        });
      } else {
        setMessages(latestPage);
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
  }, [roomId, useRoomMessages]);

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
            fetchMessages(roomId, 1, false); // Always reload most recent page
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

  // The messages are now loaded in newest-first order; reverse before rendering
  const allMessages = [...messages]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const messageGroups = groupMessagesByDate(allMessages);

  // Load more handler: loads the next oldest page
  const handleLoadMore = async () => {
    if (!roomId || loadingMore || !hasMoreMessages) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchMessages(roomId, nextPage, true); // Prepend older messages
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
        {/* Load more messages button at the top */}
        {hasMoreMessages && (
          <div className="flex justify-center my-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="rounded-full"
            >
              {loadingMore ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <ArrowUpCircle className="w-4 h-4 mr-2" />}
              Load more messages
            </Button>
          </div>
        )}

        <div className="space-y-6 message-groups" data-testid="message-groups-container">
          {Object.keys(messageGroups).length > 0 ? (
            Object.entries(messageGroups)
              .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
              .map(([dateString, dayMessages], index, array) => {
                const isLatestGroup = index === array.length - 1;
                return (
                  <CollapsibleMessageGroup 
                    key={dateString} 
                    date={dateString}
                    messages={dayMessages}
                    isLatestGroup={isLatestGroup}
                  >
                    {dayMessages
                      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
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
                                
                                <div
                                  className={`p-3 rounded-lg text-sm shadow-sm ${
                                    message.is_system_message 
                                      ? 'bg-muted/70 text-muted-foreground text-xs italic' 
                                      : isCurrentUser && !leftAligned
                                        ? 'bg-[#9b87f5]/90 text-white' 
                                        : isAi
                                          ? 'bg-purple-50/80 dark:bg-purple-900/10'
                                          : 'bg-neutral-100/80 dark:bg-neutral-800/50'
                                  }`}
                                >
                                  <p className="whitespace-pre-wrap">
                                    {message.message}
                                  </p>
                                  <div className="text-[10px] opacity-70 mt-1 text-right">
                                    {new Date(message.created_at).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                    {isCurrentUser && (
                                      <span className="ml-1">✓</span>
                                    )}
                                  </div>
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
