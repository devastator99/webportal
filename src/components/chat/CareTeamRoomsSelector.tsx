
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Search, MessageCircle, User } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

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
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Query to get user's care team rooms
  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["care_team_rooms", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .rpc('get_user_care_team_rooms', { p_user_id: user.id });
        
      if (error) {
        console.error("Error fetching care team rooms:", error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 10000
  });

  // Filter rooms based on search term
  const filteredRooms = searchTerm 
    ? rooms.filter(room => {
        const roomName = room.room_name?.toLowerCase() || '';
        const patientName = room.patient_name?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        return roomName.includes(search) || patientName.includes(search);
      })
    : rooms;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 bg-muted/40 border-b">
        <div className="font-medium mb-2 flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          Care Team Chats
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      
      {/* Room list */}
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
          ) : filteredRooms.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              {searchTerm ? 'No matching rooms found' : 'No care team chats available'}
            </div>
          ) : (
            filteredRooms.map((room) => {
              const hasLastMessage = !!room.last_message;
              const lastMessageTime = room.last_message_time 
                ? format(new Date(room.last_message_time), 'MMM d')
                : '';
              
              return (
                <div key={room.room_id}>
                  <div 
                    className={`p-3 flex gap-3 cursor-pointer hover:bg-muted/50 transition
                      ${selectedRoomId === room.room_id ? 'bg-muted' : ''}`}
                    onClick={() => onSelectRoom(room.room_id)}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10">
                        {room.patient_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <div className="font-medium text-sm truncate">
                          {room.room_name}
                        </div>
                        {hasLastMessage && (
                          <div className="text-xs text-muted-foreground flex-shrink-0">
                            {lastMessageTime}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <User className="h-3 w-3 mr-1" />
                        <div className="truncate">
                          {room.patient_name} • {room.member_count} members
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
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
