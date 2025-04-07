
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
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
  
  // Check if the current user is a provider (doctor or nutritionist)
  const isProvider = userRole === 'doctor' || userRole === 'nutritionist';
  
  // Query to get user's care team rooms
  const { data: roomsData = [], isLoading } = useQuery({
    queryKey: ["care_team_rooms", user?.id, userRole],
    queryFn: async () => {
      if (!user?.id) return [];
      
      try {
        console.log("Fetching care team rooms for user:", user.id, "with role:", userRole);
        
        // For doctors and nutritionists, get all patients assigned to them
        if (isProvider) {
          // Get assigned patient IDs based on user role
          let patientsData = [];
          
          // Query the appropriate function based on role
          if (userRole === 'doctor') {
            const { data, error } = await supabase.rpc('get_doctor_patients', { 
              p_doctor_id: user.id 
            });
            
            if (error) {
              console.error("Error fetching doctor's patients:", error);
              throw error;
            }
            
            patientsData = data || [];
          } 
          else if (userRole === 'nutritionist') {
            const { data, error } = await supabase.rpc('get_nutritionist_patients', { 
              p_nutritionist_id: user.id 
            });
            
            if (error) {
              console.error("Error fetching nutritionist's patients:", error);
              throw error;
            }
            
            // Format nutritionist's patients to match doctor's patients format
            patientsData = (data || []).map(p => ({
              id: p.patient_id,
              first_name: p.patient_first_name,
              last_name: p.patient_last_name
            }));
          }
          
          console.log(`Provider has ${patientsData.length} assigned patients`);
          
          if (patientsData.length === 0) {
            return [];
          }
          
          // Extract just the patient IDs
          const patientIds = patientsData.map(p => p.id);
          
          // Process each patient to get or create their care team room
          const roomsWithDetails: CareTeamRoom[] = [];
          
          for (const patient of patientsData) {
            try {
              // First, check if a care team room already exists for this patient
              const { data: existingRooms, error: roomError } = await supabase
                .from('chat_rooms')
                .select('*')
                .eq('patient_id', patient.id)
                .eq('room_type', 'care_team')
                .eq('is_active', true);
                
              if (roomError) {
                console.error("Error checking for existing room:", roomError);
                continue;
              }
              
              let roomId: string;
              let roomName = `${patient.first_name} ${patient.last_name} - Care Team`;
              let roomDescription = `Care team for ${patient.first_name} ${patient.last_name}`;
              
              // If no room exists, create one
              if (!existingRooms || existingRooms.length === 0) {
                console.log(`Creating new care team room for patient: ${patient.first_name} ${patient.last_name}`);
                
                // Create the room
                const { data: newRoom, error: createError } = await supabase
                  .from('chat_rooms')
                  .insert({
                    name: roomName,
                    description: roomDescription,
                    room_type: 'care_team',
                    patient_id: patient.id,
                    is_active: true
                  })
                  .select('id')
                  .single();
                  
                if (createError) {
                  console.error("Error creating care team room:", createError);
                  continue;
                }
                
                roomId = newRoom.id;
                
                // Add the provider as member if they're not already a member
                const { error: memberError } = await supabase
                  .from('room_members')
                  .insert({
                    room_id: roomId,
                    user_id: user.id,
                    role: userRole
                  });
                  
                if (memberError && !memberError.message.includes('duplicate key')) {
                  console.error("Error adding provider to room:", memberError);
                }
                
                // Add patient as member
                const { error: patientMemberError } = await supabase
                  .from('room_members')
                  .insert({
                    room_id: roomId,
                    user_id: patient.id,
                    role: 'patient'
                  });
                  
                if (patientMemberError && !patientMemberError.message.includes('duplicate key')) {
                  console.error("Error adding patient to room:", patientMemberError);
                }
                
                // Add the welcome message
                await supabase
                  .from('room_messages')
                  .insert({
                    room_id: roomId,
                    sender_id: user.id,
                    message: `Care team chat created for ${patient.first_name} ${patient.last_name}`,
                    is_system_message: true
                  });
              } 
              else {
                // Room exists, make sure provider is a member
                roomId = existingRooms[0].id;
                roomName = existingRooms[0].name;
                roomDescription = existingRooms[0].description || roomDescription;
                
                // Check if provider is already a member
                const { data: membershipData, error: membershipError } = await supabase
                  .from('room_members')
                  .select('id')
                  .eq('room_id', roomId)
                  .eq('user_id', user.id);
                  
                if (membershipError) {
                  console.error("Error checking room membership:", membershipError);
                  continue;
                }
                
                // If provider is not a member, add them
                if (!membershipData || membershipData.length === 0) {
                  console.log(`Adding provider to existing room: ${roomId}`);
                  const { error: addMemberError } = await supabase
                    .from('room_members')
                    .insert({
                      room_id: roomId,
                      user_id: user.id,
                      role: userRole
                    });
                    
                  if (addMemberError && !addMemberError.message.includes('duplicate key')) {
                    console.error("Error adding provider to room:", addMemberError);
                  }
                }
              }
              
              // Get member count
              const { count: memberCount } = await supabase
                .from('room_members')
                .select('*', { count: 'exact', head: true })
                .eq('room_id', roomId);
                
              // Get latest message
              const { data: latestMessageData } = await supabase
                .from('room_messages')
                .select('message, created_at')
                .eq('room_id', roomId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
                
              roomsWithDetails.push({
                room_id: roomId,
                room_name: roomName,
                room_description: roomDescription,
                patient_id: patient.id,
                patient_name: `${patient.first_name} ${patient.last_name}`,
                member_count: memberCount || 0,
                last_message: latestMessageData?.message || '',
                last_message_time: latestMessageData?.created_at || new Date().toISOString()
              });
            } catch (err) {
              console.error(`Error processing patient ${patient.id}:`, err);
            }
          }
          
          // Sort rooms by latest message
          return roomsWithDetails.sort((a, b) => {
            return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
          });
        }
        
        // For patients and other roles, get the rooms they are members of
        const { data: userRooms, error: roomsError } = await supabase
          .from('room_members')
          .select('room_id')
          .eq('user_id', user.id);
          
        if (roomsError) {
          console.error("Error fetching user's room memberships:", roomsError);
          throw roomsError;
        }
        
        if (!userRooms || userRooms.length === 0) {
          return [];
        }
        
        const roomIds = userRooms.map(r => r.room_id);
        
        // Get room details
        const { data: rooms, error: roomDetailsError } = await supabase
          .from('chat_rooms')
          .select('*')
          .in('id', roomIds)
          .eq('is_active', true)
          .eq('room_type', 'care_team');
          
        if (roomDetailsError) {
          console.error("Error fetching room details:", roomDetailsError);
          throw roomDetailsError;
        }
        
        // Process each room to get additional details
        const roomsWithDetails: CareTeamRoom[] = [];
        
        for (const room of rooms || []) {
          try {
            // Get patient name
            let patientName = 'Patient';
            
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
            
            // Get member count
            const { count: memberCount } = await supabase
              .from('room_members')
              .select('*', { count: 'exact', head: true })
              .eq('room_id', room.id);
              
            // Get latest message
            const { data: latestMessageData } = await supabase
              .from('room_messages')
              .select('message, created_at')
              .eq('room_id', room.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
              
            roomsWithDetails.push({
              room_id: room.id,
              room_name: room.name,
              room_description: room.description || '',
              patient_id: room.patient_id || '',
              patient_name: patientName,
              member_count: memberCount || 0,
              last_message: latestMessageData?.message || '',
              last_message_time: latestMessageData?.created_at || room.created_at
            });
          } catch (err) {
            console.error(`Error processing room ${room.id}:`, err);
          }
        }
        
        // Sort rooms by latest message
        return roomsWithDetails.sort((a, b) => {
          return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
        });
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
    refetchInterval: 10000
  });

  // Ensure rooms is always an array
  const rooms: CareTeamRoom[] = Array.isArray(roomsData) ? roomsData : [];

  // Function to group rooms by patient
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

  // Group rooms by patients (useful for doctor and nutritionist views)
  const roomsByPatient = isProvider 
    ? groupRoomsByPatient(rooms)
    : null;

  // Format relative time for messages
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
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
          ) : rooms.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              {isProvider ? 'No patient care teams available' : 'No care team chats available'}
            </div>
          ) : isProvider ? (
            // Display rooms grouped by patient for doctors and nutritionists
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
            // Standard flat list for other users
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

// Extracted room list item component for reusability
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
  
  // Get the appropriate avatar fallback color based on user role
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
