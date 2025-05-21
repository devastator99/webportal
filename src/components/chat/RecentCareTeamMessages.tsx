
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RecentCareTeamMessagesProps {
  patientRoomId: string | null;
  messageLimit?: number;
}

export const RecentCareTeamMessages = ({ 
  patientRoomId, 
  messageLimit = 8  // Increased from 4 to 8 to see more recent messages
}: RecentCareTeamMessagesProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["recent_room_messages", patientRoomId, refreshTrigger],
    queryFn: async () => {
      if (!patientRoomId) return [];
      
      try {
        const { data: messageData, error } = await supabase
          .from('room_messages')
          .select('id, sender_id, message, is_system_message, is_ai_message, created_at, read_by')
          .eq('room_id', patientRoomId)
          .order('created_at', { ascending: false })
          .limit(messageLimit);
          
        if (error) {
          console.error("Error fetching messages:", error);
          throw error;
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
        
        // Important: No longer reversing the array since we want to preserve the newest-first order
        // that comes from the database
        return formattedMessages;
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

  if (isLoading) {
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

  return (
    <div className="flex flex-col h-full w-full">
      <ScrollArea className="w-full h-full" invisibleScrollbar={true} maxHeight="100%">
        <div className={cn(
          "bg-[#f0f2f5] dark:bg-slate-900 p-4 space-y-4",
          "rounded-md"
        )}>
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isCurrentUser={msg.sender.id === user?.id}
              showAvatar={true}
              onMessageDelete={handleMessageDelete}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
