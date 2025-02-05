
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";

interface ChatMessagesListProps {
  selectedPatientId: string | null;
  doctorAssignment: any;
}

export const ChatMessagesList = ({ selectedPatientId, doctorAssignment }: ChatMessagesListProps) => {
  const { user, userRole } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { data: messages, refetch } = useQuery({
    queryKey: ["chat_messages", user?.id, selectedPatientId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const query = supabase
        .from("chat_messages")
        .select(`
          id,
          message,
          message_type,
          created_at,
          sender:profiles!chat_messages_sender_profile_fkey(id, first_name, last_name),
          receiver:profiles!chat_messages_receiver_profile_fkey(id, first_name, last_name)
        `);

      if (userRole === "doctor" && selectedPatientId) {
        query.or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedPatientId}),and(sender_id.eq.${selectedPatientId},receiver_id.eq.${user.id})`);
      } else if (userRole === "patient" && doctorAssignment?.doctor_id) {
        query.or(`and(sender_id.eq.${user.id},receiver_id.eq.${doctorAssignment.doctor_id}),and(sender_id.eq.${doctorAssignment.doctor_id},receiver_id.eq.${user.id})`);
      }

      const { data, error } = await query.order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && (
      (userRole === "doctor" && !!selectedPatientId) || 
      (userRole === "patient" && !!doctorAssignment?.doctor_id)
    ),
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [messages]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('chat_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetch]);

  if (!messages?.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        No messages yet. Start a conversation!
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
      <div className="space-y-4">
        {messages?.map((msg) => (
          <ChatMessage 
            key={msg.id}
            message={msg}
            isCurrentUser={msg.sender.id === user?.id}
          />
        ))}
      </div>
    </ScrollArea>
  );
};
