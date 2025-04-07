
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
  
  // Check if the current user is a provider (doctor or nutritionist)
  const isProvider = userRole === 'doctor' || userRole === 'nutritionist';
  
  // Query to get user's care team rooms
  const { data: roomsData = [], isLoading } = useQuery({
    queryKey: ["care_team_rooms", user?.id, userRole],
    queryFn: async () => {
      if (!user?.id) return [];
      
      try {
        console.log("Fetching care team rooms for user:", user.id, "with role:", userRole);
        
        // For doctors and nutritionists, get all patients assigned to them first
        if (isProvider) {
          // Get assigned patient IDs based on user role
          let assignedPatientIds: string[] = [];
          
          if (userRole === 'doctor') {
            console.log("Getting patients assigned to doctor:", user.id);
            const { data: assignments, error: assignmentError } = await supabase
              .from('patient_assignments')
              .select('patient_id')
              .eq('doctor_id', user.id);
              
            if (assignmentError) {
              console.error("Error fetching doctor's patient assignments:", assignmentError);
              throw assignmentError;
            }
            
            assignedPatientIds = assignments.map(a => a.patient_id);
            console.log("Doctor has", assignedPatientIds.length, "assigned patients:", assignedPatientIds);
          } 
          else if (userRole === 'nutritionist') {
            console.log("Getting patients assigned to nutritionist:", user.id);
            const { data: assignments, error: assignmentError } = await supabase
              .from('patient_assignments')
              .select('patient_id')
              .eq('nutritionist_id', user.id);
              
            if (assignmentError) {
              console.error("Error fetching nutritionist's patient assignments:", assignmentError);
              throw assignmentError;
            }
            
            assignedPatientIds = assignments.map(a => a.patient_id);
            console.log("Nutritionist has", assignedPatientIds.length, "assigned patients:", assignedPatientIds);
          }
          
          if (assignedPatientIds.length === 0) {
            console.log("No assigned patients found for this provider");
            return [];
          }
          
          // Get care team rooms for these patients
          const roomsWithDetails: CareTeamRoom[] = [];
          
          // First get all the care team rooms for these patients
          const { data: roomsData, error: roomsError } = await supabase
            .from('chat_rooms')
            .select('id, name, description, room_type, patient_id, created_at')
            .in('patient_id', assignedPatientIds)
            .eq('is_active', true)
            .eq('room_type', 'care_team');
            
          if (roomsError) {
            console.error("Error fetching rooms for patients:", roomsError);
            throw roomsError;
          }
          
          if (!roomsData || roomsData.length === 0) {
            console.log("No care team rooms found for assigned patients, creating them now...");
            
            // No existing rooms, so let's create them for each patient
            for (const patientId of assignedPatientIds) {
              try {
                console.log("Creating care team room for patient:", patientId);
                
                // Get patient name first
                const { data: patientData, error: patientError } = await supabase
                  .from('profiles')
                  .select('first_name, last_name')
                  .eq('id', patientId)
                  .single();
                  
                if (patientError) {
                  console.error("Error fetching patient profile:", patientError);
                  continue;
                }
                
                const patientName = `${patientData.first_name || ''} ${patientData.last_name || ''}`.trim();
                const roomName = `${patientName} - Care Team`;
                
                // Create the room
                const { data: newRoom, error: createRoomError } = await supabase
                  .from('chat_rooms')
                  .insert({
                    name: roomName,
                    description: `Care team chat for ${patientName}`,
                    room_type: 'care_team',
                    patient_id: patientId,
                    is_active: true
                  })
                  .select('id')
                  .single();
                  
                if (createRoomError) {
                  console.error("Error creating room:", createRoomError);
                  continue;
                }
                
                // Add the provider as member
                const { error: memberError } = await supabase
                  .from('room_members')
                  .insert({
                    room_id: newRoom.id,
                    user_id: user.id,
                    role: userRole
                  });
                  
                if (memberError) {
                  console.error("Error adding provider to room:", memberError);
                }
                
                // Add patient as member
                const { error: patientMemberError } = await supabase
                  .from('room_members')
                  .insert({
                    room_id: newRoom.id,
                    user_id: patientId,
                    role: 'patient'
                  });
                  
                if (patientMemberError) {
                  console.error("Error adding patient to room:", patientMemberError);
                }
                
                // Add welcome message
                const { error: messageError } = await supabase
                  .from('room_messages')
                  .insert({
                    room_id: newRoom.id,
                    sender_id: user.id,
                    message: `Care team chat created for ${patientName}`,
                    is_system_message: true
                  });
                  
                if (messageError) {
                  console.error("Error adding welcome message:", messageError);
                }
                
                // Add this room to our results
                roomsWithDetails.push({
                  room_id: newRoom.id,
                  room_name: roomName,
                  room_description: `Care team chat for ${patientName}`,
                  patient_id: patientId,
                  patient_name: patientName,
                  member_count: 2, // Provider and patient
                  last_message: `Care team chat created for ${patientName}`,
                  last_message_time: new Date().toISOString()
                });
              } catch (err) {
                console.error("Error creating care team room:", err);
              }
            }
          } else {
            // Process existing rooms to get additional details
            console.log(`Found ${roomsData.length} existing care team rooms`);
            
            for (const room of roomsData) {
              // First check if provider is already a member of this room
              const { data: membershipData, error: membershipError } = await supabase
                .from('room_members')
                .select('id')
                .eq('room_id', room.id)
                .eq('user_id', user.id);
                
              if (membershipError) {
                console.error("Error checking room membership:", membershipError);
                continue;
              }
              
              // If provider is not a member of this room, add them
              if (!membershipData || membershipData.length === 0) {
                console.log("Adding provider to existing room:", room.id);
                const { error: addMemberError } = await supabase
                  .from('room_members')
                  .insert({
                    room_id: room.id,
                    user_id: user.id,
                    role: userRole
                  });
                  
                if (addMemberError) {
                  console.error("Error adding provider to room:", addMemberError);
                }
              }
              
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
                room_description: room.description,
                patient_id: room.patient_id,
                patient_name: patientName,
                member_count: memberCount || 0,
                last_message: latestMessageData?.message || '',
                last_message_time: latestMessageData?.created_at || room.created_at
              });
            }
          }
          
          // Sort rooms by latest message
          return roomsWithDetails.sort((a, b) => {
            return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
          });
        }
        
        // For other roles, just get the rooms where user is a member
        const { data: memberships, error: membershipError } = await supabase
          .from('room_members')
          .select('room_id')
          .eq('user_id', user.id);
          
        if (membershipError) {
          console.error("Error fetching room memberships:", membershipError);
          throw membershipError;
        }
        
        const roomIds = memberships.map(m => m.room_id);
        
        if (roomIds.length === 0) {
          return [];
        }
        
        // Get room details
        const { data: roomsData, error: roomsError } = await supabase
          .from('chat_rooms')
          .select('id, name, description, room_type, patient_id, created_at')
          .in('id', roomIds)
          .eq('is_active', true);
          
        if (roomsError) {
          console.error("Error fetching rooms data:", roomsError);
          throw roomsError;
        }
        
        const roomsWithDetails: CareTeamRoom[] = [];
        
        for (const room of roomsData) {
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
            room_description: room.description,
            patient_id: room.patient_id,
            patient_name: patientName,
            member_count: memberCount || 0,
            last_message: latestMessageData?.message || '',
            last_message_time: latestMessageData?.created_at || room.created_at
          });
        }
        
        // Sort rooms by latest message
        return roomsWithDetails.sort((a, b) => {
          return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
        });
      } catch (error) {
        console.error("Error fetching care team rooms:", error);
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

  // Determine the avatar icon based on user role
  const getRoleIcon = (patient: CareTeamRoom) => {
    if (userRole === 'doctor' || userRole === 'nutritionist') {
      return <User className="h-4 w-4" />;
    } else {
      return <Users className="h-4 w-4" />;
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
