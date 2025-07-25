
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CareTeamRoomChat } from "./CareTeamRoomChat";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Users, Clock, ChevronLeft, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useBreakpoint } from "@/hooks/use-responsive";
import { ResponsiveText } from "@/components/ui/responsive-typography";
import { ResponsiveChatContainer, ResponsiveChatHeader } from "./ResponsiveChatContainer";

interface ChatRoom {
  room_id: string;
  room_name: string;
  room_description: string;
  room_type: string;
  created_at: string;
  patient_id: string;
  patient_name: string;
  member_count: number;
  last_message: string | null;
  last_message_time: string | null;
}

export const ChatRoomInterface = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const { isSmallScreen, isMediumScreen } = useBreakpoint();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [showRoomsList, setShowRoomsList] = useState(true);

  // Get user's care team rooms
  const { data: rooms, isLoading, refetch } = useQuery({
    queryKey: ["care_team_rooms", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      try {
        // Make call to Supabase function to get rooms
        const { data, error } = await supabase
          .from('chat_rooms')
          .select(`
            id,
            name,
            description,
            room_type,
            created_at,
            patient_id,
            is_active
          `)
          .eq('is_active', true)
          .eq('room_type', 'care_team')
          // For non-patients, we need to get all rooms where they are a member
          .or(userRole === 'patient' ? `patient_id.eq.${user.id}` : '');
        
        if (error) {
          console.error("Error fetching care team rooms:", error);
          throw error;
        }
        
        // Get room members and last message for each room
        const enhancedRooms: ChatRoom[] = [];
        
        for (const room of data) {
          // Check if the user is a member of this room
          const { count: memberCount, error: memberError } = await supabase
            .from('room_members')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id);
            
          // Verify the current user is a member if they're not the patient
          if (userRole !== 'patient') {
            const { data: isMember, error: membershipError } = await supabase
              .from('room_members')
              .select('id', { count: 'exact', head: true })
              .eq('room_id', room.id)
              .eq('user_id', user.id);
              
            if (membershipError || !isMember) {
              // Skip rooms where the user is not a member
              continue;
            }
          }
            
          // Get last message
          const { data: lastMsg, error: msgError } = await supabase
            .from('room_messages')
            .select('message, created_at')
            .eq('room_id', room.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
          // Get patient name (if it's not the current user)
          let patientName = 'Unknown Patient';
          if (room.patient_id) {
            const { data: patientData, error: patientError } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', room.patient_id)
              .single();
              
            if (!patientError && patientData) {
              patientName = `${patientData.first_name || ''} ${patientData.last_name || ''}`.trim();
            }
          }
            
          enhancedRooms.push({
            room_id: room.id,
            room_name: room.name,
            room_description: room.description || '',
            room_type: room.room_type,
            created_at: room.created_at,
            patient_id: room.patient_id || '',
            patient_name: patientName,
            member_count: memberCount || 0,
            last_message: lastMsg?.message || null,
            last_message_time: lastMsg?.created_at || null
          });
        }
        
        return enhancedRooms;
      } catch (error) {
        console.error("Error in care team rooms query:", error);
        toast({
          title: "Error",
          description: "Could not load care team rooms. Please try again later.",
          variant: "destructive"
        });
        return [];
      }
    },
    enabled: !!user?.id,
    staleTime: 10000, // 10 seconds
    refetchInterval: 30000 // 30 seconds
  });

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
    if (isSmallScreen) {
      setShowRoomsList(false);
    }
  };

  const handleBackToRooms = () => {
    setSelectedRoomId(null);
    setShowRoomsList(true);
  };

  // Auto-select first room on larger screens
  useEffect(() => {
    if (!isSmallScreen && rooms?.length && !selectedRoomId) {
      setSelectedRoomId(rooms[0].room_id);
    }
  }, [rooms, isSmallScreen, selectedRoomId]);

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return '';
    return format(new Date(timestamp), 'MMM d, h:mm a');
  };

  return (
    <ResponsiveChatContainer className="flex rounded-md border overflow-hidden">
      {/* Rooms list - show on desktop or when not in chat view on mobile */}
      {(!isSmallScreen || showRoomsList) && (
        <div className={`${isSmallScreen ? 'w-full' : (isMediumScreen ? 'w-64' : 'w-80')} border-r flex flex-col`}>
          <ResponsiveChatHeader>
            <div className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-2 text-primary" />
              <ResponsiveText weight="semibold">
                Care Team Rooms
              </ResponsiveText>
            </div>
          </ResponsiveChatHeader>
          
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : rooms?.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No care team rooms found
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {rooms.map((room) => (
                  <Button
                    key={room.room_id}
                    variant={selectedRoomId === room.room_id ? "secondary" : "ghost"}
                    className={`w-full justify-start text-left h-auto py-3 ${
                      selectedRoomId === room.room_id ? 'bg-secondary' : ''
                    }`}
                    onClick={() => handleRoomSelect(room.room_id)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <Avatar className={isSmallScreen ? "h-8 w-8" : "h-10 w-10"}>
                        <AvatarFallback className="bg-primary/10">
                          {room.patient_name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div className={`font-medium truncate ${isSmallScreen ? 'text-sm' : ''}`}>
                            {room.room_name}
                          </div>
                          {room.last_message_time && (
                            <div className={`text-muted-foreground whitespace-nowrap ml-2 ${isSmallScreen ? 'text-[10px]' : 'text-xs'}`}>
                              {formatTimestamp(room.last_message_time)}
                            </div>
                          )}
                        </div>
                        
                        <div className={`text-muted-foreground truncate ${isSmallScreen ? 'text-xs' : 'text-sm'}`}>
                          {room.last_message || "No messages yet"}
                        </div>
                        
                        <div className="flex items-center mt-1">
                          <Badge variant="outline" className={`${isSmallScreen ? 'text-[10px] h-4' : 'text-xs h-5'}`}>
                            <Users className={isSmallScreen ? "h-2.5 w-2.5 mr-0.5" : "h-3 w-3 mr-1"} />
                            {room.member_count}
                          </Badge>
                          
                          <Badge variant="outline" className={`ml-1 ${isSmallScreen ? 'text-[10px] h-4' : 'text-xs h-5'}`}>
                            <Clock className={isSmallScreen ? "h-2.5 w-2.5 mr-0.5" : "h-3 w-3 mr-1"} />
                            {format(new Date(room.created_at), 'MMM d')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
      
      {/* Chat area - show on desktop or when in chat view on mobile */}
      <div className={`${isSmallScreen && showRoomsList ? 'hidden' : 'flex'} flex-1 flex-col bg-muted/20`}>
        {isSmallScreen && selectedRoomId && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="m-2" 
            onClick={handleBackToRooms}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Rooms
          </Button>
        )}
        
        {selectedRoomId ? (
          <CareTeamRoomChat 
            selectedRoomId={selectedRoomId} 
            onBack={isSmallScreen ? handleBackToRooms : undefined}
            isMobileView={isSmallScreen}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground p-4">
            {!isSmallScreen && "Select a care team on the left to start chatting"}
          </div>
        )}
      </div>
    </ResponsiveChatContainer>
  );
};
