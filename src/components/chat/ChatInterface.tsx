
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ChatInput } from "./ChatInput";
import { PatientSelector } from "./PatientSelector";
import { ChatMessagesList } from "./ChatMessagesList";

export const ChatInterface = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

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

  // For doctors, fetch selected patient details
  const { data: selectedPatient } = useQuery({
    queryKey: ["selected_patient", selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("id", selectedPatientId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!selectedPatientId,
  });

  const handleSendMessage = async () => {
    const receiverId = userRole === "doctor" 
      ? selectedPatientId 
      : doctorAssignment?.doctor_id;

    if (!user?.id || !receiverId) {
      toast({
        title: "Error",
        description: userRole === "doctor" 
          ? "Please select a patient first." 
          : "You don't have an assigned doctor yet.",
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
      toast({
        title: "Message sent",
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
    if (userRole === "doctor" && selectedPatient) {
      return `Chat with ${selectedPatient.first_name} ${selectedPatient.last_name}`;
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
        {userRole === "doctor" && (
          <PatientSelector
            selectedPatientId={selectedPatientId}
            onPatientSelect={setSelectedPatientId}
          />
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ChatMessagesList
          selectedPatientId={selectedPatientId}
          doctorAssignment={doctorAssignment}
        />
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
