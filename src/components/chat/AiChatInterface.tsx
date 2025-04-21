
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  readStatus?: 'read' | null;
}

interface AiChatInterfaceProps {
  isCareTeamChat?: boolean;
}

export const AiChatInterface = ({ isCareTeamChat = false }: AiChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    try {
      setIsLoading(true);
      
      // Add user message to the chat
      const userMessage: Message = { 
        role: 'user', 
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
          patientId: user?.id, // Pass the patient ID for context
          isCareTeamChat: isCareTeamChat // Indicate if this is a care team chat
        },
      });

      if (error) throw error;

      // Add AI response to the chat
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: data.response, 
          timestamp: new Date(),
          readStatus: data.readStatus
        }
      ]);
    } catch (error: any) {
      console.error("Error in AI chat:", error);
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
    <Card className="h-[600px] flex flex-col border border-neutral-200 dark:border-neutral-800 shadow-sm">
      <CardHeader className="border-b border-neutral-200 dark:border-neutral-800 py-4">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Brain className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
          {isCareTeamChat ? "Care Team AI Assistant" : "AI Healthcare Assistant"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
        <ScrollArea className="flex-1 px-4 py-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-neutral-500">
              <p>{isCareTeamChat 
                ? "Ask me about your prescriptions, health plan, or medical advice!" 
                : "Ask me anything about health, medicine, or general wellness!"}</p>
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
                        : "bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                    }`}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      {message.role === 'assistant' && message.readStatus === 'read' && (
                        <CheckCircle className="h-3 w-3 text-blue-500" />
                      )}
                    </div>
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {format(message.timestamp, "p")}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
        <div className="border-t border-neutral-200 dark:border-neutral-800 p-4 mt-auto">
          <div className="flex gap-2">
            <Textarea
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="resize-none min-h-[40px] border-neutral-300 dark:border-neutral-700 focus:border-primary"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 transition-colors"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
