
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, User, Stethoscope, Utensils, Users, Clock, RefreshCw } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface CareTeamRoom {
  room_id: string;
  room_name: string;
  room_description: string;
  patient_id: string;
  patient_name: string;
  member_count: number;
  last_message: string;
  last_message_time: string;
}

interface CareTeamRoomsSelectorProps {
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
}

export const CareTeamRoomsSelector = ({ selectedRoomId, onSelectRoom }: CareTeamRoomsSelectorProps) => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  
  const isProvider = userRole === 'doctor' || userRole === 'nutritionist';
  
  // Debug info
  console.log("CareTeamRoomsSelector: User info", { userId: user?.id, userRole, isProvider });
  
  const { data: roomsData = [], isLoading, refetch, error } = useQuery({
    queryKey: ["care_team_rooms", user?.id, userRole],
    queryFn: async () => {
      if (!user?.id) return [];
      
      try {
        console.log("Fetching care team rooms for user:", user.id, "with role:", userRole);
        
        // Use the get_user_care_team_rooms function which now handles doctor role properly
        const { data, error } = await supabase
          .rpc('get_user_care_team_rooms', { 
            p_user_id: user.id 
          });
          
        if (error) {
          console.error("Error fetching care team rooms:", error);
          throw error;
        }
        
        console.log(`Found ${data?.length || 0} care team rooms for ${userRole} ${user.id}`);
        return data || [];
      } catch (error) {
        console.error("Error fetching care team rooms:", error);
        toast({
          title: "Error",
          description: "Could not load care team rooms.",
          variant: "destructive"
        });
        return [];
      }
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
    staleTime: 10000
  });

  useEffect(() => {
    if (error) {
      console.error("Error in care team rooms query:", error);
    }
  }, [error]);

  const refreshRooms = async () => {
    try {
      setIsSyncing(true);
      console.log("Manually refreshing care team rooms");
      
      // Simply refresh the list
      queryClient.invalidateQueries({ queryKey: ["care_team_rooms"] });
      await refetch();
      
      toast({
        title: "Rooms Refreshed",
        description: "Care team rooms list has been refreshed.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error refreshing rooms:", error);
      toast({
        title: "Error",
        description: "Could not refresh care team rooms.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      // Just fetch the rooms on component mount
      refetch();
    }
  }, [user?.id, userRole, refetch]);

  // DEBUGGING: Log the final rooms data
  useEffect(() => {
    console.log("Rooms data in component state:", roomsData);
  }, [roomsData]);

  const rooms: CareTeamRoom[] = Array.isArray(roomsData) ? roomsData : [];

  const groupRoomsByPatient = (rooms: CareTeamRoom[]) => {
    const groupedRooms: Record<string, CareTeamRoom[]> = {};
    
    rooms.forEach(room => {
      const patientId = room.patient_id || 'unknown';
      if (!groupedRooms[patientId]) {
        groupedRooms[patientId] = [];
      }
      groupedRooms[patientId].push(room);
    });
    
    return groupedRooms;
  };

  const roomsByPatient = isProvider 
    ? groupRoomsByPatient(rooms)
    : null;

  const formatMessageTime = (timeString: string) => {
    if (!timeString) return '';
    
    const date = new Date(timeString);
    
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 bg-muted/40 border-b">
        <div className="font-medium mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {userRole === 'doctor' ? (
              <Stethoscope className="h-4 w-4 text-blue-500" />
            ) : userRole === 'nutritionist' ? (
              <Utensils className="h-4 w-4 text-green-500" />
            ) : (
              <MessageCircle className="h-4 w-4" />
            )}
            
            {userRole === 'doctor' ? 'Patient Care Teams' : 
             userRole === 'nutritionist' ? 'Nutrition Care Teams' : 
             'Care Team Chat'}
          </div>
          
          <Button 
            onClick={refreshRooms} 
            variant="ghost" 
            size="icon" 
            disabled={isSyncing}
            title="Refresh rooms"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {rooms.length === 0 && !isLoading && (
          <div className="text-xs text-muted-foreground mt-1 italic">
            {isProvider ? 
              "No care team rooms found." : 
              "No care team chats available."
            }
          </div>
        )}
      </div>
      
      <ScrollArea className="flex-1">
        <div className="space-y-0">
          {isLoading ? (
            <div className="p-3 space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              {isProvider ? 'No patient care teams available' : 'No care team chats available'}
            </div>
          ) : isProvider ? (
            Object.entries(roomsByPatient || {}).map(([patientId, patientRooms]) => {
              const patientName = patientRooms[0]?.patient_name || 'Unknown Patient';
              
              return (
                <div key={patientId} className="mb-2">
                  <div className="px-3 py-2 text-sm font-medium text-muted-foreground bg-muted/30">
                    {patientName}
                  </div>
                  {patientRooms.map((room) => (
                    <RoomListItem 
                      key={room.room_id}
                      room={room}
                      selectedRoomId={selectedRoomId}
                      onSelectRoom={onSelectRoom}
                      userRole={userRole || ''}
                      formatMessageTime={formatMessageTime}
                    />
                  ))}
                </div>
              );
            })
          ) : (
            rooms.map((room) => (
              <RoomListItem 
                key={room.room_id}
                room={room}
                selectedRoomId={selectedRoomId}
                onSelectRoom={onSelectRoom}
                userRole={userRole || ''}
                formatMessageTime={formatMessageTime}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

interface RoomListItemProps {
  room: CareTeamRoom;
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  userRole: string;
  formatMessageTime: (timeString: string) => string;
}

const RoomListItem = ({ 
  room, 
  selectedRoomId, 
  onSelectRoom,
  userRole,
  formatMessageTime
}: RoomListItemProps) => {
  const hasLastMessage = !!room.last_message;
  const lastMessageTime = room.last_message_time 
    ? formatMessageTime(room.last_message_time)
    : '';
  
  const getAvatarClass = () => {
    if (userRole === 'doctor') {
      return 'bg-blue-100 text-blue-800';
    } else if (userRole === 'nutritionist') {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-primary/10';
  };

  return (
    <div key={room.room_id}>
      <div 
        className={`p-3 flex gap-3 cursor-pointer hover:bg-muted/50 transition
          ${selectedRoomId === room.room_id ? 'bg-muted' : ''}`}
        onClick={() => onSelectRoom(room.room_id)}
      >
        <Avatar className="h-12 w-12">
          <AvatarFallback className={getAvatarClass()}>
            {room.patient_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between">
            <div className="font-medium text-sm truncate">
              {room.room_name}
            </div>
            {hasLastMessage && (
              <div className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                {isToday(new Date(room.last_message_time)) && <Clock className="h-3 w-3" />}
                {lastMessageTime}
              </div>
            )}
          </div>
          
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {userRole === 'doctor' ? (
              <Stethoscope className="h-3 w-3 mr-1 text-blue-500" />
            ) : userRole === 'nutritionist' ? (
              <Utensils className="h-3 w-3 mr-1 text-green-500" />
            ) : (
              <User className="h-3 w-3 mr-1" />
            )}
            <div className="truncate">
              {room.patient_name}
              <Badge variant="outline" className="ml-1 text-[10px] px-1 h-4">
                {room.member_count} members
              </Badge>
            </div>
          </div>
          
          {hasLastMessage && (
            <div className="text-xs truncate mt-1 text-muted-foreground">
              {room.last_message}
            </div>
          )}
        </div>
      </div>
      <Separator />
    </div>
  );
};
