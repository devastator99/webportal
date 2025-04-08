
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { NutritionistCareTeamRoomsSelector } from "./NutritionistCareTeamRoomsSelector";
import { ChatMessagesList } from "@/components/chat/ChatMessagesList";
import { ChatInput } from "@/components/chat/ChatInput";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useIsMobile, useIsIPad } from "@/hooks/use-mobile";
import { ChevronLeft, Menu, Utensils, Salad, Apple, Carrot } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role?: string;
}

export const NutritionistCareTeamChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [careTeamMembers, setCareTeamMembers] = useState<UserProfile[]>([]);
  const isMobile = useIsMobile();
  const isIPad = useIsIPad();
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const [isLoadingCareTeam, setIsLoadingCareTeam] = useState(false);
  const [currentPatient, setCurrentPatient] = useState<{id: string, name: string} | null>(null);

  const toggleSidebar = () => {
    setShowSidebar(prev => !prev);
  };

  // Get care team rooms for this nutritionist
  const { data: careTeamRooms = [], isLoading } = useQuery({
    queryKey: ["care_team_rooms", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      try {
        const { data, error } = await supabase
          .rpc('get_user_care_team_rooms', { 
            p_user_id: user.id 
          });
          
        if (error) {
          console.error("Error fetching care team rooms:", error);
          throw error;
        }
        
        return data || [];
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

  // When a room is selected, get patient info and care team members
  useEffect(() => {
    if (!selectedRoomId) {
      setCurrentPatient(null);
      setCareTeamMembers([]);
      setLocalMessages([]);
      return;
    }
    
    // Find the selected room to get patient info
    const room = careTeamRooms.find(room => room.room_id === selectedRoomId);
    if (room) {
      setCurrentPatient({
        id: room.patient_id,
        name: room.patient_name
      });
      
      // Fetch care team members
      const fetchCareTeam = async () => {
        try {
          setIsLoadingCareTeam(true);
          const { data, error } = await supabase
            .rpc('get_patient_care_team_members', {
              p_patient_id: room.patient_id
            });
            
          if (error) {
            console.error("Error fetching care team members:", error);
            throw error;
          }
          
          // Make sure AI bot is included
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
          const hasPatient = updatedCareTeam.some(member => member.id === room.patient_id);
          if (!hasPatient) {
            const patientName = room.patient_name?.split(' ') || ['Patient', ''];
            updatedCareTeam.push({
              id: room.patient_id,
              first_name: patientName[0] || 'Patient',
              last_name: patientName.slice(1).join(' ') || '',
              role: "patient"
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
    }
  }, [selectedRoomId, careTeamRooms, supabase, toast]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoomId || !user?.id) return;
    
    try {
      // Add message locally first for immediate display
      const tempMessage = {
        id: uuidv4(),
        message: newMessage,
        message_type: "text",
        created_at: new Date().toISOString(),
        read: false,
        sender: {
          id: user.id,
          first_name: user.user_metadata?.first_name || "Nutritionist",
          last_name: user.user_metadata?.last_name || "",
          role: "nutritionist"
        },
        receiver: {
          id: currentPatient?.id || "",
          first_name: null,
          last_name: null
        },
        synced: true
      };
      
      setLocalMessages(prev => [...prev, tempMessage]);
      
      // Send message to the room
      const { data, error } = await supabase.rpc('send_room_message', {
        p_room_id: selectedRoomId,
        p_message: newMessage
      });
      
      if (error) throw error;
      
      setNewMessage("");
      
      // Invalidate queries to refresh the messages
      queryClient.invalidateQueries({ 
        queryKey: ["room_messages", selectedRoomId] 
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

  if (isLoading && careTeamRooms.length === 0) {
    return <div className="h-full flex items-center justify-center"><Skeleton className="h-40 w-full" /></div>;
  }

  if (careTeamRooms.length === 0 && !isLoading) {
    return (
      <Card className="h-full flex flex-col items-center justify-center p-6">
        <Utensils className="h-12 w-12 text-green-500 mb-4" />
        <h3 className="text-xl font-medium mb-2">No Care Team Rooms</h3>
        <p className="text-center text-muted-foreground">
          You don't have any patients assigned yet. When patients are assigned to you, their care team rooms will appear here.
        </p>
      </Card>
    );
  }

  const showChatOnly = isMobile && selectedRoomId && !showSidebar;
  const showSidebarOnly = isMobile && showSidebar;

  return (
    <ErrorBoundary>
      <Card className="h-full flex flex-col">
        <CardContent className="p-0 flex flex-1 overflow-hidden">
          {/* Sidebar with Care Team Rooms */}
          {(showSidebar || showSidebarOnly) && (
            <div className={`${showSidebarOnly ? 'w-full' : (isIPad ? 'w-2/5' : 'w-1/3')} border-r h-full bg-background relative`}>
              <NutritionistCareTeamRoomsSelector
                selectedRoomId={selectedRoomId}
                onSelectRoom={(roomId) => {
                  setSelectedRoomId(roomId);
                  if (isMobile) {
                    setShowSidebar(false);
                  }
                }}
              />
            </div>
          )}
          
          {/* Care Team Chat Area */}
          {(!showSidebarOnly) && (
            <div className="flex-1 flex flex-col h-full relative">
              {selectedRoomId && currentPatient ? (
                <>
                  <div className="p-3 bg-muted/40 border-b flex items-center gap-3">
                    {(isMobile || isIPad) && !showSidebar && (
                      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-1">
                        <Menu className="h-5 w-5" />
                      </Button>
                    )}
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-green-100 text-green-800">
                        {getInitials(
                          currentPatient.name.split(' ')[0],
                          currentPatient.name.split(' ').slice(1).join(' ')
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {currentPatient.name}'s Care Team
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isLoadingCareTeam ? 
                          'Loading care team...' : 
                          `${careTeamMembers.length} care team members`
                        }
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
                        roomId={selectedRoomId}
                        selectedUserId={currentPatient.id}
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
                        placeholder="Type nutritional advice or questions..."
                        disabled={!selectedRoomId || isLoadingCareTeam}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                  <div className="flex space-x-2 mb-4">
                    <Salad className="h-8 w-8 text-green-500" />
                    <Apple className="h-8 w-8 text-red-400" />
                    <Carrot className="h-8 w-8 text-orange-400" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">Nutrition Care Team</h3>
                  <p>
                    Select a patient from the sidebar to view their care team chat
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
};
