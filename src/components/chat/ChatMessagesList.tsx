import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowUp, Bot, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GetRoomMessagesParams, AnyRole } from "@/types/auth";
import { CollapsibleMessageGroup } from './CollapsibleMessageGroup';
import { sortByDate } from "@/utils/dateUtils";

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
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const limit = 50; // Limit of messages to fetch
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  const fetchMessages = async (roomId: string, pageNum: number) => {
    if (!roomId) return;
    
    try {
      setIsLoadingMessages(true);
      setRoomError(null);
      console.log(`Fetching messages for room ${roomId}, page ${pageNum}`);
      
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
      
      if (data && data.length > 0) {
        const sortedData = sortByDate(data, 'created_at', false); // Sort in descending order
        
        if (pageNum === 1) {
          setMessages(sortedData);
        } else {
          // Append older messages at the top
          setMessages(prev => [...sortedData, ...prev]);
        }
        setHasMoreMessages(data.length === 50);
      } else {
        if (pageNum === 1) {
          setMessages([]);
        }
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error("Error in fetchMessages:", error);
      toast({
        title: "Error loading messages",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (roomId && useRoomMessages) {
      fetchMessages(roomId, 1);
    }
  }, [roomId, useRoomMessages]);

  useEffect(() => {
    if (!isLoading && !loadingMore) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, loadingMore]);

  const allMessages = [
    ...messages,
    ...localMessages.filter(m => !messages.some(serverMsg => serverMsg.id === m.id))
  ].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const handleLoadMore = () => {
    if (roomId && hasMoreMessages && !isLoadingMessages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMessages(roomId, nextPage);
    }
  };

  const handleRequestSummary = async () => {
    if (!roomId || !['doctor', 'nutritionist'].includes(userRole || '')) return;

    try {
      const { data, error } = await supabase.functions.invoke('generate-chat-summary', {
        body: { roomId }
      });

      if (error) throw error;

      toast({
        title: "Summary requested",
        description: "An AI summary of the conversation will be generated shortly.",
      });
    } catch (error) {
      console.error("Error requesting summary:", error);
      toast({
        title: "Error requesting summary",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  const groupMessagesByDay = (messages: any[]) => {
    const groups: Record<string, any[]> = {};
    
    messages.forEach(msg => {
      const date = new Date(msg.created_at);
      const day = format(date, 'yyyy-MM-dd');
      
      if (!groups[day]) {
        groups[day] = [];
      }
      
      groups[day].push(msg);
    });
    
    return Object.entries(groups)
      .sort(([dayA], [dayB]) => new Date(dayA).getTime() - new Date(dayB).getTime())
      .reduce((acc, [day, messages]) => {
        acc[day] = messages;
        return acc;
      }, {} as Record<string, any[]>);
  };

  const messageGroups = groupMessagesByDay(allMessages);

  const getAvatarInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getAvatarColorClass = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'doctor':
        return 'bg-blue-100 text-blue-800';
      case 'nutritionist':
        return 'bg-green-100 text-green-800';
      case 'patient':
        return 'bg-orange-100 text-orange-800';
      case 'aibot':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
    <ScrollArea className="flex-1 p-4">
      {hasMoreMessages && !isLoadingMessages && messages.length > 0 && (
        <div className="flex justify-center mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLoadMore}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Load older messages
          </Button>
        </div>
      )}
      
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
      ) : messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
          <MessageCircle className="h-12 w-12 mb-2 opacity-20" />
          <p>No messages yet</p>
          <p className="text-xs">Start a conversation with your care team</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(messageGroups)
            .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
            .map(([day, dayMessages]) => (
              <CollapsibleMessageGroup 
                key={day} 
                date={day}
                messages={dayMessages}
              >
                {dayMessages
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((message) => {
                    const isCurrentUser = message.sender_id === user?.id;
                    const isAi = message.is_ai_message || message.sender_id === '00000000-0000-0000-0000-000000000000';
                    
                    return (
                      <div 
                        key={message.id} 
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
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
            ))}
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </ScrollArea>
  );
};
