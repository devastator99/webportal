
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, User, Stethoscope, Utensils, Users, Clock } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

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
  
  const isProvider = userRole === 'doctor' || userRole === 'nutritionist';
  
  // Debug info
  console.log("CareTeamRoomsSelector: User info", { userId: user?.id, userRole, isProvider });
  
  const { data: roomsData = [], isLoading, refetch, error } = useQuery({
    queryKey: ["care_team_rooms", user?.id, userRole],
    queryFn: async () => {
      if (!user?.id) return [];
      
      try {
        console.log("Fetching care team rooms for user:", user.id, "with role:", userRole);
        
        // Get rooms directly from the database
        const { data: rooms, error: roomsError } = await supabase
          .rpc('get_user_care_team_rooms', { 
            p_user_id: user.id 
          });
          
        if (roomsError) {
          console.error("Error fetching care team rooms:", roomsError);
          throw roomsError;
        }
        
        console.log(`Found ${rooms?.length || 0} care team rooms for ${userRole} ${user.id}`);
        
        return rooms || [];
      } catch (error) {
        console.error("Error fetching care team rooms:", error);
        toast({
          title: "Error",
          description: "Could not load care team rooms. Try syncing rooms from the admin dashboard.",
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
      console.log("Manually refreshing care team rooms");
      queryClient.invalidateQueries({ queryKey: ["care_team_rooms"] });
      await refetch();
    } catch (error) {
      console.error("Error refreshing rooms:", error);
    }
  };

  useEffect(() => {
    if (user?.id) {
      refreshRooms();
    }
  }, [user?.id, userRole]);

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
    const date = new Date(timeString);
    
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  // Handler to manually sync care team rooms
  const handleSyncRooms = async () => {
    try {
      toast({
        title: "Syncing care team rooms",
        description: "Please use the admin dashboard to sync care team rooms",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error with sync request:", error);
      toast({
        title: "Error",
        description: "Could not process sync request",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 bg-muted/40 border-b">
        <div className="font-medium mb-2 flex items-center gap-2">
          {userRole === 'doctor' ? (
            <Stethoscope className="h-4 w-4 text-blue-500" />
          ) : userRole === 'nutritionist' ? (
            <Utensils className="h-4 w-4 text-green-500" />
          ) : (
            <MessageCircle className="h-4 w-4" />
          )}
          
          {userRole === 'doctor' ? 'Patient Care Teams' : 
           userRole === 'nutritionist' ? 'Nutrition Care Teams' : 
           'Care Team Chats'}
        </div>
        
        <button 
          onClick={handleSyncRooms}
          className="text-xs text-blue-500 hover:text-blue-700 underline mt-1"
        >
          Sync Care Team Rooms
        </button>
        
        {rooms.length === 0 && !isLoading && (
          <div className="text-xs text-muted-foreground mt-1 italic">
            {isProvider ? 
              "No care team rooms found. Ask an admin to sync your care teams." : 
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
