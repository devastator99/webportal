
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
      if (!selectedPatientId || !user?.id) return;
      
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
        
        // Make sure AI bot is in the care team
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
        
        // Make sure the current user (doctor) is included in the care team list
        const hasDoctorSelf = updatedCareTeam.some(member => member.id === user.id);
        if (!hasDoctorSelf) {
          updatedCareTeam.push({
            id: user.id,
            first_name: user.user_metadata?.first_name || "Doctor",
            last_name: user.user_metadata?.last_name || "",
            role: "doctor"
          });
        }
        
        // Also make sure to include the patient in the care team
        const hasPatient = updatedCareTeam.some(member => member.id === selectedPatientId);
        if (!hasPatient) {
          const selectedPatient = assignedPatients.find(p => p.id === selectedPatientId);
          if (selectedPatient) {
            updatedCareTeam.push({
              id: selectedPatientId,
              first_name: selectedPatient.first_name,
              last_name: selectedPatient.last_name,
              role: "patient"
            });
          }
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
  }, [selectedPatientId, user, toast, assignedPatients]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedPatientId || !user?.id) return;
    
    try {
      // This message will be seen by everyone in the care team
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
      
      // Send message to patient - this is the main record of the message
      const { data, error } = await supabase.rpc('send_chat_message', {
        p_sender_id: user.id,
        p_receiver_id: selectedPatientId,
        p_message: newMessage,
        p_message_type: 'text'
      });
      
      if (error) throw error;
      
      // Forward the message to all care team members so everyone sees the communication
      if (careTeamMembers && careTeamMembers.length > 0) {
        console.log("Forwarding message to all care team members:", careTeamMembers.length);
        
        // Send the message to each care team member except self
        for (const member of careTeamMembers) {
          if (member.id !== user.id && member.id !== '00000000-0000-0000-0000-000000000000' && member.id !== selectedPatientId) {
            await supabase.rpc('send_chat_message', {
              p_sender_id: user.id,
              p_receiver_id: member.id,
              p_message: newMessage,
              p_message_type: 'text'
            });
          }
        }
      }
      
      setNewMessage("");
      
      queryClient.invalidateQueries({ 
        queryKey: ["chat_messages"] 
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

  if (isLoadingPatients && assignedPatients.length === 0) {
    return <div className="h-full flex items-center justify-center"><Skeleton className="h-40 w-full" /></div>;
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
                <span className="text-sm font-medium ml-2">Care Teams</span>
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
                              Click to view care group
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
                        {selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name} - Care Group` : 'Loading...'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isLoadingCareTeam ? 'Loading care team...' : `${careTeamMembers.length} care team members`}
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
                        isGroupChat={true}
                        careTeamMembers={careTeamMembers}
                        localMessages={localMessages}
                      />
                    )}
                    
                    <div className="p-3 bg-background border-t">
                      <ChatInput
                        value={newMessage}
                        onChange={setNewMessage}
                        onSend={handleSendMessage}
                        placeholder="Type a message to the care group..."
                        disabled={!selectedPatientId || isLoadingCareTeam}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  {error ? (
                    <div className="text-center p-6 text-destructive">
                      <p>Error loading care groups</p>
                      <p className="text-sm mt-2">Please refresh the page or contact support</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      Select a patient to view care group messages
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
