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
import { CollapsibleMessageGroup } from "./CollapsibleMessageGroup";

interface RoomMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  message: string;
  is_system_message: boolean;
  is_ai_message: boolean;
  created_at: string;
  read_by: string[] | null;
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

  const { data: roomDetails } = useQuery({
    queryKey: ["care_team_room", selectedRoomId],
    queryFn: async () => {
      if (!selectedRoomId || !user?.id) return null;
      
      try {
        const { data: roomData, error: roomError } = await supabase
          .from('chat_rooms')
          .select('id, name, description, room_type, patient_id, created_at')
          .eq('id', selectedRoomId)
          .single();
          
        if (roomError) {
          console.error("Error fetching room details:", roomError);
          throw roomError;
        }
        
        let patientName = 'Patient';
        if (roomData.patient_id) {
          const { data: patientData, error: patientError } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', roomData.patient_id)
            .single();
            
          if (!patientError && patientData) {
            patientName = `${patientData.first_name || ''} ${patientData.last_name || ''}`.trim();
          }
        }
        
        const { count, error: countError } = await supabase
          .from('room_members')
          .select('*', { count: 'exact', head: true })
          .eq('room_id', selectedRoomId);
          
        if (countError) {
          console.error("Error fetching member count:", countError);
        }
        
        return {
          room_id: roomData.id,
          room_name: roomData.name,
          room_description: roomData.description,
          patient_id: roomData.patient_id,
          patient_name: patientName,
          member_count: count || 0,
          last_message: '',
          last_message_time: roomData.created_at
        } as CareTeamRoom;
      } catch (error) {
        console.error("Error in room details query:", error);
        return null;
      }
    },
    enabled: !!selectedRoomId && !!user?.id
  });

  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ["room_messages", selectedRoomId],
    queryFn: async () => {
      if (!selectedRoomId) return [];
      
      try {
        const { data: messageData, error } = await supabase
          .from('room_messages')
          .select('id, sender_id, message, is_system_message, is_ai_message, created_at, read_by')
          .eq('room_id', selectedRoomId)
          .order('created_at', { ascending: true });
          
        if (error) {
          console.error("Error fetching messages:", error);
          throw error;
        }
        
        const formattedMessages: RoomMessage[] = [];
        
        for (const msg of messageData) {
          let senderName = 'Unknown';
          let senderRole = 'unknown';
          
          if (msg.sender_id === '00000000-0000-0000-0000-000000000000') {
            senderName = 'AI Assistant';
            senderRole = 'aibot';
          } else {
            const { data: senderData, error: senderError } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', msg.sender_id)
              .single();
              
            if (!senderError && senderData) {
              senderName = `${senderData.first_name || ''} ${senderData.last_name || ''}`.trim();
            }
            
            const { data: roleData, error: roleError } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', msg.sender_id)
              .single();
              
            if (!roleError && roleData) {
              senderRole = roleData.role;
            }
          }
          
          let readByArray: string[] = [];
          
          if (msg.read_by) {
            if (Array.isArray(msg.read_by)) {
              readByArray = msg.read_by.map(item => String(item));
            } else if (typeof msg.read_by === 'object') {
              try {
                const parsedArray = Array.isArray(msg.read_by) ? msg.read_by : [];
                readByArray = parsedArray.map(item => String(item));
              } catch (e) {
                console.warn("Could not parse read_by field:", e);
              }
            }
          }
          
          formattedMessages.push({
            id: msg.id,
            sender_id: msg.sender_id,
            sender_name: senderName,
            sender_role: senderRole,
            message: msg.message,
            is_system_message: msg.is_system_message || false,
            is_ai_message: msg.is_ai_message || false,
            created_at: msg.created_at,
            read_by: readByArray
          });
        }
        
        if (messageData.length > 0 && user?.id) {
          for (const msg of messageData) {
            let currentReadBy: string[] = [];
            
            if (msg.read_by && Array.isArray(msg.read_by)) {
              currentReadBy = msg.read_by.map(item => String(item));
            }
            
            if (user.id && !currentReadBy.includes(user.id)) {
              const updatedReadBy = [...currentReadBy, user.id];
              
              await supabase
                .from('room_messages')
                .update({ read_by: updatedReadBy })
                .eq('id', msg.id);
            }
          }
        }
        
        return formattedMessages;
      } catch (error) {
        console.error("Error in messages query:", error);
        return [];
      }
    },
    enabled: !!selectedRoomId,
    refetchInterval: 5000
  });

  const messages: RoomMessage[] = Array.isArray(messagesData) ? messagesData : [];

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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
      
      const { data, error } = await supabase
        .from('room_messages')
        .insert({
          room_id: selectedRoomId,
          sender_id: user.id,
          message: message.trim(),
          is_system_message: false,
          is_ai_message: false,
          read_by: [user.id]
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setMessage("");
      
      queryClient.invalidateQueries({ queryKey: ["room_messages", selectedRoomId] });
      
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

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

  const groupMessagesByDay = (messages: RoomMessage[]) => {
    const groups: Record<string, RoomMessage[]> = {};
    
    messages.forEach(msg => {
      const date = new Date(msg.created_at);
      const day = format(date, 'yyyy-MM-dd');
      
      if (!groups[day]) {
        groups[day] = [];
      }
      
      groups[day].push(msg);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDay(messages);

  if (!selectedRoomId) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Select a care team to start chatting
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
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
      
      <div className="flex-1 bg-[#f0f2f5] dark:bg-slate-900 overflow-hidden relative">
        <ScrollArea className="h-full">
          <div 
            className="p-4 space-y-6"
            ref={scrollViewportRef}
          >
            {messagesLoading ? (
              <div className="flex justify-center pt-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No messages yet. Start the conversation!
              </div>
            ) : (
              Object.entries(messageGroups).map(([day, dayMessages]) => (
                <CollapsibleMessageGroup 
                  key={day} 
                  date={day}
                  messages={dayMessages}
                >
                  {dayMessages.map((msg) => {
                    const isSelf = msg.sender_id === user?.id;
                    const isAI = msg.is_ai_message;
                    const isSystem = msg.is_system_message;
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isSelf ? 'justify-end' : 'justify-start'} message-item`}
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
                </CollapsibleMessageGroup>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
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
