
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Brain, Loader2, Send, CheckCircle, Download, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import html2pdf from 'html2pdf.js';

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
  const [isPdfAvailable, setIsPdfAvailable] = useState(false);
  const [suggestedPdfType, setSuggestedPdfType] = useState<string | null>(null);
  const [pdfContentOpen, setPdfContentOpen] = useState(false);
  const [pdfData, setPdfData] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const generatePdf = () => {
    if (!pdfData) return;
    
    try {
      const contentElement = document.getElementById('pdf-content');
      if (!contentElement) return;
      
      const pdfOptions = {
        margin: 10,
        filename: `${suggestedPdfType || 'document'}-${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      html2pdf().set(pdfOptions).from(contentElement).save();
      
      toast({
        title: "PDF Generated",
        description: "Your document has been downloaded",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const requestPdfGeneration = async () => {
    if (!suggestedPdfType || !user?.id) return;
    
    try {
      setIsLoading(true);
      
      // Add system message to the chat
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: `Generating ${suggestedPdfType} PDF for you, one moment please...`, 
          timestamp: new Date() 
        }
      ]);
      
      // Request PDF from AI assistant
      const { data, error } = await supabase.functions.invoke('doctor-ai-assistant', {
        body: { 
          messages: [{role: 'user', content: `Generate a ${suggestedPdfType} PDF`}],
          patientId: user?.id,
          isCareTeamChat,
          requestType: 'pdf_request'
        },
      });

      if (error) throw error;
      
      setPdfData(data.pdfData);
      
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
      
      // Open PDF preview
      setPdfContentOpen(true);
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
          patientId: user?.id,
          isCareTeamChat
        },
      });

      if (error) throw error;

      // Check if PDF generation is available
      if (data.isPdfAvailable) {
        setIsPdfAvailable(true);
        setSuggestedPdfType(data.suggestedPdfType);
      } else {
        setIsPdfAvailable(false);
        setSuggestedPdfType(null);
      }

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

  const renderPdfContent = () => {
    if (!pdfData || !suggestedPdfType) return null;
    
    switch (suggestedPdfType) {
      case 'prescription':
        return renderPrescriptionPdf();
      case 'health_plan':
        return renderHealthPlanPdf();
      case 'medical_report':
        return renderMedicalReportPdf();
      case 'invoice':
        return renderInvoicePdf();
      default:
        return <p>No content available</p>;
    }
  };
  
  const renderPrescriptionPdf = () => {
    const { prescriptions, patient } = pdfData;
    if (!prescriptions || prescriptions.length === 0) return <p>No prescription data available</p>;
    
    // Show the most recent prescription
    const latestPrescription = prescriptions[0];
    
    return (
      <div className="p-8 bg-white">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold mb-2">Medical Prescription</h1>
          <p className="text-sm text-gray-500">
            Issued on: {new Date(latestPrescription.created_at).toLocaleDateString()}
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="font-bold text-sm">Doctor</h3>
            <p>Dr. {latestPrescription.doctor_first_name} {latestPrescription.doctor_last_name}</p>
          </div>
          <div>
            <h3 className="font-bold text-sm">Patient</h3>
            <p>{patient.first_name} {patient.last_name}</p>
          </div>
        </div>
        
        <div className="my-4 border-t border-b py-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-bold">Diagnosis</h3>
              <p>{latestPrescription.diagnosis || "No diagnosis provided"}</p>
            </div>
            
            <div>
              <h3 className="font-bold">Prescription</h3>
              <p className="whitespace-pre-wrap">{latestPrescription.prescription || "No specific medications prescribed"}</p>
            </div>
            
            {latestPrescription.notes && (
              <div>
                <h3 className="font-bold">Additional Notes</h3>
                <p className="whitespace-pre-wrap">{latestPrescription.notes}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t text-xs text-gray-500">
          <p>This prescription is valid from {new Date(latestPrescription.created_at).toLocaleDateString()}</p>
          <p className="mt-2">Digitally issued via Anubhuti Care System</p>
        </div>
      </div>
    );
  };
  
  const renderHealthPlanPdf = () => {
    const { healthPlanItems, patient } = pdfData;
    if (!healthPlanItems || healthPlanItems.length === 0) return <p>No health plan data available</p>;
    
    // Group items by type
    const groupedItems: Record<string, any[]> = {
      food: [],
      exercise: [],
      medication: []
    };
    
    healthPlanItems.forEach((item: any) => {
      if (groupedItems[item.type]) {
        groupedItems[item.type].push(item);
      }
    });
    
    return (
      <div className="p-8 bg-white">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold mb-2">Health Plan</h1>
          <p className="text-sm text-gray-500">
            For: {patient.first_name} {patient.last_name}
          </p>
          <p className="text-sm text-gray-500">
            Generated on: {new Date().toLocaleDateString()}
          </p>
        </div>
        
        {Object.entries(groupedItems).map(([type, items]) => (
          items.length > 0 && (
            <div key={type} className="mb-6">
              <h2 className="text-lg font-bold mb-2 border-b pb-2 capitalize">{type} Plan</h2>
              <div className="space-y-3">
                {items.map((item: any) => (
                  <div key={item.id} className="border-b pb-2">
                    <div className="flex justify-between">
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-gray-500">{item.scheduled_time}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      <span>{item.frequency}</span>
                      {item.duration && <span> • Duration: {item.duration}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
        
        <div className="mt-8 pt-4 border-t text-xs text-gray-500">
          <p>Follow this health plan as prescribed. Contact your healthcare provider if you have any questions.</p>
          <p className="mt-2">Generated via Anubhuti Care System</p>
        </div>
      </div>
    );
  };
  
  const renderMedicalReportPdf = () => {
    const { medicalReports, patient } = pdfData;
    if (!medicalReports || medicalReports.length === 0) return <p>No medical reports available</p>;
    
    return (
      <div className="p-8 bg-white">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold mb-2">Medical Reports Summary</h1>
          <p className="text-sm text-gray-500">
            For: {patient.first_name} {patient.last_name}
          </p>
          <p className="text-sm text-gray-500">
            Generated on: {new Date().toLocaleDateString()}
          </p>
        </div>
        
        <div className="my-4">
          <h2 className="text-lg font-bold mb-2">Available Reports</h2>
          <div className="space-y-3">
            {medicalReports.map((report: any) => (
              <div key={report.id} className="border-b pb-2">
                <p className="font-medium">{report.file_name}</p>
                <p className="text-sm text-gray-500">
                  Uploaded: {new Date(report.uploaded_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t text-xs text-gray-500">
          <p>This is a summary of your medical reports. For detailed information, please review each report individually.</p>
          <p className="mt-2">Generated via Anubhuti Care System</p>
        </div>
      </div>
    );
  };
  
  const renderInvoicePdf = () => {
    const { invoices, patient } = pdfData;
    if (!invoices || invoices.length === 0) return <p>No invoice data available</p>;
    
    // Show the most recent invoice
    const latestInvoice = invoices[0];
    
    return (
      <div className="p-8 bg-white">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold mb-2">Invoice</h1>
          <p className="text-sm text-gray-500">
            Invoice Number: {latestInvoice.invoice_number}
          </p>
          <p className="text-sm text-gray-500">
            Date: {new Date(latestInvoice.created_at).toLocaleDateString()}
          </p>
        </div>
        
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-bold text-sm">Billed To</h3>
              <p>{patient.first_name} {patient.last_name}</p>
            </div>
            <div>
              <h3 className="font-bold text-sm">Status</h3>
              <p className={latestInvoice.status === 'paid' ? 'text-green-600' : 'text-amber-600'}>
                {latestInvoice.status.toUpperCase()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="my-4 border-t border-b py-4">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Description</th>
                <th className="text-right py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2">{latestInvoice.description || "Medical Services"}</td>
                <td className="text-right py-2">{latestInvoice.currency} {latestInvoice.amount.toFixed(2)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t">
                <th className="text-left py-2">Total</th>
                <th className="text-right py-2">{latestInvoice.currency} {latestInvoice.amount.toFixed(2)}</th>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <div className="mt-8 pt-4 border-t text-xs text-gray-500">
          <p>Thank you for choosing Anubhuti Care System</p>
          {latestInvoice.status !== 'paid' && <p className="mt-2">Please make payment before the due date</p>}
        </div>
      </div>
    );
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
              
              {isPdfAvailable && (
                <div className="flex justify-center my-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={requestPdfGeneration}
                    disabled={isLoading}
                  >
                    <FileText className="h-4 w-4" />
                    {isLoading ? "Generating..." : `Generate ${suggestedPdfType} PDF`}
                  </Button>
                </div>
              )}
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
      
      {/* PDF Preview Dialog */}
      <Dialog open={pdfContentOpen} onOpenChange={setPdfContentOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>
              {suggestedPdfType ? `${suggestedPdfType.replace('_', ' ')} PDF` : 'Document Preview'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="max-h-[70vh] overflow-y-auto">
            <div id="pdf-content">
              {renderPdfContent()}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setPdfContentOpen(false)}
            >
              Close
            </Button>
            <Button 
              onClick={generatePdf}
              className="bg-primary"
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
