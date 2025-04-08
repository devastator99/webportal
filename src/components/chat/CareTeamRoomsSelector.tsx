
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
        
        let roomsData = [];
        
        if (isProvider) {
          // We need to check both the assignments and room memberships
          console.log("Fetching as a provider - using patient assignments...");
          
          // Get all patient assignments for this provider
          const { data: assignments, error: assignmentError } = await supabase
            .from('patient_assignments')
            .select('patient_id, created_at')
            .eq(userRole === 'doctor' ? 'doctor_id' : 'nutritionist_id', user.id);
            
          if (assignmentError) {
            console.error("Error checking patient assignments:", assignmentError);
            throw assignmentError;
          }
          
          console.log(`Found ${assignments?.length || 0} patient assignments for ${userRole} ${user.id}`);
          
          // For each assigned patient, get or create their care team room
          if (assignments && assignments.length > 0) {
            const enhancedRooms = [];
            
            for (const assignment of assignments) {
              const patientId = assignment.patient_id;
              
              // Check if a care team room already exists for this patient
              const { data: existingRooms, error: roomError } = await supabase
                .from('chat_rooms')
                .select('id, name, description, patient_id, created_at')
                .eq('patient_id', patientId)
                .eq('room_type', 'care_team')
                .eq('is_active', true)
                .limit(1);
                
              if (roomError) {
                console.error(`Error checking room for patient ${patientId}:`, roomError);
                continue;
              }
              
              // Get patient info
              const { data: patientData, error: patientError } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', patientId)
                .maybeSingle();
                
              if (patientError) {
                console.error(`Error getting patient info for ${patientId}:`, patientError);
                continue;
              }
              
              const patientName = patientData ? 
                `${patientData.first_name || ''} ${patientData.last_name || ''}`.trim() : 
                'Unknown Patient';
                
              let roomId;
              
              if (existingRooms && existingRooms.length > 0) {
                // Room exists, check if provider is a member
                roomId = existingRooms[0].id;
                
                console.log(`Found existing room ${roomId} for patient ${patientId}`);
                
                const { data: membership, error: membershipError } = await supabase
                  .from('room_members')
                  .select('id')
                  .eq('room_id', roomId)
                  .eq('user_id', user.id)
                  .maybeSingle();
                  
                if (membershipError) {
                  console.error(`Error checking membership for room ${roomId}:`, membershipError);
                }
                
                // If provider is not a member of this room, add them
                if (!membership) {
                  console.log(`Provider not in room ${roomId}, adding provider to room members`);
                  
                  // Add provider to the room
                  const { error: addError } = await supabase
                    .from('room_members')
                    .insert({
                      room_id: roomId,
                      user_id: user.id,
                      role: userRole
                    });
                    
                  if (addError) {
                    console.error(`Error adding provider to room ${roomId}:`, addError);
                  } else {
                    console.log(`Successfully added provider to room ${roomId}`);
                    
                    // Add system message
                    await supabase
                      .from('room_messages')
                      .insert({
                        room_id: roomId,
                        sender_id: user.id,
                        message: `${userRole === 'doctor' ? 'Doctor' : 'Nutritionist'} joined the care team.`,
                        is_system_message: true
                      });
                  }
                } else {
                  console.log(`Provider is already a member of room ${roomId}`);
                }
              } else {
                // No room exists, create it and add all members
                console.log(`No care team room exists for patient ${patientId}, creating one`);
                
                // Call the create_care_team_room function
                const { data: newRoomId, error: createError } = await supabase
                  .rpc('create_care_team_room', {
                    p_patient_id: patientId,
                    p_doctor_id: userRole === 'doctor' ? user.id : null,
                    p_nutritionist_id: userRole === 'nutritionist' ? user.id : null
                  });
                  
                if (createError) {
                  console.error(`Error creating room for patient ${patientId}:`, createError);
                  continue;
                }
                
                roomId = newRoomId;
                console.log(`Created new care team room ${roomId} for patient ${patientId}`);
              }
              
              // Get member count
              const { count: memberCount, error: countError } = await supabase
                .from('room_members')
                .select('id', { count: 'exact', head: true })
                .eq('room_id', roomId);
                
              if (countError) {
                console.error(`Error getting member count for room ${roomId}:`, countError);
              }
              
              // Get last message
              const { data: lastMessage, error: messageError } = await supabase
                .from('room_messages')
                .select('message, created_at')
                .eq('room_id', roomId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
                
              if (messageError && messageError.code !== 'PGRST116') {
                console.error(`Error getting last message for room ${roomId}:`, messageError);
              }
              
              // Add room to results
              enhancedRooms.push({
                room_id: roomId,
                room_name: `Care Team: ${patientName}`,
                room_description: `Care team chat for ${patientName}`,
                patient_id: patientId,
                patient_name: patientName,
                member_count: memberCount || 0,
                last_message: lastMessage?.message || '',
                last_message_time: lastMessage?.created_at || assignment.created_at
              });
            }
            
            roomsData = enhancedRooms;
          }
        } else {
          // For patients, get rooms where they are a patient
          const { data: patientRooms, error: patientRoomsError } = await supabase
            .from('chat_rooms')
            .select(`
              id,
              name,
              description,
              patient_id,
              created_at,
              room_type
            `)
            .eq('patient_id', user.id)
            .eq('room_type', 'care_team')
            .eq('is_active', true);
            
          if (patientRoomsError) {
            console.error("Error fetching patient rooms:", patientRoomsError);
            throw patientRoomsError;
          }
          
          console.log(`Found ${patientRooms?.length || 0} care team rooms for patient ${user.id}`);
          
          // Get additional details for each room
          const enhancedRooms = [];
          
          for (const room of patientRooms || []) {
            // Get member count
            const { count: memberCount, error: countError } = await supabase
              .from('room_members')
              .select('id', { count: 'exact', head: true })
              .eq('room_id', room.id);
              
            if (countError) {
              console.error(`Error getting member count for room ${room.id}:`, countError);
            }
            
            // Get last message
            const { data: lastMessage, error: messageError } = await supabase
              .from('room_messages')
              .select('message, created_at')
              .eq('room_id', room.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
              
            if (messageError && messageError.code !== 'PGRST116') {
              console.error(`Error getting last message for room ${room.id}:`, messageError);
            }
            
            // Add room to results
            enhancedRooms.push({
              room_id: room.id,
              room_name: room.name || 'Care Team Chat',
              room_description: room.description || '',
              patient_id: user.id,
              patient_name: 'You',
              member_count: memberCount || 0,
              last_message: lastMessage?.message || '',
              last_message_time: lastMessage?.created_at || room.created_at
            });
          }
          
          roomsData = enhancedRooms;
        }
        
        // DEBUGGING: Log the final rooms data
        console.log("Final rooms data to be returned:", roomsData);
        
        return roomsData.sort((a, b) => {
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
    if (!user?.id) return;
    
    try {
      console.log("Manually triggering care team room sync");
      toast({
        title: "Syncing care team rooms",
        description: "Please wait...",
        duration: 2000,
      });
      
      // For providers, we'll sync based on their patient assignments
      if (isProvider) {
        const { data: assignments, error: assignmentError } = await supabase
          .from('patient_assignments')
          .select('patient_id')
          .eq(userRole === 'doctor' ? 'doctor_id' : 'nutritionist_id', user.id);
          
        if (assignmentError) {
          throw assignmentError;
        }
        
        console.log(`Found ${assignments?.length || 0} patient assignments to sync`);
        
        // For each assignment, ensure a care team room exists and provider is a member
        for (const assignment of assignments || []) {
          const patientId = assignment.patient_id;
          
          // Call create_care_team_room which handles both creation and membership
          const { data: roomId, error: createError } = await supabase
            .rpc('create_care_team_room', {
              p_patient_id: patientId,
              p_doctor_id: userRole === 'doctor' ? user.id : null,
              p_nutritionist_id: userRole === 'nutritionist' ? user.id : null
            });
            
          if (createError) {
            console.error(`Error syncing room for patient ${patientId}:`, createError);
          } else {
            console.log(`Successfully synced room ${roomId} for patient ${patientId}`);
          }
        }
      } else {
        // For patients, call the general sync function
        const { error } = await supabase.functions.invoke("sync-care-team-rooms", {
          body: { user_id: user.id }
        });
        
        if (error) {
          throw error;
        }
      }
      
      toast({
        title: "Rooms synced",
        description: "Care team rooms have been synced. Refreshing now...",
        duration: 3000,
      });
      
      // Refresh rooms after sync
      setTimeout(() => {
        refreshRooms();
      }, 1000);
    } catch (error) {
      console.error("Error syncing care team rooms:", error);
      toast({
        title: "Error",
        description: "Could not sync care team rooms. Please try again later.",
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
              "No care team rooms found. Click 'Sync Care Team Rooms' to connect with your patients." : 
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
