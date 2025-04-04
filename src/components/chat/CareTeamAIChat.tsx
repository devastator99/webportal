
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Brain, Loader2, Send, CheckCircle, ChevronDown, ChevronRight, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

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
  const { toast } = useToast();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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

      // Call the Supabase Edge Function for AI response
      const { data, error } = await supabase.functions.invoke('doctor-ai-assistant', {
        body: { 
          messages: messageHistory,
          patientId: user.id,
          isCareTeamChat: true
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

  // Split messages into recent and history
  const recentMessages = messages.length > 5 ? messages.slice(-5) : messages;
  const historyMessages = messages.length > 5 ? messages.slice(0, -5) : [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5 text-blue-500" />
        <h3 className="font-medium">AI Care Assistant</h3>
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {historyMessages.length > 0 && (
          <Collapsible
            open={isHistoryOpen}
            onOpenChange={setIsHistoryOpen}
            className="mb-2 border rounded-md"
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between p-2 text-sm hover:bg-muted/50">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Previous messages ({historyMessages.length})</span>
              </div>
              {isHistoryOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ScrollArea className="max-h-48 overflow-y-auto p-2">
                <div className="space-y-3">
                  {historyMessages.map((message, index) => (
                    <div
                      key={`history-${index}`}
                      className={`flex ${
                        message.role === 'user' ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-2 text-xs ${
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
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>
        )}
        
        <ScrollArea className="flex-1 pr-4 mb-4" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              <p className="text-sm">Loading your AI care assistant...</p>
            </div>
          ) : (
            <div className="space-y-4">
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
          )}
        </ScrollArea>
      </div>
      
      <div className="flex gap-2 mt-auto">
        <Textarea
          placeholder="Ask about your health records, prescriptions, or care plan..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="resize-none text-sm"
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <Button size="sm" onClick={handleSendMessage} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};
