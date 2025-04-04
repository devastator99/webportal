import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Brain, Loader2, Send, CheckCircle, ChevronDown, ChevronRight, Clock, ArrowDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const CareTeamAIChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  // Add initial welcome message when component mounts
  useEffect(() => {
    if (messages.length === 0 && user?.id) {
      setMessages([
        {
          role: 'assistant',
          content: "Hello! I'm your AI care assistant. I have access to your health records, prescriptions, and care plan. How can I help you today?",
          timestamp: new Date()
        }
      ]);
    }
  }, [user?.id, messages.length]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle scroll to detect when to show scroll-to-bottom button
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
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !user?.id) return;

    try {
      setIsLoading(true);
      
      // Add user message to the chat
      const userMessage = { 
        role: 'user' as const, 
        content: input, 
        timestamp: new Date() 
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInput("");

      // Store all previous messages for context
      const messageHistory = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      // Use the RPC function to get patient's care team
      const { data: careTeam, error: careTeamError } = await supabase.rpc(
        'get_patient_care_team',
        { p_patient_id: user.id }
      );
      
      if (careTeamError) {
        console.error("Error checking care team:", careTeamError);
      }

      // Build patient context with verified information
      let patientContext: Record<string, any> = {};
      
      // If we found care team members, include them in the context
      if (careTeam && Array.isArray(careTeam) && careTeam.length > 0) {
        // Check for doctor in the care team
        const doctorMember = careTeam.find(member => member.role === 'doctor');
        if (doctorMember) {
          patientContext.hasDoctorAssigned = true;
          patientContext.doctorName = `Dr. ${doctorMember.first_name} ${doctorMember.last_name}`;
        } else {
          patientContext.hasDoctorAssigned = false;
        }
      } else {
        patientContext.hasDoctorAssigned = false;
      }

      // Get patient's profile info
      const { data: patientProfile, error: profileError } = await supabase.rpc(
        'get_user_profile',
        { p_user_id: user.id }
      ).maybeSingle();
        
      if (profileError) {
        console.error("Error fetching patient profile:", profileError);
      } else if (patientProfile) {
        patientContext = {
          ...patientContext,
          patientName: `${patientProfile.first_name} ${patientProfile.last_name}`
        };
      }

      // Call the Supabase Edge Function for AI response with enhanced context
      const { data, error } = await supabase.functions.invoke('doctor-ai-assistant', {
        body: { 
          messages: messageHistory,
          patientId: user.id,
          isCareTeamChat: true,
          patientContext: patientContext // Pass verified patient and doctor info
        },
      });

      if (error) throw error;

      // Add AI response to the chat
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: data.response, 
          timestamp: new Date() 
        }
      ]);
      
      // Ensure scroll to bottom after new message
      setTimeout(scrollToBottom, 100);
      
    } catch (error: any) {
      console.error("Error in AI care team chat:", error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Split messages into recent (last 5) and history
  const recentMessages = messages.length > 5 ? messages.slice(-5) : messages;
  const historyMessages = messages.length > 5 ? messages.slice(0, -5) : [];

  // Group history messages by day for WhatsApp-style UI
  const groupedHistoryMessages: Record<string, Message[]> = {};
  historyMessages.forEach(message => {
    const day = format(message.timestamp, "MMMM d, yyyy");
    if (!groupedHistoryMessages[day]) {
      groupedHistoryMessages[day] = [];
    }
    groupedHistoryMessages[day].push(message);
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5 text-blue-500" />
        <h3 className="font-medium">AI Care Assistant</h3>
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* History section - accordion style similar to WhatsApp */}
        {Object.keys(groupedHistoryMessages).length > 0 && (
          <Accordion type="single" collapsible className="mb-2 border rounded-md">
            <AccordionItem value="history">
              <AccordionTrigger className="px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Previous messages ({historyMessages.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ScrollArea className="max-h-48 overflow-y-auto">
                  {Object.entries(groupedHistoryMessages).map(([day, dayMessages]) => (
                    <div key={day} className="mb-4">
                      <div className="flex justify-center mb-2">
                        <Badge variant="outline" className="text-xs bg-muted/50">
                          {day}
                        </Badge>
                      </div>
                      <div className="space-y-3 px-3">
                        {dayMessages.map((message, index) => (
                          <div
                            key={`history-${day}-${index}`}
                            className={`flex ${
                              message.role === 'user' ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg p-2 text-sm ${
                                message.role === 'user'
                                  ? "bg-primary/80 text-primary-foreground"
                                  : "bg-muted/80"
                              }`}
                            >
                              <p>{message.content}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {format(message.timestamp, "p")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
        
        {/* Recent messages - WhatsApp style */}
        <div className="relative flex-1 h-full">
          <ScrollArea 
            className="h-full pr-3" 
            ref={scrollAreaRef}
          >
            <div 
              className="space-y-3 py-2"
              ref={scrollViewportRef}
            >
              {recentMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-1 mb-1">
                        <CheckCircle className="h-3 w-3 text-blue-500" />
                      </div>
                    )}
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {format(message.timestamp, "p")}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          {/* Scroll to bottom button - WhatsApp style */}
          {showScrollButton && (
            <Button
              size="icon"
              variant="secondary"
              className="absolute bottom-2 right-2 h-9 w-9 rounded-full opacity-90 shadow-md"
              onClick={scrollToBottom}
            >
              <ArrowDown className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Input area - WhatsApp style */}
      <div className="flex gap-2 mt-4 bg-background border-t pt-3">
        <Textarea
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="resize-none text-sm min-h-[50px] max-h-[120px]"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <Button 
          size="icon" 
          onClick={handleSendMessage} 
          disabled={isLoading}
          className="rounded-full h-[50px] w-[50px] flex-shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
};
