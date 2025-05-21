import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, ArrowDown, Brain, User, Users, Sparkles, ArrowUpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CollapsibleMessageGroup } from "./CollapsibleMessageGroup";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { useChatScroll } from "@/hooks/useChatScroll";
import { groupMessagesByDate, safeParseISO } from "@/utils/dateUtils";
import { ChatInput } from "./ChatInput";
import { cn } from "@/lib/utils";

// Define interfaces for message data
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

// Define a type for the raw message data from the database
interface RawRoomMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  message: string;
  is_system_message: boolean;
  is_ai_message: boolean;
  created_at: string;
  read_by: any; // This can be array, jsonb or null from the database
}

interface MessagesData {
  messages: RoomMessage[];
  hasMore: boolean;
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
  roomDetails?: CareTeamRoom | null;
}

export const CareTeamRoomChat = ({ 
  selectedRoomId, 
  onBack, 
  isMobileView = false,
  roomDetails: propRoomDetails
}: CareTeamRoomChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const PAGE_SIZE = 500; // Maintaining the 500 message limit

  // Only fetch room details if they weren't provided as props
  const { data: fetchedRoomDetails } = useQuery({
    queryKey: ["care_team_room", selectedRoomId],
    queryFn: async () => {
      if (!selectedRoomId || !user?.id || propRoomDetails) return null;
      
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
    enabled: !!selectedRoomId && !!user?.id && !propRoomDetails
  });

  // Use provided room details from props or fetch them if not provided
  const roomDetails = propRoomDetails || fetchedRoomDetails;

  const fetchMessages = async (roomId: string, pageNum: number, isLoadingMore = false) => {
    if (!roomId) return { messages: [], hasMore: false };
    
    try {
      if (!isLoadingMore) setMessagesLoading(true);
      
      console.log(`Fetching messages for room: ${roomId}, page: ${pageNum}, pageSize: ${PAGE_SIZE}`);
      
      // Messages are already sorted by created_at DESC (newest first) from the database
      const { data: messageData, error } = await supabase.rpc(
        'get_room_messages_with_role',
        {
          p_room_id: roomId,
          p_limit: PAGE_SIZE,
          p_offset: (pageNum - 1) * PAGE_SIZE,
          p_user_role: user?.role || 'patient'
        }
      );
        
      if (error) {
        console.error("Error fetching messages:", error);
        throw error;
      }
      
      console.log("Retrieved messages count:", messageData?.length || 0);
      
      if (messageData && messageData.length > 0) {
        console.log("First message date:", new Date(messageData[0]?.created_at).toLocaleString());
        console.log("Last message date:", new Date(messageData[messageData.length - 1]?.created_at).toLocaleString());
        console.log("Total messages returned:", messageData.length);
      }
      
      const formattedMessages: RoomMessage[] = [];
      
      for (const msg of messageData || []) {
        // Safely typecast the message from database
        const dbMessage = msg as RawRoomMessage;
        let senderName = dbMessage.sender_name || 'Unknown';
        let senderRole = dbMessage.sender_role || 'unknown';
        
        // Properly handle read_by field - ensure it's always an array
        let readByArray: string[] = [];
        
        if (dbMessage.read_by) {
          if (Array.isArray(dbMessage.read_by)) {
            readByArray = dbMessage.read_by.map(item => String(item));
          } else if (typeof dbMessage.read_by === 'object') {
            try {
              // Handle JSONB array from database
              const parsedArray = Array.isArray(dbMessage.read_by) ? dbMessage.read_by : [];
              readByArray = parsedArray.map(item => String(item));
            } catch (e) {
              console.warn("Could not parse read_by field:", e);
            }
          }
        }
        
        formattedMessages.push({
          id: dbMessage.id,
          sender_id: dbMessage.sender_id,
          sender_name: senderName,
          sender_role: senderRole,
          message: dbMessage.message,
          is_system_message: dbMessage.is_system_message || false,
          is_ai_message: dbMessage.is_ai_message || false,
          created_at: dbMessage.created_at,
          read_by: readByArray
        });
      }
      
      // No need to sort messages again since they are already sorted by created_at DESC from the database
      // Important: removed any manual sorting here
      
      console.log("Messages formatted and returned, count:", formattedMessages.length);
      console.log("Has more:", messageData?.length === PAGE_SIZE);
      
      return {
        messages: formattedMessages,
        hasMore: messageData?.length === PAGE_SIZE
      };
    } catch (error) {
      console.error("Error in fetchMessages:", error);
      return { messages: [], hasMore: false };
    } finally {
      if (!isLoadingMore) setMessagesLoading(false);
      setLoadingMore(false);
    }
  };

  const { data: messagesData, isLoading: messagesQueryLoading, refetch } = useQuery<MessagesData>({
    queryKey: ["room_messages", selectedRoomId, page],
    queryFn: async () => {
      if (!selectedRoomId) return { messages: [], hasMore: false };
      return fetchMessages(selectedRoomId, 1, false);
    },
    enabled: !!selectedRoomId,
    refetchInterval: 5000
  });

  // Fix: Ensure messagesData is properly typed and provide default values
  const messages: RoomMessage[] = messagesData?.messages || [];
  const hasMore = messagesData?.hasMore || false;
  
  const handleLoadMore = async () => {
    if (!selectedRoomId || loadingMore || !hasMoreMessages) return;
    
    console.log("Loading more messages...");
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    
    const result = await fetchMessages(selectedRoomId, nextPage, true);
    
    if (result.messages.length > 0) {
      const newMessages = [...messages, ...result.messages];
      
      // Update the cached data
      queryClient.setQueryData(["room_messages", selectedRoomId, page], {
        messages: newMessages,
        hasMore: result.hasMore
      });
      
      setHasMoreMessages(result.hasMore);
      console.log("More messages loaded, new total:", newMessages.length);
    } else {
      setHasMoreMessages(false);
      console.log("No more messages to load.");
    }
    
    setLoadingMore(false);
  };

  const { 
    endRef, 
    containerRef, 
    showScrollButton, 
    scrollToBottom 
  } = useChatScroll({
    messages,
    loadingMessages: messagesQueryLoading,
    loadingMore,
    isNewMessage: true
  });

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
      
      // Refetch to get the latest messages
      refetch();
      
      // Check if the message includes an AI command
      const hasAiCommand = message.toLowerCase().includes('@ai') || message.toLowerCase().includes('@assistant');
      
      if (hasAiCommand) {
        setIsAiTyping(true);
        
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
            refetch();
            setIsAiTyping(false);
          }, 1000);
        } catch (aiErr) {
          console.error("Error invoking AI chat:", aiErr);
          setIsAiTyping(false);
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

  // Highlight AI commands in a message
  const formatMessageWithAiHighlight = (text: string) => {
    if (!text) return text;
    
    // Look for @ai or @assistant mentions
    const aiPattern = /(@ai|@assistant)/gi;
    
    return text.replace(aiPattern, (match) => {
      return `<span class="ai-command-highlight">${match}</span>`;
    });
  };

  // Process special messages like PDF notifications
  const processMessageContent = (text: string) => {
    if (!text) return text;
    
    // Check for PDF generation message
    if (text.includes("PDF has been generated") || 
        text.includes("prescription as a PDF") || 
        text.includes("ready for download")) {
      return `<div class="pdf-message-content w-full">
        <span class="pdf-icon">📄</span>
        <span>${text}</span>
      </div>`;
    }
    
    return text;
  };

  // Group messages by date - messages are sorted newest-first from DB, but displayed oldest-first
  const sortedMessages = [...messages].reverse();
  const messageGroups = groupMessagesByDate(sortedMessages);
  
  useEffect(() => {
    setHasMoreMessages(hasMore);
    console.log("Updated hasMoreMessages state:", hasMore);
  }, [hasMore]);

  if (!selectedRoomId) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Select a care team to start chatting
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 bg-muted/40 border-b flex items-center">
        {isMobileView && onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-1.5">
            <ArrowDown className="rotate-90 h-4 w-4" />
          </Button>
        )}
        
        <Users className="h-4 w-4 mr-1.5 text-primary" />
        
        <div className="flex-1">
          <div className="font-medium line-clamp-1 text-sm">
            {roomDetails?.room_name || "Care Team Chat"}
          </div>
          
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <User className="h-3 w-3 mr-0.5" />
            <span className="truncate max-w-[120px]">{roomDetails?.patient_name || "Patient"}</span> • 
            <Badge variant="outline" className="text-xs h-4 ml-0.5">
              {roomDetails?.member_count || 0}
            </Badge>
          </div>
        </div>
      </div>
      
      <div className="flex-1 bg-[#f0f2f5] dark:bg-slate-900 overflow-hidden relative flex flex-col">
        <ScrollArea className="h-full flex flex-col" viewportRef={containerRef}>
          <div className="p-4 space-y-6 flex-grow flex flex-col">
            {/* Load More button at the top for older messages */}
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
            
            {messagesQueryLoading ? (
              <div className="flex justify-center pt-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No messages yet. Start the conversation!
              </div>
            ) : (
              <ErrorBoundary>
                <div className="message-groups w-full">
                  {Object.entries(messageGroups)
                    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB)) // Sort oldest dates first
                    .map(([day, dayMessages], index, array) => {
                      const isLatestGroup = index === array.length - 1; // Last group is latest
                      
                      return (
                        <CollapsibleMessageGroup 
                          key={day} 
                          date={day}
                          messages={dayMessages}
                          isLatestGroup={isLatestGroup}
                        >
                          <div className="chat-message-date-group w-full">
                            {dayMessages
                              .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) // Sort within group by time, oldest first
                              .map((msg) => {
                                const isSelf = msg.sender_id === user?.id;
                                const isAI = msg.is_ai_message;
                                const isSystem = msg.is_system_message;
                                const isPdfMessage = msg.message.includes("PDF has been generated") || 
                                                    msg.message.includes("prescription as a PDF") || 
                                                    msg.message.includes("ready for download");
                                
                                return (
                                  <div
                                    key={msg.id}
                                    className={cn(
                                      "flex message-item my-2 w-full",
                                      isSelf ? "justify-end" : "justify-start",
                                      !isSystem && isAI && !isSelf && "ai-message-container",
                                      isPdfMessage && "pdf-message-container w-full",
                                      "bubble-in"
                                    )}
                                    id={`message-${msg.id}`}
                                  >
                                    <div className="flex gap-2 max-w-[80%] w-full">
                                      {!isSelf && !isSystem && (
                                        <Avatar className={cn("h-8 w-8 flex-shrink-0", isAI && "ring-2 ring-purple-200 ring-offset-1")}>
                                          <AvatarFallback className={getAvatarColorClass(msg.sender_role)}>
                                            {isAI ? <Sparkles className="h-4 w-4" /> : getInitials(msg.sender_name)}
                                          </AvatarFallback>
                                        </Avatar>
                                      )}
                                      
                                      <div className="w-full">
                                        {!isSelf && !isSystem && (
                                          <div className={cn(
                                            "text-xs font-medium mb-1 flex items-center",
                                            isAI && "text-purple-700 dark:text-purple-400"
                                          )}>
                                            {isAI && <Sparkles className="h-3 w-3 mr-1" />}
                                            {msg.sender_name}
                                            <span className="text-xs text-muted-foreground ml-1">
                                              {msg.sender_role}
                                            </span>
                                          </div>
                                        )}
                                        
                                        <div
                                          className={cn(
                                            "rounded-lg p-3 text-sm shadow-sm relative",
                                            isSystem 
                                              ? "bg-blue-100/70 dark:bg-blue-900/20 text-center mx-auto" 
                                              : isSelf
                                                ? "bg-[#9b87f5]/90 text-white" 
                                                : isAI
                                                  ? "bg-purple-50/80 dark:bg-purple-900/10"
                                                  : "bg-neutral-100/80 dark:bg-neutral-800/50",
                                            isAI && !isSelf && !isSystem && "border border-purple-100 dark:border-purple-900/30",
                                            isPdfMessage && "pdf-message w-full",
                                            isPdfMessage && !isSelf ? "max-w-full" : "",
                                          )}
                                        >
                                          {isAI && (
                                            <Sparkles className="h-3 w-3 absolute top-2 right-2 text-purple-500" />
                                          )}
                                          
                                          <div 
                                            className={cn(
                                              isAI && !isSelf && "leading-relaxed",
                                              isPdfMessage && "pdf-message-content"
                                            )}
                                            dangerouslySetInnerHTML={{ 
                                              __html: isPdfMessage 
                                                ? processMessageContent(msg.message) 
                                                : isSelf 
                                                  ? formatMessageWithAiHighlight(msg.message) 
                                                  : msg.message 
                                            }}
                                          />
                                        
                                          <div className="text-xs opacity-70 mt-1">
                                            {format(safeParseISO(msg.created_at), 'h:mm a')}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </CollapsibleMessageGroup>
                      );
                    })}
                </div>
              </ErrorBoundary>
            )}
            
            {isAiTyping && (
              <div className="ai-typing ml-10 mt-auto">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-purple-100 text-purple-800">
                      <Sparkles className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center">
                    <span className="text-xs text-muted-foreground mr-2">AI is thinking</span>
                    <div className="ai-typing-dot"></div>
                    <div className="ai-typing-dot"></div>
                    <div className="ai-typing-dot"></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={endRef} />
          </div>
        </ScrollArea>
        
        {showScrollButton && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute bottom-20 right-4 h-8 w-8 rounded-full shadow-md"
            onClick={scrollToBottom}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="p-3 bg-background border-t">
        <ChatInput
          value={message}
          onChange={setMessage}
          onSend={handleSendMessage}
          disabled={isLoading || !selectedRoomId || isAiTyping}
          isLoading={isLoading || isAiTyping}
          placeholder="Type a message... (Use @AI to ask the AI assistant)"
        />
      </div>
    </div>
  );
};
