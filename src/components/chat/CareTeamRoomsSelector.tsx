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
  const { data: roomsData = [], isLoading, refetch, error } = useQuery({
    queryKey: ["care_team_rooms", user?.id, userRole],
    queryFn: async () => {
      if (!user?.id) return [];
      
      try {
        console.log("Fetching care team rooms for user:", user.id, "with role:", userRole);
        
        // DIRECT MEMBERSHIP CHECK - Start by checking rooms where the user is a member
        console.log("Checking direct room memberships for user:", user.id);
        const { data: directMemberships, error: directMembershipError } = await supabase
          .from('room_members')
          .select('room_id, role')
          .eq('user_id', user.id);
          
        if (directMembershipError) {
          console.error("Error fetching user's direct room memberships:", directMembershipError);
          throw directMembershipError;
        }
        
        console.log(`Found ${directMemberships?.length || 0} direct room memberships for user ${user.id}`);
        
        // Get all room IDs where user is directly a member
        let roomIds: string[] = [];
        if (directMemberships && directMemberships.length > 0) {
          roomIds = directMemberships.map(rm => rm.room_id);
          console.log(`Direct room membership IDs:`, roomIds);
        }
        
        // ADDITIONAL PROVIDER LOGIC - For providers, also look for rooms based on patient assignments
        if (isProvider && roomIds.length === 0) {
          console.log(`No direct memberships found for ${userRole}. Checking patient assignments...`);
          
          // For doctors and nutritionists, get all patients they're assigned to
          const assignmentTable = 'patient_assignments';
          const providerField = userRole === 'doctor' ? 'doctor_id' : 'nutritionist_id';
          
          const { data: patientAssignments, error: assignmentError } = await supabase
            .from(assignmentTable)
            .select('patient_id')
            .eq(providerField, user.id);
            
          if (assignmentError) {
            console.error(`Error fetching patient assignments for ${userRole}:`, assignmentError);
            throw assignmentError;
          }
          
          if (patientAssignments && patientAssignments.length > 0) {
            console.log(`Found ${patientAssignments.length} patient assignments for ${userRole} ${user.id}`);
            
            // Get rooms for these patients
            const patientIds = patientAssignments.map(pa => pa.patient_id);
            console.log("Looking for care team rooms for patients:", patientIds);
            
            const { data: patientRooms, error: patientRoomsError } = await supabase
              .from('chat_rooms')
              .select('id')
              .in('patient_id', patientIds)
              .eq('room_type', 'care_team')
              .eq('is_active', true);
              
            if (patientRoomsError) {
              console.error("Error fetching patient rooms:", patientRoomsError);
              throw patientRoomsError;
            }
            
            if (patientRooms && patientRooms.length > 0) {
              console.log(`Found ${patientRooms.length} care team rooms for provider's patients`);
              
              // Add these room IDs to the list
              const additionalRoomIds = patientRooms.map(r => r.id);
              roomIds = [...roomIds, ...additionalRoomIds];
              
              // CRITICAL: Ensure provider is added as a member to these rooms
              for (const roomId of additionalRoomIds) {
                console.log(`Checking if ${userRole} is a member of room ${roomId}`);
                
                const { data: membershipCheck, error: membershipCheckError } = await supabase
                  .from('room_members')
                  .select('id')
                  .eq('room_id', roomId)
                  .eq('user_id', user.id)
                  .maybeSingle();
                  
                if (membershipCheckError) {
                  console.error("Error checking room membership:", membershipCheckError);
                  continue;
                }
                
                if (!membershipCheck) {
                  console.log(`Adding ${userRole} as member to room ${roomId}`);
                  
                  const { error: addMemberError } = await supabase
                    .from('room_members')
                    .insert({
                      room_id: roomId,
                      user_id: user.id,
                      role: userRole
                    });
                    
                  if (addMemberError) {
                    console.error(`Error adding ${userRole} as member:`, addMemberError);
                  }
                }
              }
            }
          }
        }
        
        if (roomIds.length === 0) {
          console.log("No room IDs found for user, returning empty array");
          return [];
        }
        
        // Remove duplicates from roomIds
        roomIds = [...new Set(roomIds)];
        console.log(`Final set of ${roomIds.length} room IDs for user:`, roomIds);
        
        // Now get room details for all the rooms the user should have access to
        const { data: rooms, error: roomsError } = await supabase
          .from('chat_rooms')
          .select('*')
          .in('id', roomIds)
          .eq('is_active', true)
          .eq('room_type', 'care_team');
          
        if (roomsError) {
          console.error("Error fetching room details:", roomsError);
          throw roomsError;
        }
        
        console.log(`Retrieved ${rooms?.length || 0} active care team rooms`);
        
        if (!rooms || rooms.length === 0) {
          console.log("No care team rooms found");
          return [];
        }
        
        // Process each room to gather additional details
        const roomsWithDetails: CareTeamRoom[] = [];
        
        for (const room of rooms) {
          try {
            // Get patient name if it exists
            let patientName = 'Patient';
            
            if (room.patient_id) {
              const { data: patientData, error: patientError } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', room.patient_id)
                .single();
                
              if (!patientError && patientData) {
                patientName = `${patientData.first_name || ''} ${patientData.last_name || ''}`.trim() || 'Patient';
              }
            }
            
            // Get member count
            const { count: memberCount, error: memberCountError } = await supabase
              .from('room_members')
              .select('*', { count: 'exact', head: true })
              .eq('room_id', room.id);
              
            if (memberCountError) {
              console.error(`Error getting member count for room ${room.id}:`, memberCountError);
            }
            
            // Get latest message
            const { data: latestMessage, error: messageError } = await supabase
              .from('room_messages')
              .select('message, created_at')
              .eq('room_id', room.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
              
            if (messageError && messageError.code !== 'PGRST116') {
              console.error(`Error getting latest message for room ${room.id}:`, messageError);
            }
            
            roomsWithDetails.push({
              room_id: room.id,
              room_name: room.name || `Care Team for ${patientName}`,
              room_description: room.description || '',
              patient_id: room.patient_id || '',
              patient_name: patientName,
              member_count: memberCount || 0,
              last_message: latestMessage?.message || '',
              last_message_time: latestMessage?.created_at || room.created_at
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
          description: "Could not load care team rooms. Try syncing rooms from the admin dashboard.",
          variant: "destructive"
        });
        return [];
      }
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000 // Consider data stale after 10 seconds
  });

  // If error occurs, log it
  useEffect(() => {
    if (error) {
      console.error("Error in care team rooms query:", error);
    }
  }, [error]);

  // Function to manually refresh rooms
  const refreshRooms = async () => {
    try {
      console.log("Manually refreshing care team rooms");
      await refetch();
    } catch (error) {
      console.error("Error refreshing rooms:", error);
    }
  };

  // Auto-refresh on mount and when userRole or userId changes
  useEffect(() => {
    if (user?.id) {
      refreshRooms();
    }
  }, [user?.id, userRole]);

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
        {rooms.length === 0 && !isLoading && (
          <div className="text-xs text-muted-foreground mt-1 italic">
            {isProvider ? 
              "No care team rooms found. Ask an administrator to sync care teams." : 
              "No care team chats available."
            }
          </div>
        )}
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
