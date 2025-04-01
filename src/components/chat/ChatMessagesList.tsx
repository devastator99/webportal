
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatMessagesListProps {
  selectedUserId: string | null;
}

interface ProfileInfo {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface MessageData {
  id: string;
  message: string | null;
  message_type: string | null;
  created_at: string;
  read: boolean;
  sender: ProfileInfo;
  receiver: ProfileInfo;
}

export const ChatMessagesList = ({ selectedUserId }: ChatMessagesListProps) => {
  const { user } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: messages, isLoading, error } = useQuery({
    queryKey: ["chat_messages", user?.id, selectedUserId],
    queryFn: async () => {
      if (!user?.id || !selectedUserId) return [];
      
      try {
        // Use the RPC function get_chat_messages
        const { data, error } = await (supabase.rpc as any)('get_chat_messages', {
          p_user_id: user.id,
          p_other_user_id: selectedUserId
        });

        if (error) {
          console.error("Error fetching messages:", error);
          throw error;
        }

        // Mark messages as read
        if (data && data.length > 0) {
          const unreadMessages = data.filter(
            (msg: any) => msg.sender?.id === selectedUserId && !msg.read
          );
          
          if (unreadMessages.length > 0) {
            await (supabase.rpc as any)("mark_messages_as_read", {
              p_user_id: user.id,
              p_sender_id: selectedUserId
            });
          }
        }
        
        return data as MessageData[] || [];
      } catch (error) {
        console.error("Error in chat messages query:", error);
        return [];
      }
    },
    enabled: !!user?.id && !!selectedUserId,
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current && messages?.length) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [messages]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.id || !selectedUserId) return;

    // Create a channel for new message notifications
    const channel = supabase
      .channel('chat_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `or(and(sender_id=eq.${user.id},receiver_id=eq.${selectedUserId}),and(sender_id=eq.${selectedUserId},receiver_id=eq.${user.id}))`,
        },
        () => {
          // Invalidate the query to refresh messages
          queryClient.invalidateQueries({ queryKey: ["chat_messages", user.id, selectedUserId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `or(and(sender_id=eq.${user.id},receiver_id=eq.${selectedUserId}),and(sender_id=eq.${selectedUserId},receiver_id=eq.${user.id}))`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["chat_messages", user.id, selectedUserId] });
        }
      )
      .subscribe();

    // Clean up the subscription when the component unmounts or when the selected user changes
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, selectedUserId, queryClient]);

  if (!selectedUserId) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Select a user to start a conversation
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
            <Skeleton className={`h-16 w-3/4 rounded-lg ${i % 2 === 0 ? 'bg-primary-50' : 'bg-gray-100'}`} />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-destructive">
        Error loading messages. Please try again.
      </div>
    );
  }

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
        {messages?.map((msg) => {
          if (!msg || !msg.sender) return null;
          
          return (
            <ChatMessage 
              key={msg.id}
              message={{
                id: msg.id,
                message: msg.message || '',
                created_at: msg.created_at,
                sender: {
                  id: msg.sender.id,
                  first_name: msg.sender.first_name || '',
                  last_name: msg.sender.last_name || ''
                }
              }}
              isCurrentUser={msg.sender.id === user?.id}
            />
          );
        })}
      </div>
    </ScrollArea>
  );
};
