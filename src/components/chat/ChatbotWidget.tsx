import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageSquare, MessageCircle, FileText, VolumeX, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { featureFlags, updateFeatureFlags } from '@/config/features';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useQuery } from '@tanstack/react-query';
import { speak } from '@/utils/textToSpeech';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

interface AnalyzedDocument {
  id: string;
  original_filename: string;
  analysis_text: string;
  created_at: string;
}

const welcomeMessages = {
  en: "Hello! I am your Anubhuti Assistant. How can I help you today? You can ask me about our doctors, clinic location, or services.",
  hi: "नमस्ते! मैं आपका Anubhuti सहायक हूँ। आज मैं आपकी कैसे मदद कर सकता हूँ? आप मुझसे हमारे डॉक्टरों, क्लिनिक स्थान, या सेवाओं के बारे में पूछ सकते हैं।",
  ta: "வணக்கம்! நான் உங்கள் Anubhuti உதவியாளர். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்? எங்கள் மருத்துவர்கள், மருத்துவமனை இருப்பிடம் அல்லது சேவைகள் பற்றி என்னிடம் கேட்கலாம்.",
  te: "నమస్కారం! నేను మీ Anubhuti సహాయకుడిని. నేను ఈరోజు మీకు ఎలా సహాयం చేయగలను? మీరు నన్ను మా వైద్యులు, క్లినిక్ స్థానం లేదా సేవల గురించి అడగవచ్చు.",
  bn: "নমস্কার! আমি আপনার Anubhuti সহায়ক। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি? আপনি আমাকে আমাদের ডাক্তার, ক্লিনিকের অবস্থান বা পরিষেবাগুলি সম্পর্কে জিজ্ঞাসা করতে পারেন।",
  mr: "नमस्कार! मी तुमचा Anubhuti सहाय्यक आहे. आज मी तुम्हाला कशी मदत करू शकतो? तुम्ही मला आमच्या डॉक्टरांबद्दल, क्लिनिकच्या स्थानाबद्दल किंवा सेवांबद्दल विचारू शकता.",
  gu: "નમસ્તે! હું તમારો Anubhuti સહાયક છું. આજે હું તમને કેવી રીતે મદદ કરી શકું? તમે મને અમારા ડૉક્ટરો, ક્લિનિકના સ્થાન અથવા સેવાઓ વિશે પૂછી શકો છો.",
  kn: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ Anubhuti ಸಹಾಯಕ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು? ನೀವು ನಿಮ್ಮನ್��ು ನಮ್ಮ ವೈದ್ಯರು, ಕ್ಲಿನಿಕ್ ಸ್ಥಳ ಅಥವಾ ಸೇವೆಗಳ ಬಗ್ಗೆ ಕೇಳಬಹುದು.",
  ml: "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ Anubhuti സഹായി ആണ്. ഇന്ന് എനിക്ക് നിങ്ങളെ എങ്ങനെ സഹായിക്കാൻ കഴിയും? ഞങ്ങളുടെ ഡോക്ടർമാർ, ക്ലിനിക് സ്ഥാനം അല്ലെങ്കിൽ സേവനങ്ങളെക്കുറിച്ച് നിങ്ങൾക്ക് എന്നോട് ചോദിക്കാം.",
};

const suggestedDoctorQueries = [
  "Who are the doctors at your clinic?",
  "Tell me about your specialists",
  "What are the consulting hours?",
  "Which doctor specializes in diabetes?",
  "Where is the clinic located?"
];

const documentQueries = [
  "What do my latest test results show?",
  "Explain my medical reports",
  "What did the analysis of my documents reveal?",
  "Tell me about my lab results"
];

