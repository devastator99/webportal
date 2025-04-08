
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
  const { user, userRole } = useAuth();
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

  // Use the proper query to get care team rooms instead of just patients
  const { data: careTeamRooms = [], isLoading: isLoadingRooms, error } = useQuery({
    queryKey: ["user_care_team_rooms", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      try {
        console.log(`Fetching care team rooms for ${userRole}:`, user.id);
        
        const { data: rooms, error: roomsError } = await supabase
          .rpc('get_user_care_team_rooms', { 
            p_user_id: user.id 
          });
          
        if (roomsError) {
          console.error("Error fetching care team rooms:", roomsError);
          throw roomsError;
        }
        
        console.log("Care team rooms retrieved:", rooms?.length || 0);
        return rooms || [];
      } catch (error) {
        console.error("Error fetching care team rooms:", error);
        toast({
          title: "Error",
          description: "Could not load care team rooms",
          variant: "destructive"
        });
        return [];
      }
    },
    enabled: !!user?.id,
    staleTime: 30000 // Cache for 30 seconds
  });

  // When a new patient is selected, clear the local messages
  useEffect(() => {
    setLocalMessages([]);
  }, [selectedPatientId]);

  // Select first patient if none selected
  useEffect(() => {
    if (careTeamRooms.length > 0 && !selectedPatientId) {
      setSelectedPatientId(careTeamRooms[0].patient_id);
    }
  }, [careTeamRooms, selectedPatientId]);

  // Fetch care team members when a patient is selected
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
        
        console.log("Care team members retrieved:", data?.length || 0, data);
        
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
        
        // Include the patient in the care team
        const hasPatient = updatedCareTeam.some(member => member.id === selectedPatientId);
        if (!hasPatient) {
          // Get patient info from the care team rooms
          const selectedRoom = careTeamRooms.find(room => room.patient_id === selectedPatientId);
          
          if (selectedRoom) {
            const patientName = selectedRoom.patient_name?.split(' ') || ['Patient', ''];
            updatedCareTeam.push({
              id: selectedPatientId,
              first_name: patientName[0] || 'Patient',
              last_name: patientName.slice(1).join(' ') || '',
              role: "patient"
            });
          }
        }
        
        console.log("Final care team members:", updatedCareTeam);
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
  }, [selectedPatientId, user, toast, careTeamRooms, userRole]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedPatientId || !user?.id) return;
    
    try {
      // This message will be sent in the care team context
      const tempMessage = {
        id: uuidv4(),
        message: newMessage,
        message_type: "text",
        created_at: new Date().toISOString(),
        read: false,
        sender: {
          id: user.id,
          first_name: user.user_metadata?.first_name || (userRole === "doctor" ? "Doctor" : "Nutritionist"),
          last_name: user.user_metadata?.last_name || "",
          role: userRole
        },
        receiver: {
          id: selectedPatientId,
          first_name: null,
          last_name: null
        },
        synced: true
      };
      
      setLocalMessages(prev => [...prev, tempMessage]);
      
      // Get the room ID for this patient
      const selectedRoom = careTeamRooms.find(room => room.patient_id === selectedPatientId);
      
      if (selectedRoom) {
        // Send message to the room
        const { data, error } = await supabase.rpc('send_room_message', {
          p_room_id: selectedRoom.room_id,
          p_message: newMessage
        });
        
        if (error) throw error;
      } else {
        // Fallback to direct message if room not found
        const { data, error } = await supabase.rpc('send_chat_message', {
          p_sender_id: user.id,
          p_receiver_id: selectedPatientId,
          p_message: newMessage,
          p_message_type: 'text'
        });
        
        if (error) throw error;
      }
      
      setNewMessage("");
      
      // Invalidate queries to refresh the messages
      if (selectedRoom) {
        queryClient.invalidateQueries({ 
          queryKey: ["room_messages", selectedRoom.room_id] 
        });
      } else {
        queryClient.invalidateQueries({ 
          queryKey: ["chat_messages", user.id, selectedPatientId] 
        });
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

  if (isLoadingRooms && careTeamRooms.length === 0) {
    return <div className="h-full flex items-center justify-center"><Skeleton className="h-40 w-full" /></div>;
  }

  if (careTeamRooms.length === 0 && !isLoadingRooms) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent>
          <p className="text-muted-foreground text-center">
            No care team rooms found. Please contact an administrator if you believe this is an error.
          </p>
        </CardContent>
      </Card>
    );
  }

  const selectedRoom = selectedPatientId 
    ? careTeamRooms.find(room => room.patient_id === selectedPatientId) 
    : undefined;

  const showChatOnly = isMobile && selectedPatientId && !showSidebar;
  const showSidebarOnly = isMobile && showSidebar;

  return (
    <ErrorBoundary>
      <Card className="h-full flex flex-col">
        <CardContent className="p-0 flex flex-1 overflow-hidden">
          {/* Sidebar with Care Team Rooms */}
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
                {isLoadingRooms ? (
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
                    {careTeamRooms.map((room) => {
                      // Split the patient name into first and last name
                      const patientName = room.patient_name?.split(' ') || ['Patient', ''];
                      return (
                        <div key={room.room_id}>
                          <div 
                            className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                              selectedPatientId === room.patient_id ? 'bg-muted' : ''
                            }`}
                            onClick={() => {
                              setSelectedPatientId(room.patient_id);
                              if (isMobile) {
                                setShowSidebar(false);
                              }
                            }}
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getInitials(patientName[0], patientName.slice(1).join(' '))}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">
                                {room.patient_name || 'Unknown Patient'}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {room.last_message || 'No messages yet'}
                              </div>
                            </div>
                          </div>
                          <Separator />
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
          
          {/* Care Team Chat Area */}
          {(!showSidebarOnly) && (
            <div className="flex-1 flex flex-col h-full relative">
              {selectedPatientId && selectedRoom ? (
                <>
                  <div className="p-3 bg-muted/40 border-b flex items-center gap-3">
                    {(isMobile || isIPad) && !showSidebar && (
                      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-1">
                        <Menu className="h-5 w-5" />
                      </Button>
                    )}
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {selectedRoom.patient_name ? getInitials(
                          selectedRoom.patient_name.split(' ')[0],
                          selectedRoom.patient_name.split(' ').slice(1).join(' ')
                        ) : "PT"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {selectedRoom.room_name || 'Care Team Chat'}
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
                        roomId={selectedRoom.room_id}
                        selectedUserId={selectedPatientId}
                        careTeamMembers={careTeamMembers}
                        localMessages={localMessages}
                        useRoomMessages={true}
                      />
                    )}
                    
                    <div className="p-3 bg-background border-t">
                      <ChatInput
                        value={newMessage}
                        onChange={setNewMessage}
                        onSend={handleSendMessage}
                        placeholder="Type a message to the care team..."
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
                      Select a care team to view messages
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
