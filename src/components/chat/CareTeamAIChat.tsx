import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Brain, Loader2, Send, CheckCircle, ArrowDown, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import html2pdf from 'html2pdf.js';
import { useResponsive } from "@/contexts/ResponsiveContext";
import { useBreakpoint } from "@/hooks/use-responsive";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CareTeamMember {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
}

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface Prescription {
  id: string;
  created_at: string;
  diagnosis: string;
  prescription: string;
  notes: string;
  doctor_id: string;
  doctor_first_name: string;
  doctor_last_name: string;
}

export const CareTeamAIChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [isPdfAvailable, setIsPdfAvailable] = useState(false);
  const [suggestedPdfType, setSuggestedPdfType] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<any>(null);
  const { isMobile, isTablet } = useResponsive();
  const { isSmallScreen } = useBreakpoint();

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
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const generatePdf = async (prescription: Prescription) => {
    try {
      const element = document.getElementById('prescription-pdf-content');
      if (!element) return;
      
      const opt = {
        margin: 10,
        filename: `prescription-${prescription.id.slice(0, 8)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().set(opt).from(element).save();
      
      toast({
        title: "PDF Generated",
        description: "Your prescription PDF has been generated successfully.",
      });
    } catch (err) {
      console.error("Error generating PDF:", err);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating your prescription PDF.",
        variant: "destructive"
      });
    }
  };

  const requestPdfGeneration = async () => {
    if (!suggestedPdfType || !user?.id) return;
    
    try {
      setIsLoading(true);
      
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant' as const, 
          content: `Generating ${suggestedPdfType} PDF for you, one moment please...`, 
          timestamp: new Date() 
        }
      ]);
      
      const { data, error } = await supabase.functions.invoke('doctor-ai-assistant', {
        body: { 
          messages: [{role: 'user', content: `Generate a ${suggestedPdfType} PDF`}],
          patientId: user?.id,
          isCareTeamChat: true,
          requestType: 'pdf_request'
        },
      });

      if (error) throw error;
      
      setPdfData(data.pdfData);
      
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant' as const, 
          content: data.response, 
          timestamp: new Date() 
        }
      ]);
      
      setSelectedPrescription(data.pdfData?.prescriptions?.[0] || null);
      setPdfPreviewOpen(true);
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !user?.id) return;

    try {
      setIsLoading(true);
      
      const userMessage = { 
        role: 'user' as const, 
        content: input, 
        timestamp: new Date() 
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInput("");

      const messageHistory = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      if (isPdfRequest(input)) {
        const { data, error } = await supabase.functions.invoke('doctor-ai-assistant', {
          body: { 
            messages: messageHistory,
            patientId: user.id,
            isCareTeamChat: true
          }
        });
        
        if (error) throw error;
        
        if (data.isPdfAvailable) {
          setIsPdfAvailable(true);
          setSuggestedPdfType(data.suggestedPdfType);
        } else {
          setIsPdfAvailable(false);
          setSuggestedPdfType(null);
        }
        
        setMessages(prev => [
          ...prev, 
          { 
            role: 'assistant' as const, 
            content: data.response, 
            timestamp: new Date() 
          }
        ]);
        
        setIsLoading(false);
        return;
      }
      
      const aiResponse = { 
        role: 'assistant' as const, 
        content: "I understand you're asking about " + input.substring(0, 50) + "... Let me help you with that. Please note that I'm a simulated response, as this is a demo application.", 
        timestamp: new Date() 
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const isPdfRequest = (message: string): boolean => {
    const pdfKeywords = [
      'pdf', 'document', 'download', 'print', 'report', 
      'prescription pdf', 'health plan pdf', 'medical report pdf',
      'share my prescription', 'share my health plan', 'share my medical report',
      'generate pdf', 'create pdf', 'export'
    ];
    
    const lowerMessage = message.toLowerCase();
    return pdfKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-background border rounded-lg overflow-hidden">
      <div className="p-3 border-b bg-muted/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">AI Care Assistant</h2>
        </div>
        
        <Badge variant="outline" className="font-normal">
          Beta
        </Badge>
      </div>
      
      <div ref={scrollAreaRef} className="flex-1 overflow-hidden relative">
        <ScrollArea 
          className="h-full" 
          type="always"
        >
          <div 
            ref={scrollViewportRef}
            className="h-full overflow-auto"
          >
            <div className="p-2 space-y-3">
              {messages.map((message, i) => (
                <div 
                  key={i} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`${isMobile || isSmallScreen ? 'max-w-[90%]' : 'max-w-[80%]'} p-3 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    <div 
                      className={`text-xs mt-1 ${
                        message.role === 'user' 
                          ? 'text-primary-foreground/70' 
                          : 'text-muted-foreground'
                      }`}
                    >
                      {format(message.timestamp, 'h:mm a')}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </ScrollArea>
        
        {showScrollButton && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute bottom-4 right-4 rounded-full shadow-md bg-background"
            onClick={scrollToBottom}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="p-3 border-t bg-background">
        <div className="flex gap-2">
          <Textarea
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          <span>Your data is processed securely and confidentially</span>
        </div>
      </div>
      
      {isPdfAvailable && (
        <div className="flex justify-center my-3">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-white/50 backdrop-blur-sm"
            onClick={requestPdfGeneration}
            disabled={isLoading}
          >
            <FileText className="h-4 w-4" />
            {isLoading ? "Generating..." : `Generate ${suggestedPdfType?.replace('_', ' ')} PDF`}
          </Button>
        </div>
      )}
      
      <Dialog open={pdfPreviewOpen} onOpenChange={setPdfPreviewOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Prescription PDF Preview</DialogTitle>
          </DialogHeader>
          {selectedPrescription && (
            <div className="max-h-[70vh] overflow-y-auto">
              <div id="prescription-pdf-content" className="p-8 bg-white">
                <div className="text-center mb-6">
                  <h1 className="text-xl font-bold mb-2">Medical Prescription</h1>
                  <p className="text-sm text-gray-500">
                    Issued on: {new Date(selectedPrescription.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <h3 className="font-bold text-sm">Doctor</h3>
                    <p>Dr. {selectedPrescription.doctor_first_name} {selectedPrescription.doctor_last_name}</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Patient</h3>
                    <p>{user?.user_metadata?.first_name} {user?.user_metadata?.last_name}</p>
                  </div>
                </div>
                
                <div className="my-4 border-t border-b py-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold">Diagnosis</h3>
                      <p>{selectedPrescription.diagnosis || "No diagnosis provided"}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-bold">Prescription</h3>
                      <p className="whitespace-pre-wrap">{selectedPrescription.prescription || "No specific medications prescribed"}</p>
                    </div>
                    
                    {selectedPrescription.notes && (
                      <div>
                        <h3 className="font-bold">Additional Notes</h3>
                        <p className="whitespace-pre-wrap">{selectedPrescription.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-8 pt-4 border-t text-xs text-gray-500">
                  <p>This prescription is valid from {new Date(selectedPrescription.created_at).toLocaleDateString()}</p>
                  <p className="mt-2">Digitally issued via Anubhuti Care System</p>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setPdfPreviewOpen(false)}
            >
              Close
            </Button>
            <Button 
              onClick={() => selectedPrescription && generatePdf(selectedPrescription)}
            >
              <FileText className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
