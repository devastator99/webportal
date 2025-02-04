import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  message: string;
  message_type: "text" | "file" | "video";
  created_at: string;
  sender: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  };
  receiver: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  };
}

export const ChatInterface = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Fetch doctor's ID for the current patient
  const { data: doctorAssignment } = useQuery({
    queryKey: ["doctor_assignment", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("patient_assignments")
        .select(`
          doctor_id,
          doctor:profiles!patient_assignments_doctor_profile_fkey(
            id,
            first_name,
            last_name
          )
        `)
        .eq("patient_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching doctor assignment:", error);
        return null;
      }
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: messages, refetch } = useQuery({
    queryKey: ["chat_messages", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("chat_messages")
        .select(`
          id,
          message,
          message_type,
          created_at,
          sender:profiles!chat_messages_sender_profile_fkey(id, first_name, last_name),
          receiver:profiles!chat_messages_receiver_profile_fkey(id, first_name, last_name)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as ChatMessage[];
    },
    enabled: !!user?.id,
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
          filter: `sender_id=eq.${user.id},receiver_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('New message received:', payload);
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetch]);

  const handleSendMessage = async () => {
    if (!user?.id || !doctorAssignment?.doctor_id) {
      toast({
        title: "Error",
        description: doctorAssignment?.doctor_id 
          ? "You must be logged in to send messages."
          : "No doctor assigned. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    if (!newMessage.trim()) return;

    try {
      const { error } = await supabase.from("chat_messages").insert({
        sender_id: user.id,
        receiver_id: doctorAssignment.doctor_id,
        message: newMessage,
        message_type: "text",
      });

      if (error) throw error;

      setNewMessage("");
      refetch();
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <Card className="h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Please log in to use the chat.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Messages {doctorAssignment?.doctor?.first_name && `with Dr. ${doctorAssignment.doctor.first_name} ${doctorAssignment.doctor.last_name}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages?.map((msg) => {
              if (!msg?.sender) return null;
              
              const senderName = msg.sender.first_name || msg.sender.last_name 
                ? `${msg.sender.first_name || ''} ${msg.sender.last_name || ''}`.trim()
                : 'Unknown User';

              return (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender.id === user.id ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.sender.id === user.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm font-medium">{senderName}</p>
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs opacity-70">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        <div className="flex gap-2 mt-4">
          <Textarea
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button onClick={handleSendMessage}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};