export const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState('en');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(featureFlags.enableChatbotVoice);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: analyzedDocuments } = useQuery({
    queryKey: ["analyzed_documents_for_chat"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analyzed_documents')
        .select('id, original_filename, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as AnalyzedDocument[];
    },
  });

  useEffect(() => {
    const welcomeMessage = welcomeMessages[language as keyof typeof welcomeMessages] || welcomeMessages.en;
    setMessages([{
      id: '1',
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date(),
    }]);
    
    if (voiceEnabled && isOpen) {
      speak(welcomeMessage, language);
    }
  }, [language, isOpen, voiceEnabled]);

  useEffect(() => {
    const handleFeatureFlagsChanged = () => {
      const savedFlags = localStorage.getItem('featureFlags');
      if (savedFlags) {
        const parsedFlags = JSON.parse(savedFlags);
        setVoiceEnabled(parsedFlags.enableChatbotVoice);
      }
    };
    
    window.addEventListener('featureFlagsChanged', handleFeatureFlagsChanged);
    return () => {
      window.removeEventListener('featureFlagsChanged', handleFeatureFlagsChanged);
    };
  }, []);

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

    const formattedMessages = messages
      .filter((msg) => msg.id !== '1' || messages.length === 1)
      .concat(userMessage)
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

    try {
      const { data, error } = await supabase.functions.invoke('doctor-ai-assistant', {
        body: { 
          messages: formattedMessages,
          preferredLanguage: language,
          documentId: selectedDocumentId
        },
      });

      if (error) {
        throw error;
      }

      const response = data.response || 'I apologize, but I couldn\'t generate a response. Please try again.';
      
      const assistantMessage = {
        id: Date.now().toString(),
        role: 'assistant' as const,
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      if (voiceEnabled) {
        speak(response, language);
      }
      
      setSelectedDocumentId(null);
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

  const handleSuggestedQuery = (query: string) => {
    setInput(query);
  };

  const handleDocumentSelect = (id: string) => {
    setSelectedDocumentId(id);
    toast({
      title: "Document Selected",
      description: "The chatbot will reference this document in its next response",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoice = () => {
    const newValue = !voiceEnabled;
    setVoiceEnabled(newValue);
    
    updateFeatureFlags({ enableChatbotVoice: newValue });
    
    toast({
      title: newValue ? "Voice enabled" : "Voice disabled",
      description: newValue 
        ? "The chatbot will now speak its responses" 
        : "The chatbot will no longer speak its responses",
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const isLanguageSupportEnabled = featureFlags.enableIndianLanguageSupport;

  const showSuggestions = messages.length <= 1;

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <Card className="fixed bottom-5 right-5 w-[350px] h-[500px] shadow-xl flex flex-col z-50">
          <CardHeader className="px-4 py-3 border-b flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center space-x-2">
              <Avatar className="h-7 w-7 bg-primary">
                <MessageSquare className="h-4 w-4 text-white" />
              </Avatar>
              <CardTitle className="text-base font-medium">Anoobhooti सहायक</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleVoice}
                title={voiceEnabled ? "Disable voice" : "Enable voice"}
              >
                {voiceEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <div className="px-4 py-2 border-b bg-muted/30 flex items-center justify-between">
            {isLanguageSupportEnabled && (
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="h-8 text-xs w-[180px]">
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
            )}
            <div className="flex items-center space-x-2">
              <Label htmlFor="voice-toggle" className="text-xs">Digital Doctor</Label>
              <Switch 
                id="voice-toggle"
                checked={voiceEnabled} 
                onCheckedChange={toggleVoice}
              />
            </div>
          </div>

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
                
                {showSuggestions && (
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2">
                      {language === 'hi' ? 
                        "आप ये पूछ सकते हैं:" : 
                        "You can ask:"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedDoctorQueries.map((query, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="cursor-pointer hover:bg-secondary/80"
                          onClick={() => handleSuggestedQuery(query)}
                        >
                          {query}
                        </Badge>
                      ))}
                      
                      {documentQueries.map((query, index) => (
                        <Badge 
                          key={`doc-${index}`} 
                          variant="outline" 
                          className="cursor-pointer hover:bg-secondary/80"
                          onClick={() => handleSuggestedQuery(query)}
                        >
                          {query}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="p-3 pt-2 border-t flex-col space-y-2">
            {analyzedDocuments && analyzedDocuments.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {selectedDocumentId ? "Document Selected" : "Reference a Document"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="center">
                  <ScrollArea className="h-[200px]">
                    <div className="p-4 space-y-2">
                      <h4 className="font-medium text-sm mb-2">Select a document to reference:</h4>
                      {analyzedDocuments.map((doc) => (
                        <div 
                          key={doc.id} 
                          className="p-2 text-sm border rounded hover:bg-muted cursor-pointer"
                          onClick={() => handleDocumentSelect(doc.id)}
                        >
                          {doc.original_filename}
                          <p className="text-xs text-muted-foreground">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            )}
            
            <div className="flex items-center w-full space-x-2">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
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
