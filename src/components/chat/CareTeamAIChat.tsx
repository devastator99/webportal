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

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Define interfaces for our data
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

      if (input.toLowerCase().includes('prescription') && 
          (input.toLowerCase().includes('pdf') || 
           input.toLowerCase().includes('download') || 
           input.toLowerCase().includes('file') || 
           input.toLowerCase().includes('share'))) {
        
        const { data: doctorAssignment, error: doctorError } = await supabase
          .from('patient_assignments')
          .select('doctor_id')
          .eq('patient_id', user.id)
          .single();
          
        if (!doctorError && doctorAssignment?.doctor_id) {
          const { data: prescriptions, error: prescriptionError } = await supabase
            .rpc('get_patient_prescriptions', {
              p_patient_id: user.id,
              p_doctor_id: doctorAssignment.doctor_id
            });
            
          if (!prescriptionError && prescriptions && prescriptions.length > 0) {
            setSelectedPrescription(prescriptions[0] as Prescription);
            
            const aiResponse = { 
              role: 'assistant' as const, 
              content: `I've found your latest prescription from Dr. ${prescriptions[0].doctor_first_name} ${prescriptions[0].doctor_last_name}. Here's a preview that you can download as a PDF.`, 
              timestamp: new Date() 
            };
            
            setMessages(prev => [...prev, aiResponse]);
            
            setTimeout(() => {
              setPdfPreviewOpen(true);
              setIsLoading(false);
            }, 500);
            
            return;
          }
        }
      } else if (input.toLowerCase().includes('health plan') || 
               input.toLowerCase().includes('habit') || 
               input.toLowerCase().includes('routine') || 
               input.toLowerCase().includes('exercise') || 
               input.toLowerCase().includes('diet')) {
        
        const { data: healthPlan, error: healthPlanError } = await supabase
          .rpc('get_patient_health_plan', { p_patient_id: user.id });
          
        if (!healthPlanError && healthPlan && healthPlan.length > 0) {
          let healthPlanResponse = "Here's a summary of your health plan:\n\n";
          
          const groupedItems: Record<string, any[]> = {};
          healthPlan.forEach(item => {
            if (!groupedItems[item.type]) {
              groupedItems[item.type] = [];
            }
            groupedItems[item.type].push(item);
          });
          
          for (const [type, items] of Object.entries(groupedItems)) {
            healthPlanResponse += `${type.charAt(0).toUpperCase() + type.slice(1)}:\n`;
            for (const item of items) {
              healthPlanResponse += `• ${item.description} - ${item.scheduled_time} (${item.frequency})\n`;
            }
            healthPlanResponse += "\n";
          }
          
          healthPlanResponse += "You can view your complete health plan and track your progress in the Habits section of the app.";
          
          const aiResponse = { 
            role: 'assistant' as const, 
            content: healthPlanResponse, 
            timestamp: new Date() 
          };
          
          setMessages(prev => [...prev, aiResponse]);
          setIsLoading(false);
          setTimeout(scrollToBottom, 100);
          return;
        }
      }

      let patientContext: Record<string, any> = {};
      
      try {
        const { data: careTeamData, error: careTeamError } = await supabase
          .rpc('get_patient_care_team_members', { p_patient_id: user.id }) as unknown as { 
            data: CareTeamMember[] | null, 
            error: Error | null 
          };
        
        if (careTeamError) {
          console.error("Error checking care team with RPC:", careTeamError);
        } else if (careTeamData && Array.isArray(careTeamData)) {
          const doctorMember = careTeamData.find(member => member.role === 'doctor');
          if (doctorMember) {
            patientContext.hasDoctorAssigned = true;
            patientContext.doctorName = `Dr. ${doctorMember.first_name} ${doctorMember.last_name}`;
          } else {
            patientContext.hasDoctorAssigned = false;
          }
        }
      } catch (err) {
        console.error("Error in RPC call for care team:", err);
        patientContext.hasDoctorAssigned = false;
      }

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error("Error fetching patient profile:", profileError);
        } else if (profileData) {
          patientContext = {
            ...patientContext,
            patientName: `${profileData.first_name} ${profileData.last_name}`
          };
        }
      } catch (err) {
        console.error("Error fetching patient profile:", err);
      }

      const { data, error } = await supabase.functions.invoke('doctor-ai-assistant', {
        body: { 
          messages: messageHistory,
          patientId: user.id,
          isCareTeamChat: true,
          patientContext: patientContext
        },
      });

      if (error) throw error;

      const aiResponse = { 
        role: 'assistant' as const, 
        content: data.response, 
        timestamp: new Date() 
      };
      
      setMessages(prev => [...prev, aiResponse]);
      
      try {
        const { data: careTeamData } = await supabase
          .rpc('get_patient_care_team_members', { p_patient_id: user.id });
          
        if (careTeamData && Array.isArray(careTeamData)) {
          for (const member of careTeamData) {
            if (member.id !== '00000000-0000-0000-0000-000000000000') {
              await supabase.rpc('send_chat_message', {
                p_sender_id: '00000000-0000-0000-0000-000000000000',
                p_receiver_id: member.id,
                p_message: data.response,
                p_message_type: 'text'
              });
            }
          }
        }
      } catch (err) {
        console.error("Error forwarding AI message to care team:", err);
      }
      
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

  const recentMessages = messages.length > 5 ? messages.slice(-5) : messages;
  const historyMessages = messages.length > 5 ? messages.slice(0, -5) : [];

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
        {Object.keys(groupedHistoryMessages).length > 0 && (
          <Accordion type="single" collapsible className="mb-2 border rounded-md">
            <AccordionItem value="history">
              <AccordionTrigger className="px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
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
                        <span className="text-xs font-medium text-blue-500">AI Assistant</span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {format(message.timestamp, "p")}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
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
      
      <Dialog open={pdfPreviewOpen} onOpenChange={setPdfPreviewOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Prescription PDF Preview
            </DialogTitle>
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
                
                <hr className="my-4" />
                
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
