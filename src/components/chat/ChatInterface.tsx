import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

export const ChatInterface = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // For doctors, fetch their assigned patients
  const { data: assignedPatients } = useQuery({
    queryKey: ["assigned_patients", user?.id],
    queryFn: async () => {
      if (!user?.id || userRole !== "doctor") return null;
      
      const { data, error } = await supabase
        .from("patient_assignments")
        .select(`
          patient_id,
          patient:profiles!patient_assignments_patient_profile_fkey(
            id,
            first_name,
            last_name
          )
        `)
        .eq("doctor_id", user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && userRole === "doctor",
  });

  // For patients, fetch their assigned doctor
  const { data: doctorAssignment } = useQuery({
    queryKey: ["doctor_assignment", user?.id],
    queryFn: async () => {
      if (!user?.id || userRole !== "patient") return null;
      
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
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && userRole === "patient",
  });

  // Set first patient as selected by default
  useEffect(() => {
    if (userRole === "doctor" && assignedPatients?.length && !selectedPatientId) {
      setSelectedPatientId(assignedPatients[0].patient_id);
    }
  }, [assignedPatients, userRole, selectedPatientId]);

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

  const handleSendMessage = async () => {
    const receiverId = userRole === "doctor" 
      ? selectedPatientId 
      : doctorAssignment?.doctor_id;

    if (!user?.id || !receiverId) {
      toast({
        title: "Error",
        description: "Unable to send message. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (!newMessage.trim()) return;

    try {
      const { error } = await supabase.from("chat_messages").insert({
        sender_id: user.id,
        receiver_id: receiverId,
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

  const getHeaderTitle = () => {
    if (userRole === "doctor" && selectedPatientId) {
      const patient = assignedPatients?.find(p => p.patient_id === selectedPatientId)?.patient;
      return patient ? `Chat with ${patient.first_name} ${patient.last_name}` : "Select a patient";
    } else if (userRole === "patient" && doctorAssignment?.doctor) {
      return `Chat with Dr. ${doctorAssignment.doctor.first_name} ${doctorAssignment.doctor.last_name}`;
    }
    return "Messages";
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {getHeaderTitle()}
        </CardTitle>
        {userRole === "doctor" && assignedPatients && assignedPatients.length > 0 && (
          <select
            className="mt-2 w-full p-2 rounded-md border"
            value={selectedPatientId || ""}
            onChange={(e) => setSelectedPatientId(e.target.value)}
          >
            {assignedPatients.map((assignment) => (
              <option key={assignment.patient_id} value={assignment.patient_id}>
                {assignment.patient.first_name} {assignment.patient.last_name}
              </option>
            ))}
          </select>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages?.map((msg) => (
              <ChatMessage 
                key={msg.id}
                message={msg}
                isCurrentUser={msg.sender.id === user.id}
              />
            ))}
          </div>
        </ScrollArea>
        <ChatInput
          value={newMessage}
          onChange={setNewMessage}
          onSend={handleSendMessage}
          disabled={userRole === "doctor" ? !selectedPatientId : !doctorAssignment?.doctor_id}
        />
      </CardContent>
    </Card>
  );
};