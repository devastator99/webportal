
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Brain, Loader2, Send, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const CareTeamAIChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

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

      // Call the Supabase Edge Function for AI response
      const { data, error } = await supabase.functions.invoke('doctor-ai-assistant', {
        body: { 
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5 text-blue-500" />
        <h3 className="font-medium">AI Care Assistant</h3>
      </div>
      
      <ScrollArea className="flex-1 pr-4 mb-4">
        {messages.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-muted-foreground">
            <p className="text-sm">Loading your AI care assistant...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
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
          </div>
        )}
      </ScrollArea>
      
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
