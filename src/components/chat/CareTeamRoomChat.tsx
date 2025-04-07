
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, ArrowDown, Brain, User, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface RoomMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  message: string;
  is_system_message: boolean;
  is_ai_message: boolean;
  created_at: string;
}

interface CareTeamRoom {
  room_id: string;
  room_name: string;
  room_description: string;
  patient_id: string;
  patient_name: string;
  member_count: number;
  last_message: string;
  last_message_time: string;
}

interface CareTeamRoomChatProps {
  selectedRoomId: string | null;
  onBack?: () => void;
  isMobileView?: boolean;
}

export const CareTeamRoomChat = ({ 
  selectedRoomId, 
  onBack, 
  isMobileView = false 
}: CareTeamRoomChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  // Query to get room details
  const { data: roomDetails } = useQuery({
    queryKey: ["care_team_room", selectedRoomId],
    queryFn: async () => {
      if (!selectedRoomId || !user?.id) return null;
      
      const { data, error } = await supabase
        .rpc('get_user_care_team_rooms', { p_user_id: user.id });
        
      if (error) {
        console.error("Error fetching room details:", error);
        throw error;
      }
      
      return data.find((room: CareTeamRoom) => room.room_id === selectedRoomId) || null;
    },
    enabled: !!selectedRoomId && !!user?.id
  });

  // Query to get room messages
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["room_messages", selectedRoomId],
    queryFn: async () => {
      if (!selectedRoomId) return [];
      
      const { data, error } = await supabase
        .rpc('get_room_messages', { 
          p_room_id: selectedRoomId,
          p_limit: 50,
          p_offset: 0
        });
        
      if (error) {
        console.error("Error fetching messages:", error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!selectedRoomId,
    refetchInterval: 5000
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle scroll to show/hide scroll-to-bottom button
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollViewportRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = scrollViewportRef.current;
      const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
      
      setShowScrollButton(isScrolledUp);
    };

    const scrollElement = scrollViewportRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedRoomId || !user?.id) return;
    
    try {
      setIsLoading(true);
      
      // Send message using the RPC function
      const { data, error } = await supabase.rpc('send_room_message', {
        p_room_id: selectedRoomId,
        p_message: message
      });
      
      if (error) throw error;
      
      // Clear the input
      setMessage("");
      
      // Invalidate the messages query to refresh
      queryClient.invalidateQueries({ queryKey: ["room_messages", selectedRoomId] });
      
      // Check if we should trigger an AI response
      if (message.toLowerCase().includes('@ai') || message.toLowerCase().includes('@assistant')) {
        try {
          const { data: aiResponse, error: aiError } = await supabase.functions.invoke(
            'care-team-ai-chat',
            {
              body: { roomId: selectedRoomId, message: message.trim() }
            }
          );
          
          if (aiError) {
            console.error("AI chat error:", aiError);
          }
          
          // Refresh messages to show AI response
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["room_messages", selectedRoomId] });
          }, 1000);
          
        } catch (aiErr) {
          console.error("Error invoking AI chat:", aiErr);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error sending message",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get initial letters for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Get avatar color based on role
  const getAvatarColorClass = (role: string) => {
    switch (role.toLowerCase()) {
      case 'doctor':
        return 'bg-blue-100 text-blue-800';
      case 'nutritionist':
        return 'bg-green-100 text-green-800';
      case 'patient':
        return 'bg-orange-100 text-orange-800';
      case 'aibot':
      case 'assistant':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Group messages by day
  const groupMessagesByDay = (messages: RoomMessage[]) => {
    const groups: Record<string, RoomMessage[]> = {};
    
    messages?.forEach(msg => {
      const date = new Date(msg.created_at);
      const day = format(date, 'yyyy-MM-dd');
      
      if (!groups[day]) {
        groups[day] = [];
      }
      
      groups[day].push(msg);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDay(messages || []);

  if (!selectedRoomId) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Select a care team to start chatting
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 bg-muted/40 border-b flex items-center">
        {isMobileView && onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
            <ArrowDown className="rotate-90 h-4 w-4" />
          </Button>
        )}
        
        <Users className="h-5 w-5 mr-2 text-primary" />
        
        <div className="flex-1">
          <div className="font-medium line-clamp-1">
            {roomDetails?.room_name || "Care Team Chat"}
          </div>
          
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <User className="h-3 w-3 mr-1" />
            {roomDetails?.patient_name || "Patient"} • 
            <Badge variant="outline" className="text-xs h-4 ml-1">
              {roomDetails?.member_count || 0} members
            </Badge>
          </div>
        </div>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 bg-[#f0f2f5] dark:bg-slate-900 overflow-hidden relative">
        <ScrollArea className="h-full" viewportRef={scrollViewportRef}>
          <div className="p-4 space-y-6">
            {messagesLoading ? (
              <div className="flex justify-center pt-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : messages?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No messages yet. Start the conversation!
              </div>
            ) : (
              Object.entries(messageGroups).map(([day, dayMessages]) => (
                <div key={day} className="space-y-3">
                  <div className="flex justify-center">
                    <Badge variant="outline" className="bg-background/80">
                      {format(new Date(day), 'MMMM d, yyyy')}
                    </Badge>
                  </div>
                  
                  {dayMessages.map((msg) => {
                    const isSelf = msg.sender_id === user?.id;
                    const isAI = msg.is_ai_message;
                    const isSystem = msg.is_system_message;
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="flex gap-2 max-w-[80%]">
                          {!isSelf && !isSystem && (
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarFallback className={getAvatarColorClass(msg.sender_role)}>
                                {isAI ? <Brain className="h-4 w-4" /> : getInitials(msg.sender_name)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div>
                            {!isSelf && !isSystem && (
                              <div className="text-xs font-medium mb-1">
                                {msg.sender_name}
                                <span className="text-xs text-muted-foreground ml-1">
                                  {msg.sender_role}
                                </span>
                              </div>
                            )}
                            
                            <div
                              className={`rounded-lg p-3 text-sm relative
                                ${isSystem 
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-center mx-auto' 
                                  : isSelf
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-muted'}
                              `}
                            >
                              {isAI && (
                                <Brain className="h-3 w-3 absolute top-2 right-2 text-purple-500" />
                              )}
                              {msg.message}
                              <div className="text-xs opacity-70 mt-1">
                                {format(new Date(msg.created_at), 'h:mm a')}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* Scroll to bottom button */}
        {showScrollButton && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute bottom-4 right-4 h-8 w-8 rounded-full shadow-md"
            onClick={scrollToBottom}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Message input */}
      <div className="p-3 bg-background border-t">
        <div className="flex gap-2">
          <Textarea
            placeholder="Type a message... (Use @AI to ask the AI assistant)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="resize-none min-h-[50px] max-h-[120px]"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button 
            onClick={handleSendMessage} 
            size="icon" 
            className="h-[50px] w-[50px] rounded-full flex-shrink-0"
            disabled={isLoading || !message.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
