
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CareTeamRoomsSelector } from "@/components/chat/CareTeamRoomsSelector";
import { ChatMessagesList } from "@/components/chat/ChatMessagesList";
import { ChatInput } from "@/components/chat/ChatInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { useIsMobile, useIsIPad } from "@/hooks/use-mobile";
import { Menu, ChevronLeft, UserCircle, Users, MessageCircle, Loader, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface WhatsAppStyleChatInterfaceProps {
  patientRoomId?: string | null;
}

interface CareTeamMember {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
}

// Define interfaces for the careTeamInfo data structure
interface DoctorData {
  first_name: string | null;
  last_name: string | null;
}

interface NutritionistData {
  first_name: string | null;
  last_name: string | null;
}

interface CareTeamInfo {
  doctor?: DoctorData | null;
  nutritionist?: NutritionistData | null;
  doctor_id?: string | null;
  nutritionist_id?: string | null;
}

export const WhatsAppStyleChatInterface = ({ patientRoomId }: WhatsAppStyleChatInterfaceProps) => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(patientRoomId || null);
  const [newMessage, setNewMessage] = useState("");
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [roomMembers, setRoomMembers] = useState<CareTeamMember[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const isIPad = useIsIPad();
  const [showSidebar, setShowSidebar] = useState(!isMobile && userRole !== 'patient');
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isAiResponding, setIsAiResponding] = useState(false);
  
  useEffect(() => {
    if (patientRoomId) {
      console.log("Patient room ID provided to interface:", patientRoomId);
      setSelectedRoomId(patientRoomId);
      if (patientRoomId) {
        fetchRoomMembers(patientRoomId);
      }
      if (userRole === 'patient') {
        setShowSidebar(false);
      }
    }
  }, [patientRoomId, userRole, isMobile]);
  
  const toggleSidebar = () => {
    if (userRole !== 'patient') {
      setShowSidebar(prev => !prev);
    }
  };

  const fetchRoomMembers = async (roomId: string) => {
    if (!roomId) return;
    
    try {
      setIsLoadingMembers(true);
      console.log("Fetching members for room:", roomId);
      
      // Use the room_members table with RLS policies for secure access
      const { data, error } = await supabase
        .from('room_members')
        .select(`
          id,
          role,
          user_id,
          profiles:user_id(
            first_name,
            last_name
          )
        `)
        .eq('room_id', roomId);
        
      if (error) {
        console.error("Error fetching room members:", error);
        throw error;
      }
      
      console.log("Room members data:", data);
      
      const formattedMembers = data.map(member => {
        const profile = member.profiles && typeof member.profiles === 'object' 
          ? member.profiles 
          : { first_name: "User", last_name: "" };
        
        return {
          id: member.user_id,
          first_name: profile.first_name || "User",
          last_name: profile.last_name || "",
          role: member.role || "member"
        };
      });
      
      console.log("Formatted members:", formattedMembers);
      setRoomMembers(formattedMembers);
    } catch (error) {
      console.error("Error fetching room members:", error);
      toast({
        title: "Error",
        description: "Could not load room members",
        variant: "destructive"
      });
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const triggerAiResponse = async (messageText: string, roomId: string) => {
    try {
      setIsAiResponding(true);
      
      const { data, error } = await supabase.functions.invoke('care-team-ai-chat', {
        body: { 
          roomId: roomId,
          message: messageText
        }
      });
      
      if (error) {
        console.error("Error getting AI response:", error);
        throw error;
      }
      
      setIsAiResponding(false);
      return data;
    } catch (error) {
      console.error("Error in AI chat:", error);
      setIsAiResponding(false);
      return null;
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoomId || !user?.id) return;
    
    try {
      const tempMessage = {
        id: uuidv4(),
        message: newMessage,
        created_at: new Date().toISOString(),
        sender: {
          id: user.id,
          first_name: user.user_metadata?.first_name || (userRole === "doctor" ? "Doctor" : "Provider"),
          last_name: user.user_metadata?.last_name || "",
          role: userRole
        }
      };
      
      setLocalMessages(prev => [...prev, tempMessage]);
      
      // Send message using RPC function with SECURITY DEFINER
      const { data, error } = await supabase.rpc('send_room_message', {
        p_room_id: selectedRoomId,
        p_message: newMessage
      });
      
      if (error) throw error;
      
      const sentMessage = newMessage;
      setNewMessage("");
      
      if (userRole === 'patient') {
        const typingMessage = {
          id: uuidv4() + "-typing",
          message: "AI Assistant is typing...",
          created_at: new Date().toISOString(),
          sender: {
            id: "00000000-0000-0000-0000-000000000000",
            first_name: "AI",
            last_name: "Assistant",
            role: "aibot"
          },
          isTyping: true
        };
        
        setLocalMessages(prev => [...prev, typingMessage]);
        
        await triggerAiResponse(sentMessage, selectedRoomId);
        
        setLocalMessages(prev => prev.filter(msg => !msg.isTyping));
      }
      
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

  const { data: roomDetails, isLoading: isLoadingRoomDetails } = useQuery({
    queryKey: ["room_details", selectedRoomId],
    queryFn: async () => {
      if (!selectedRoomId) return null;
      
      try {
        console.log("Fetching details for room:", selectedRoomId);
        const { data, error } = await supabase
          .from('chat_rooms')
          .select(`
            id,
            name,
            description,
            patient_id,
            profiles:patient_id(
              first_name,
              last_name
            )
          `)
          .eq('id', selectedRoomId)
          .single();
          
        if (error) {
          console.error("Error fetching room details:", error);
          throw error;
        }
        
        console.log("Room details found:", data);
        return data;
      } catch (error) {
        console.error("Error fetching room details:", error);
        return null;
      }
    },
    enabled: !!selectedRoomId
  });

  // Fixed query to properly fetch patient assignment data
  const { data: careTeamInfo, isLoading: isLoadingCareTeam } = useQuery<CareTeamInfo | null>({
    queryKey: ["care_team_info", roomDetails?.patient_id],
    queryFn: async () => {
      if (!roomDetails?.patient_id) return null;
      
      try {
        // Fetch patient assignments to get doctor and nutritionist with proper joins
        const { data, error } = await supabase
          .from('patient_assignments')
          .select(`
            doctor_id,
            doctor:doctor_id(first_name, last_name),
            nutritionist_id,
            nutritionist:nutritionist_id(first_name, last_name)
          `)
          .eq('patient_id', roomDetails.patient_id)
          .single();
          
        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
          console.error("Error fetching patient assignments:", error);
          throw error;
        }
        
        return data || null;
      } catch (error) {
        console.error("Error fetching care team info:", error);
        return null;
      }
    },
    enabled: !!roomDetails?.patient_id
  });

  const showChatOnly = (isMobile && selectedRoomId && !showSidebar) || userRole === 'patient';
  const showSidebarOnly = isMobile && showSidebar && userRole !== 'patient';
  
  // For patients with no room
  const renderPatientEmptyState = () => {
    if (patientRoomId === null) {
      return (
        <div className="space-y-4">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
          <h3 className="font-medium text-xl mb-2">No Care Team Chat Available</h3>
          <p className="text-muted-foreground">
            It looks like you don't have a care team assigned yet or your care team chat hasn't been created.
          </p>
          <Alert className="mt-6">
            <AlertTitle>What to do next</AlertTitle>
            <AlertDescription>
              Please contact your healthcare provider to ensure you're assigned to a care team.
            </AlertDescription>
          </Alert>
        </div>
      );
    } else {
      return (
        <div className="space-y-4">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/60" />
          <p className="text-lg">Welcome to your care team chat</p>
          <p className="text-sm text-muted-foreground mt-1">
            No conversations started yet. Your healthcare team will be with you soon.
          </p>
        </div>
      );
    }
  };

  // Component to display care team members
  const CareTeamInfo = () => {
    // Safely extract doctor and nutritionist data with proper type checking
    const doctorData = careTeamInfo?.doctor && typeof careTeamInfo.doctor === 'object' 
      ? careTeamInfo.doctor as DoctorData 
      : null;
      
    const nutritionistData = careTeamInfo?.nutritionist && typeof careTeamInfo.nutritionist === 'object'
      ? careTeamInfo.nutritionist as NutritionistData
      : null;
    
    if (isLoadingCareTeam) {
      return <Skeleton className="h-4 w-24" />;
    }
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-xs text-muted-foreground flex items-center cursor-help">
              <Users className="h-3 w-3 mr-1" />
              <span>{roomMembers.length} members</span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="p-2 max-w-xs">
            <div className="space-y-1">
              <h4 className="text-xs font-semibold mb-1">Care Team</h4>
              {doctorData ? (
                <div className="flex items-center gap-1">
                  <UserCircle className="h-3 w-3 text-blue-500" />
                  <span className="text-xs">Dr. {doctorData.first_name} {doctorData.last_name}</span>
                  <Badge variant="outline" className="text-[10px] px-1 h-4">doctor</Badge>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">No doctor assigned</div>
              )}
              {nutritionistData ? (
                <div className="flex items-center gap-1">
                  <UserCircle className="h-3 w-3 text-green-500" />
                  <span className="text-xs">{nutritionistData.first_name} {nutritionistData.last_name}</span>
                  <Badge variant="outline" className="text-[10px] px-1 h-4">nutritionist</Badge>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">No nutritionist assigned</div>
              )}
              <div className="flex items-center gap-1">
                <UserCircle className="h-3 w-3 text-purple-500" />
                <span className="text-xs">AI Assistant</span>
                <Badge variant="outline" className="text-[10px] px-1 h-4">aibot</Badge>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <ErrorBoundary>
      <Card className="h-[calc(100vh-96px)] flex flex-col border shadow-lg">
        <CardContent className="p-0 flex flex-1 overflow-hidden">
          {(showSidebar || showSidebarOnly) && userRole !== 'patient' && (
            <div className={`${showSidebarOnly ? 'w-full' : (isIPad ? 'w-2/5' : 'w-1/4')} border-r h-full bg-background`}>
              <CareTeamRoomsSelector 
                selectedRoomId={selectedRoomId} 
                onSelectRoom={(roomId) => {
                  setSelectedRoomId(roomId);
                  if (roomId) {
                    fetchRoomMembers(roomId);
                  }
                  if (isMobile) {
                    setShowSidebar(false);
                  }
                }} 
              />
            </div>
          )}
          
          {(!showSidebarOnly) && (
            <div className="flex-1 flex flex-col h-full relative">
              {selectedRoomId ? (
                <>
                  <div className="p-3 bg-muted/40 border-b flex items-center gap-3">
                    {(isMobile || isIPad) && !showSidebar && userRole !== 'patient' && (
                      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-1">
                        <Menu className="h-5 w-5" />
                      </Button>
                    )}
                    
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {roomDetails?.name?.substring(0, 2).toUpperCase() || "CT"}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="font-medium">
                        {isLoadingRoomDetails ? (
                          <Skeleton className="h-5 w-40" />
                        ) : (
                          roomDetails?.name || 'Care Team Chat'
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <CareTeamInfo />
                      </div>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-auto"
                      onClick={() => {
                        // Safely extract doctor and nutritionist data with proper type checking
                        const doctorData = careTeamInfo?.doctor && typeof careTeamInfo.doctor === 'object' 
                          ? careTeamInfo.doctor as DoctorData
                          : null;
                          
                        const nutritionistData = careTeamInfo?.nutritionist && typeof careTeamInfo.nutritionist === 'object'
                          ? careTeamInfo.nutritionist as NutritionistData
                          : null;
                          
                        const doctorText = doctorData ? `Dr. ${doctorData.first_name} ${doctorData.last_name}` : "No doctor assigned";
                        const nutritionistText = nutritionistData ? `${nutritionistData.first_name} ${nutritionistData.last_name}` : "No nutritionist assigned";
                        
                        toast({
                          title: "Care Team Members",
                          description: `Doctor: ${doctorText}\nNutritionist: ${nutritionistText}\nAI Assistant`,
                          duration: 5000,
                        });
                      }}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Members
                    </Button>
                  </div>
                  
                  <div className="flex-1 flex flex-col h-full bg-[#f0f2f5] dark:bg-slate-900 overflow-hidden">
                    {isLoadingMembers ? (
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
                        localMessages={localMessages}
                        careTeamMembers={roomMembers}
                        useRoomMessages={true}
                      />
                    )}
                    
                    <div className="p-3 bg-background border-t">
                      <ChatInput
                        value={newMessage}
                        onChange={setNewMessage}
                        onSend={handleSendMessage}
                        placeholder={isAiResponding ? "AI Assistant is typing..." : "Type a message..."}
                        disabled={!selectedRoomId || isLoadingMembers || isAiResponding}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center p-6 max-w-md mx-auto">
                    {userRole === 'patient' ? (
                      renderPatientEmptyState()
                    ) : (
                      <>
                        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/60" />
                        <p className="text-lg">Select a care team chat</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Choose a room from the sidebar to start chatting
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
};
