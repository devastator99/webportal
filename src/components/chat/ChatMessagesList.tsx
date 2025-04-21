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

  const fetchMessages = async (roomId: string, offset = 0, append = false) => {
    try {
      setIsLoading(!append);
      setLoadingMore(append);

      // Call the get_room_messages RPC with explicit role handling
      const { data, error } = await supabase.rpc('get_room_messages', {
        p_room_id: roomId,
        p_limit: limit,
        p_offset: offset,
        p_user_role: userRole || 'patient' // Explicitly set role with patient as fallback
      } as any); // Type assertion to bypass TypeScript checking temporarily

      if (error) {
        console.error("Error fetching messages:", error);
        throw error;
      }

      const { count, error: countError } = await supabase
        .from('room_messages')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId);

      if (countError) {
        console.error("Error fetching message count:", countError);
      } else {
        const messageCount = count || 0;
        setTotalMessageCount(messageCount);
        setHasMore((offset + limit) < messageCount);
      }

      const sortedMessages = data.sort((a: Message, b: Message) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      if (append) {
        setMessages(prev => [...sortedMessages, ...prev]);
      } else {
        setMessages(sortedMessages);
      }
    } catch (error) {
      console.error("Error in fetchMessages:", error);
      toast({
        title: "Error loading messages",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (roomId && useRoomMessages) {
      fetchMessages(roomId);
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
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const handleLoadMore = () => {
    if (roomId && hasMore) {
      const newOffset = offset + limit;
      setOffset(newOffset);
      fetchMessages(roomId, newOffset, true);
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
      .sort(([dayA], [dayB]) => new Date(dayB).getTime() - new Date(dayA).getTime())
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
      {hasMore && (
        <div className="flex justify-center mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <ArrowUp className="h-4 w-4 mr-1" />
            )}
            Load older messages
          </Button>
        </div>
      )}

      {['doctor', 'nutritionist'].includes(userRole || '') && (
        <div className="flex justify-center mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRequestSummary}
            className="bg-primary/10 text-primary hover:bg-primary/20"
          >
            <Brain className="h-4 w-4 mr-1" />
            Generate Summary
          </Button>
        </div>
      )}
      
      {Object.entries(messageGroups).map(([day, dayMessages]) => (
        <div key={day} className="space-y-3 mb-6">
          <div className="flex justify-center">
            <Badge variant="outline" className="bg-background/80">
              {format(new Date(day), 'MMMM d, yyyy')}
            </Badge>
          </div>
          
          {dayMessages
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map((message: any) => {
              const isCurrentUser = message.sender_id === user?.id;
              const isSystem = message.is_system_message;
              const isAI = message.is_ai_message;
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex gap-2 max-w-[80%]">
                    {!isCurrentUser && !isSystem && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className={getAvatarColorClass(message.sender_role)}>
                          {isAI ? <Brain className="h-4 w-4" /> : getAvatarInitials(message.sender_name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div>
                      {!isCurrentUser && !isSystem && (
                        <div className="text-xs font-medium mb-1">
                          {message.sender_name}
                          <span className="text-xs text-muted-foreground ml-1">
                            {message.sender_role}
                          </span>
                        </div>
                      )}
                      
                      <div
                        className={`rounded-lg p-3 text-sm relative
                          ${isSystem 
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-center mx-auto max-w-md' 
                            : isCurrentUser
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'}
                        `}
                      >
                        {isAI && (
                          <Brain className="h-3 w-3 absolute top-2 right-2 text-purple-500" />
                        )}
                        {message.message}
                        <div className="text-xs opacity-70 mt-1">
                          {format(new Date(message.created_at), 'h:mm a')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </ScrollArea>
  );
};
