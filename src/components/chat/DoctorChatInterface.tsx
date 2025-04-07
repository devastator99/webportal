
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatMessagesList } from "@/components/chat/ChatMessagesList";
import { ChatInput } from "@/components/chat/ChatInput";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role?: string;
}

export const DoctorChatInterface = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [localMessages, setLocalMessages] = useState<any[]>([]);

  // Get assigned patients for doctor
  const { data: assignedPatients, isLoading } = useQuery({
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
          last_name: null,
          role: "patient"
        },
        synced: true
      };
      
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
      <Card className="h-[400px] flex items-center justify-center">
        <CardContent>
          <p className="text-muted-foreground text-center">
            No patients assigned to you yet. Ask an administrator to assign patients.
          </p>
        </CardContent>
      </Card>
    );
  }

  const selectedPatient = assignedPatients?.find(p => p.id === selectedPatientId);

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle>Care Team Messages</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex flex-1 overflow-hidden">
        {/* Patient list sidebar */}
        <div className="w-1/3 border-r p-2 h-full">
          <ScrollArea className="h-full">
            {isLoading ? (
              <div className="py-2 px-4">Loading patients...</div>
            ) : (
              <div className="space-y-1">
                {assignedPatients?.map((patient) => (
                  <div 
                    key={patient.id}
                    className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-slate-100 transition-colors ${
                      selectedPatientId === patient.id ? 'bg-slate-100' : ''
                    }`}
                    onClick={() => setSelectedPatientId(patient.id)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {getInitials(patient.first_name, patient.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-sm font-medium truncate">
                      {patient.first_name} {patient.last_name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
        
        {/* Chat messages area */}
        <div className="flex-1 flex flex-col h-full">
          {selectedPatientId ? (
            <>
              <div className="p-3 border-b flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {selectedPatient ? getInitials(selectedPatient.first_name, selectedPatient.last_name) : "PT"}
                  </AvatarFallback>
                </Avatar>
                <div className="font-medium">
                  {selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}'s Care Team` : 'Loading...'}
                </div>
              </div>
              <div className="flex-1 flex flex-col h-full p-2">
                <ChatMessagesList
                  selectedUserId={selectedPatientId}
                  localMessages={localMessages}
                  isGroupChat={true}
                  includeCareTeamMessages={true}
                />
                <ChatInput
                  value={newMessage}
                  onChange={setNewMessage}
                  onSend={handleSendMessage}
                  placeholder="Type a message to the care team..."
                  disabled={!selectedPatientId}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a patient to view care team conversation
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
