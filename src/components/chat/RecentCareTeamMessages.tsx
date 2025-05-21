
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Loader2, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CollapsibleMessageGroup } from "./CollapsibleMessageGroup";
import { groupMessagesByDate, normalizeDateString } from "@/utils/dateUtils";

interface RecentCareTeamMessagesProps {
  patientRoomId: string | null;
  messageLimit?: number;
}

export const RecentCareTeamMessages = ({ 
  patientRoomId,
  // Increase the default message limit significantly to effectively show all messages
  messageLimit = 500  // Increased from 100 to 500 to match other components
}: RecentCareTeamMessagesProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [roomDetails, setRoomDetails] = useState<any>(null);

  // First, fetch the room details to display information about the care team
  const { data: roomData, isLoading: loadingRoomDetails } = useQuery({
    queryKey: ["room_details", patientRoomId],
    queryFn: async () => {
      if (!patientRoomId) return null;
      
      try {
        // Get room details
        const { data: room, error: roomError } = await supabase
          .from('chat_rooms')
          .select('id, name, description, room_type, patient_id')
          .eq('id', patientRoomId)
          .single();
          
        if (roomError) {
          console.error("Error fetching room details:", roomError);
          return null;
        }
        
        // Get room members
        const { data: members, error: membersError } = await supabase
          .from('room_members')
          .select('user_id, role')
          .eq('room_id', patientRoomId);
          
        if (membersError) {
          console.error("Error fetching room members:", membersError);
          return { ...room, members: [] };
        }
        
        // Get member profiles
        const memberDetails = await Promise.all(
          members.map(async (member) => {
            if (member.user_id === '00000000-0000-0000-0000-000000000000') {
              return {
                id: member.user_id,
                first_name: 'AI',
                last_name: 'Assistant',
                role: 'aibot'
              };
            }
            
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', member.user_id)
              .single();
              
            return {
              id: member.user_id,
              first_name: profile?.first_name || 'Unknown',
              last_name: profile?.last_name || '',
              role: member.role || 'unknown'
            };
          })
        );
        
        return {
          ...room,
          members: memberDetails.filter(Boolean)
        };
      } catch (error) {
        console.error("Error fetching room details:", error);
        return null;
      }
    },
    enabled: !!patientRoomId
  });

  // Then fetch the messages for this room
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["recent_room_messages", patientRoomId, refreshTrigger],
    queryFn: async () => {
      if (!patientRoomId) return [];
      
      try {
        console.log(`Fetching room messages for room: ${patientRoomId}, limit: ${messageLimit}`);
        
        const { data: messageData, error } = await supabase
          .from('room_messages')
          .select('id, sender_id, message, is_system_message, is_ai_message, created_at, read_by')
          .eq('room_id', patientRoomId)
          .order('created_at', { ascending: false })  // Get newest first from database
          .limit(messageLimit);
          
        if (error) {
          console.error("Error fetching messages:", error);
          throw error;
        }
        
        console.log(`Retrieved ${messageData?.length || 0} room messages, newest first`);
        if (messageData && messageData.length > 0) {
          console.log(`First message date: ${new Date(messageData[0]?.created_at).toISOString()}`);
          console.log(`Last message date: ${new Date(messageData[messageData.length - 1]?.created_at).toISOString()}`);
        }
        
        const formattedMessages = [];
        
        for (const msg of messageData) {
          let senderName = 'Unknown';
          let senderRole = 'unknown';
          
          if (msg.sender_id === '00000000-0000-0000-0000-000000000000') {
            senderName = 'AI Assistant';
            senderRole = 'aibot';
          } else {
            const { data: senderData, error: senderError } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', msg.sender_id)
              .single();
              
            if (!senderError && senderData) {
              senderName = `${senderData.first_name || ''} ${senderData.last_name || ''}`.trim();
            }
            
            const { data: roleData, error: roleError } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', msg.sender_id)
              .single();
              
            if (!roleError && roleData) {
              senderRole = roleData.role;
            }
          }
          
          formattedMessages.push({
            id: msg.id,
            message: msg.message,
            created_at: msg.created_at,
            is_system_message: msg.is_system_message,
            is_ai_message: msg.is_ai_message,
            sender: {
              id: msg.sender_id,
              first_name: senderName.split(' ')[0] || '',
              last_name: senderName.split(' ').slice(1).join(' ') || '',
              role: senderRole
            },
            read: (msg.read_by && Array.isArray(msg.read_by) && msg.read_by.includes(user?.id))
          });
        }
        
        console.log(`Formatted ${formattedMessages.length} messages, reversing to show oldest first`);
        
        // IMPORTANT: Reverse the array to display oldest messages first (top to bottom)
        return formattedMessages.reverse();
      } catch (error) {
        console.error("Error in messages query:", error);
        return [];
      }
    },
    enabled: !!patientRoomId,
    refetchInterval: 10000 // Refetch every 10 seconds to show new messages
  });

  useEffect(() => {
    if (data) {
      setMessages(data);
    }
  }, [data]);

  useEffect(() => {
    if (roomData) {
      setRoomDetails(roomData);
    }
  }, [roomData]);

  const handleMessageDelete = () => {
    // Trigger a refetch after message deletion
    refetch();
  };

  if (!patientRoomId) {
    return (
      <div className="flex justify-center items-center h-full text-muted-foreground">
        No care team chat found
      </div>
    );
  }

  if (isLoading || loadingRoomDetails) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full text-muted-foreground">
        Error loading messages
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-full text-muted-foreground">
        <p>No recent messages</p>
        <p className="text-sm">Your care team hasn't sent any messages yet</p>
      </div>
    );
  }

  // Group messages by date
  const messageGroups = groupMessagesByDate(messages);
  const sortedDateKeys = Object.keys(messageGroups).sort();
  
  // Display room details and members below the heading
  return (
    <div className="flex flex-col h-full w-full">
      {roomDetails && (
        <div className="bg-muted/50 p-3 mb-2 rounded-md">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Care Team</h3>
            <span className="text-xs text-muted-foreground ml-auto">
              {roomDetails.members?.length || 0} members
            </span>
          </div>
          
          {roomDetails.members && roomDetails.members.length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-1">
              {roomDetails.members.map((member: any) => (
                <div key={member.id} className="flex items-center gap-1 bg-background rounded-full px-2 py-0.5 text-xs">
                  <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                    {member.first_name.charAt(0)}
                  </div>
                  <span>
                    {member.first_name} {member.last_name}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">
                    • {member.role}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No team members found</p>
          )}
        </div>
      )}
      
      <ScrollArea className="w-full h-full" invisibleScrollbar={true} maxHeight="100%">
        <div className={cn(
          "bg-[#f0f2f5] dark:bg-slate-900 p-4 space-y-4",
          "rounded-md"
        )}>
          {sortedDateKeys.map((dateString, index) => {
            const isLatestGroup = index === sortedDateKeys.length - 1;
            return (
              <CollapsibleMessageGroup 
                key={dateString} 
                date={dateString}
                messages={messageGroups[dateString]}
                isLatestGroup={isLatestGroup}
              >
                <div className="space-y-4">
                  {messageGroups[dateString].map((msg) => (
                    <ChatMessage
                      key={msg.id}
                      message={msg}
                      isCurrentUser={msg.sender.id === user?.id}
                      showAvatar={true}
                      onMessageDelete={handleMessageDelete}
                    />
                  ))}
                </div>
              </CollapsibleMessageGroup>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
