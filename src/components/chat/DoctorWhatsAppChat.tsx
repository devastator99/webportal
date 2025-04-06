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
import { Skeleton } from "@/components/ui/skeleton";

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
  const [careTeamMembers, setCareTeamMembers] = useState<UserProfile[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const isIPad = useIsIPad();
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const [isLoadingCareTeam, setIsLoadingCareTeam] = useState(false);

  const toggleSidebar = () => {
    setShowSidebar(prev => !prev);
  };

  const { data: assignedPatients = [], isLoading: isLoadingPatients, error } = useQuery({
    queryKey: ["doctor_patients", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      try {
        console.log("Fetching patients assigned to doctor:", user.id);
        
        const { data, error } = await supabase
          .rpc('get_doctor_patients', { p_doctor_id: user.id });
          
        if (error) {
          console.error("Error in get_doctor_patients RPC:", error);
          throw error;
        }
        
        console.log("Patients retrieved:", data?.length || 0);
        
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
    enabled: !!user?.id,
    staleTime: 60000
  });

  useEffect(() => {
    if (assignedPatients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(assignedPatients[0].id);
    }
  }, [assignedPatients, selectedPatientId]);

  useEffect(() => {
    const fetchCareTeam = async () => {
      if (!selectedPatientId) return;
      
      try {
        setIsLoadingCareTeam(true);
        console.log("Fetching care team for patient:", selectedPatientId);
        
        const { data, error } = await supabase
          .rpc('get_patient_care_team_members', {
            p_patient_id: selectedPatientId
          });
          
        if (error) {
          console.error("Error in get_patient_care_team_members RPC:", error);
          throw error;
        }
        
        console.log("Care team members retrieved:", data?.length || 0);
        
        const updatedCareTeam = [...(data || [])];
        const hasAiBot = updatedCareTeam.some(member => 
          member.role === 'aibot' || member.id === '00000000-0000-0000-0000-000000000000'
        );
        
        if (!hasAiBot) {
          updatedCareTeam.push({
            id: '00000000-0000-0000-0000-000000000000',
            first_name: 'AI',
            last_name: 'Assistant',
            role: 'aibot'
          });
        }
        
        setCareTeamMembers(updatedCareTeam);
      } catch (error) {
        console.error("Error fetching care team:", error);
        toast({
          title: "Error",
          description: "Could not load care team members",
          variant: "destructive"
        });
      } finally {
        setIsLoadingCareTeam(false);
      }
    };
    
    fetchCareTeam();
  }, [selectedPatientId, toast]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedPatientId || !user?.id) return;
    
    try {
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
      
      setLocalMessages(prev => [...prev, tempMessage]);
      
      // Send message to patient
      const { data, error } = await supabase.rpc('send_chat_message', {
        p_sender_id: user.id,
        p_receiver_id: selectedPatientId,
        p_message: newMessage,
        p_message_type: 'text'
      });
      
      if (error) throw error;
      
      // Forward the message to all care team members so everyone sees the communication
      if (careTeamMembers && careTeamMembers.length > 0) {
        console.log("Forwarding doctor's message to care team members:", careTeamMembers.length);
        
        // Send the message to each care team member except self
        for (const member of careTeamMembers) {
          if (member.id !== user.id && member.id !== '00000000-0000-0000-0000-000000000000') {
            await supabase.rpc('send_chat_message', {
              p_sender_id: user.id,
              p_receiver_id: member.id,
              p_message: `[To Patient] ${newMessage}`,
              p_message_type: 'text'
            });
          }
        }
      }
      
      setNewMessage("");
      
      queryClient.invalidateQueries({ 
        queryKey: ["chat_messages"] 
      });
      
      try {
        console.log("Getting AI response for care team chat");
        
        const { data: aiResponse, error: aiError } = await supabase.functions.invoke('doctor-ai-assistant', {
          body: { 
            messages: [{ role: "user", content: newMessage }],
            preferredLanguage: 'en',
            patientId: selectedPatientId,
            isCareTeamChat: true
          },
        });
        
        if (aiError) {
          console.error("Error getting AI response:", aiError);
          return;
        }
        
        if (aiResponse && aiResponse.response) {
          setTimeout(() => {
            const aiMessage = {
              id: uuidv4(),
              message: aiResponse.response,
              message_type: "text",
              created_at: new Date().toISOString(),
              read: false,
              sender: {
                id: '00000000-0000-0000-0000-000000000000',
                first_name: 'AI',
                last_name: 'Assistant',
                role: 'aibot'
              },
              receiver: {
                id: selectedPatientId,
                first_name: null,
                last_name: null
              },
              synced: true
            };
            
            setLocalMessages(prev => [...prev, aiMessage]);
            
            // Send AI response to patient
            supabase.rpc('send_chat_message', {
              p_sender_id: '00000000-0000-0000-0000-000000000000',
              p_receiver_id: selectedPatientId,
              p_message: aiResponse.response,
              p_message_type: 'text'
            });
            
            // Also make sure to send AI response to ALL care team members
            careTeamMembers.forEach(async (member) => {
              if (member.id !== '00000000-0000-0000-0000-000000000000') {
                await supabase.rpc('send_chat_message', {
                  p_sender_id: '00000000-0000-0000-0000-000000000000',
                  p_receiver_id: member.id,
                  p_message: aiResponse.response,
                  p_message_type: 'text'
                });
              }
            });
            
            queryClient.invalidateQueries({ 
              queryKey: ["chat_messages"] 
            });
          }, 1500);
        }
      } catch (aiError) {
        console.error("Error getting AI response:", aiError);
      }
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

  if (isLoadingPatients && assignedPatients.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <CardContent className="p-4 flex flex-1 justify-center items-center">
          <div className="space-y-4 w-full max-w-md">
            <Skeleton className="h-10 w-full rounded-full" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-full" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (assignedPatients.length === 0 && !isLoadingPatients) {
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

  const selectedPatient = selectedPatientId 
    ? assignedPatients.find(p => p.id === selectedPatientId) 
    : undefined;

  const showChatOnly = isMobile && selectedPatientId && !showSidebar;
  const showSidebarOnly = isMobile && showSidebar;

  const shouldShowMessage = (message) => {
    if (!selectedPatientId || !user?.id) return false;
    
    // Direct messages between doctor and patient
    if ((message.sender.id === user?.id && message.receiver.id === selectedPatientId) || 
        (message.sender.id === selectedPatientId && message.receiver.id === user?.id)) {
      return true;
    }
    
    // AI bot messages for this patient
    if (message.sender.id === '00000000-0000-0000-0000-000000000000' && 
        (message.receiver.id === selectedPatientId || message.receiver.id === user?.id)) {
      return true;
    }
    
    // Care team messages related to this patient
    // Messages sent by care team members to the patient
    if (message.receiver.id === selectedPatientId && 
        careTeamMembers.some(member => member.id === message.sender.id)) {
      return true;
    }
    
    // Messages sent by the patient to care team members
    if (message.sender.id === selectedPatientId && 
        careTeamMembers.some(member => member.id === message.receiver.id)) {
      return true;
    }
    
    // Messages between care team members about the patient (containing "[To Patient]" marker)
    if (careTeamMembers.some(member => member.id === message.sender.id) && 
        careTeamMembers.some(member => member.id === message.receiver.id) &&
        message.message && message.message.includes("[To Patient]")) {
      return true;
    }
    
    return false;
  };

  return (
    <ErrorBoundary>
      <Card className="h-full flex flex-col">
        <CardContent className="p-0 flex flex-1 overflow-hidden">
          {/* Sidebar */}
          {(showSidebar || showSidebarOnly) && (
            <div className={`${showSidebarOnly ? 'w-full' : (isIPad ? 'w-2/5' : 'w-1/3')} border-r h-full bg-background relative`}>
              <div className="p-3 bg-muted/40 border-b flex justify-between items-center">
                {isMobile && (
                  <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}
                <span className="text-sm font-medium ml-2">Your Patients</span>
              </div>
              <ScrollArea className="h-[calc(100%-48px)]">
                {isLoadingPatients ? (
                  <div className="space-y-3 p-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-2/3" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-0">
                    {assignedPatients.map((patient) => (
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
          
          {/* Chat area */}
          {(!showSidebarOnly) && (
            <div className="flex-1 flex flex-col h-full relative">
              {selectedPatientId ? (
                <>
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
                        {isLoadingCareTeam ? 'Loading care team...' : `Patient${careTeamMembers.length > 1 ? ' + ' + (careTeamMembers.length - 1) + ' care team members' : ''}`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col h-full bg-[#f0f2f5] dark:bg-slate-900">
                    {isLoadingCareTeam ? (
                      <div className="flex-1 space-y-4 p-4">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                            <Skeleton className={`h-16 w-3/4 rounded-lg ${i % 2 === 0 ? 'bg-primary/5' : 'bg-muted'}`} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <ChatMessagesList
                        selectedUserId={selectedPatientId}
                        isGroupChat={false}
                        careTeamMembers={careTeamMembers}
                        localMessages={localMessages.filter(msg => shouldShowMessage(msg))}
                        includeCareTeamMessages={true}
                      />
                    )}
                    
                    <div className="p-3 bg-background border-t">
                      <ChatInput
                        value={newMessage}
                        onChange={setNewMessage}
                        onSend={handleSendMessage}
                        placeholder="Type a message..."
                        disabled={!selectedPatientId || isLoadingCareTeam}
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
