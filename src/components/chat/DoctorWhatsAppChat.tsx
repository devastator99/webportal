
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessagesList } from "@/components/chat/ChatMessagesList";
import { ChatInput } from "@/components/chat/ChatInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { Separator } from "@/components/ui/separator";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { useIsMobile, useIsIPad } from "@/hooks/use-mobile";
import { ChevronLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role?: string;
}

export const DoctorWhatsAppChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const isIPad = useIsIPad();
  const [showSidebar, setShowSidebar] = useState(!isMobile);

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setShowSidebar(prev => !prev);
  };

  // Get assigned patients for doctor
  const { data: assignedPatients, isLoading, error } = useQuery({
    queryKey: ["doctor_patients", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      try {
        // Use the get_doctor_patients function
        const { data, error } = await supabase
          .rpc('get_doctor_patients', { p_doctor_id: user.id });
          
        if (error) throw error;
        
        // Sort by name
        const sortedPatients = [...(data || [])].sort((a, b) => {
          const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
          const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase();
          return nameA.localeCompare(nameB);
        });
        
        return sortedPatients;
      } catch (error) {
        console.error("Error fetching doctor's patients:", error);
        toast({
          title: "Error",
          description: "Could not load patient list",
          variant: "destructive"
        });
        return [];
      }
    },
    enabled: !!user?.id
  });

  // Select first patient by default if none selected
  useEffect(() => {
    if (assignedPatients?.length && !selectedPatientId) {
      setSelectedPatientId(assignedPatients[0].id);
    }
  }, [assignedPatients, selectedPatientId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedPatientId || !user?.id) return;
    
    try {
      // Create temporary message for immediate display
      const tempMessage = {
        id: uuidv4(),
        message: newMessage,
        message_type: "text",
        created_at: new Date().toISOString(),
        read: false,
        sender: {
          id: user.id,
          first_name: user.user_metadata?.first_name || "Doctor",
          last_name: user.user_metadata?.last_name || "",
          role: "doctor"
        },
        receiver: {
          id: selectedPatientId,
          first_name: null,
          last_name: null
        },
        synced: true
      };
      
      // Add to local messages array so it shows immediately
      setLocalMessages(prev => [...prev, tempMessage]);
      
      // Send message to selected patient
      await supabase.functions.invoke("send-chat-message", {
        body: {
          sender_id: user.id,
          receiver_id: selectedPatientId,
          message: newMessage,
          message_type: "text"
        }
      });
      
      // Clear input after sending
      setNewMessage("");
      
      // Invalidate the query to refresh messages
      queryClient.invalidateQueries({ 
        queryKey: ["chat_messages", user.id, selectedPatientId] 
      });
      
      toast({
        title: "Message sent",
        duration: 2000,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error sending message",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();
  };

  // If no patients assigned
  if (assignedPatients?.length === 0 && !isLoading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent>
          <p className="text-muted-foreground text-center">
            No patients assigned to you yet. Ask an administrator to assign patients.
          </p>
        </CardContent>
      </Card>
    );
  }

  const selectedPatient = assignedPatients?.find(p => p.id === selectedPatientId);

  // If it's a mobile device, only show one view at a time
  const showChatOnly = isMobile && selectedPatientId && !showSidebar;
  const showSidebarOnly = isMobile && showSidebar;

  return (
    <ErrorBoundary>
      <Card className="h-full flex flex-col">
        <CardContent className="p-0 flex flex-1 overflow-hidden">
          {/* Patient list sidebar - WhatsApp style */}
          {(showSidebar || showSidebarOnly) && (
            <div className={`${showSidebarOnly ? 'w-full' : (isIPad ? 'w-2/5' : 'w-1/3')} border-r h-full bg-background relative`}>
              <div className="p-3 bg-muted/40 border-b flex justify-between items-center">
                <h3 className="font-medium">Patients</h3>
                {isMobile && (
                  <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[calc(100%-48px)]">
                {isLoading ? (
                  <div className="py-2 px-4">Loading patients...</div>
                ) : (
                  <div className="space-y-0">
                    {assignedPatients?.map((patient) => (
                      <div key={patient.id}>
                        <div 
                          className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                            selectedPatientId === patient.id ? 'bg-muted' : ''
                          }`}
                          onClick={() => {
                            setSelectedPatientId(patient.id);
                            if (isMobile) {
                              setShowSidebar(false);
                            }
                          }}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(patient.first_name, patient.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {patient.first_name} {patient.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              Click to view conversation
                            </div>
                          </div>
                        </div>
                        <Separator />
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
          
          {/* Chat messages area - WhatsApp style */}
          {(!showSidebarOnly) && (
            <div className="flex-1 flex flex-col h-full relative">
              {selectedPatientId ? (
                <>
                  {/* Chat header - WhatsApp style */}
                  <div className="p-3 bg-muted/40 border-b flex items-center gap-3">
                    {(isMobile || isIPad) && !showSidebar && (
                      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-1">
                        <Menu className="h-5 w-5" />
                      </Button>
                    )}
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {selectedPatient ? getInitials(selectedPatient.first_name, selectedPatient.last_name) : "PT"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : 'Loading...'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Patient
                      </div>
                    </div>
                  </div>
                  
                  {/* Chat messages - WhatsApp style */}
                  <div className="flex-1 flex flex-col h-full bg-[#f0f2f5] dark:bg-slate-900">
                    <ChatMessagesList
                      selectedUserId={selectedPatientId}
                      isGroupChat={false}
                      localMessages={localMessages.filter(msg => 
                        (msg.sender.id === user?.id && msg.receiver.id === selectedPatientId) || 
                        (msg.sender.id === selectedPatientId && msg.receiver.id === user?.id)
                      )}
                    />
                    
                    {/* Chat input - WhatsApp style */}
                    <div className="p-3 bg-background border-t">
                      <ChatInput
                        value={newMessage}
                        onChange={setNewMessage}
                        onSend={handleSendMessage}
                        placeholder="Type a message..."
                        disabled={!selectedPatientId}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  {error ? (
                    <div className="text-center p-6 text-destructive">
                      <p>Error loading patient chats</p>
                      <p className="text-sm mt-2">Please refresh the page or contact support</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      Select a patient to view conversation
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
};
