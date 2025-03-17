
import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageSquare, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { featureFlags } from '@/config/features';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

// Welcome messages for different languages
const welcomeMessages = {
  en: "Hello! I am your Anubhuti Assistant. How can I help you today?",
  hi: "नमस्ते! मैं आपका Anubhuti सहायक हूँ। आज मैं आपकी कैसे मदद कर सकता हूँ? (Hello! I am your Anubhuti Assistant. How can I help you today?)",
  ta: "வணக்கம்! நான் உங்கள் Anubhuti உதவியாளர். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?",
  te: "నమస్కారం! నేను మీ Anubhuti సహాయకుడిని. నేను ఈరోజు మీకు ఎలా సహాయం చేయగలను?",
  bn: "নমস্কার! আমি আপনার Anubhuti সহায়ক। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?",
  mr: "नमस्कार! मी तुमचा Anubhuti सहाय्यक आहे. आज मी तुम्हाला कशी मदत करू शकतो?",
  gu: "નમસ્તે! હું તમારો Anubhuti સહાયક છું. આજે હું તમને કેવી રીતે મદદ કરી શકું?",
  kn: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ Anubhuti ಸಹಾಯಕ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
  ml: "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ Anubhuti സഹായി ആണ്. ഇന്ന് എനിക്ക് നിങ്ങളെ എങ്ങനെ സഹായിക്കാൻ കഴിയും?",
};

export const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState('en');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Set welcome message based on selected language
  useEffect(() => {
    // Clear messages and set welcome message in the selected language
    const welcomeMessage = welcomeMessages[language as keyof typeof welcomeMessages] || welcomeMessages.en;
    setMessages([{
      id: '1',
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date(),
    }]);
  }, [language]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Format messages for the API call
    const formattedMessages = messages
      .filter((msg) => msg.id !== '1' || messages.length === 1) // Keep initial greeting only if it's the only message
      .concat(userMessage)
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

    try {
      const { data, error } = await supabase.functions.invoke('doctor-ai-assistant', {
        body: { 
          messages: formattedMessages,
          preferredLanguage: language 
        },
      });

      if (error) {
        throw error;
      }

      const assistantMessage = {
        id: Date.now().toString(),
        role: 'assistant' as const,
        content: data.response || 'I apologize, but I couldn\'t generate a response. Please try again.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error invoking AI assistant:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get a response from the assistant. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'हिंदी (Hindi)' },
    { value: 'ta', label: 'தமிழ் (Tamil)' },
    { value: 'te', label: 'తెలుగు (Telugu)' },
    { value: 'bn', label: 'বাংলা (Bengali)' },
    { value: 'mr', label: 'मराठी (Marathi)' },
    { value: 'gu', label: 'ગુજરાતી (Gujarati)' },
    { value: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
    { value: 'ml', label: 'മലയാളം (Malayalam)' },
  ];

  // Check if Indian language support is enabled
  const isLanguageSupportEnabled = featureFlags.enableIndianLanguageSupport;

  return (
    <>
      {/* Floating chat button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat widget */}
      {isOpen && (
        <Card className="fixed bottom-5 right-5 w-[350px] h-[500px] shadow-xl flex flex-col z-50">
          <CardHeader className="px-4 py-3 border-b flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center space-x-2">
              <Avatar className="h-7 w-7 bg-primary">
                <MessageSquare className="h-4 w-4 text-white" />
              </Avatar>
              <CardTitle className="text-base font-medium">Anubhuti सहायक</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          {isLanguageSupportEnabled && (
            <div className="px-4 py-2 border-b bg-muted/30">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full w-full px-4 py-2">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <div
                        className={`text-xs mt-1 ${
                          message.role === 'user'
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <Badge variant="outline" className="animate-pulse">
                      {language === 'hi' ? 
                        "प्रतिक्रिया दे रहा है... (Assistant is typing...)" : 
                        "Assistant is typing..."}
                    </Badge>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="p-3 pt-2 border-t">
            <div className="flex items-center w-full space-x-2">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={language === 'hi' ? "अपना संदेश यहां टाइप करें..." : "Type your message..."}
                className="min-h-[40px] flex-1 resize-none"
                disabled={isLoading}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </>
  );
};
