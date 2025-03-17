
import { useAuth } from "@/contexts/AuthContext";
import { supabase, safelyUnwrapValue, asArray } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ChatInput } from "./ChatInput";
import { PatientSelector } from "./PatientSelector";
import { ChatMessagesList } from "./ChatMessagesList";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Doctor = {
  id: string;
  first_name: string | null;
  last_name: string | null;
};

type DoctorAssignment = {
  doctor_id: string;
  doctor: Doctor;
};

export const ChatInterface = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // For patients, fetch their assigned doctor
  const { data: doctorAssignment, error: doctorError } = useQuery({
    queryKey: ["doctor_assignment", user?.id],
    queryFn: async () => {
      if (!user?.id || userRole !== "patient") return null;
      
      // First query to get the doctor_id
      const { data: assignmentData, error: assignmentError } = await supabase
        .from("patient_assignments")
        .select("doctor_id")
        .eq("patient_id", user.id)
        .maybeSingle();

      if (assignmentError) {
        console.error("Error fetching doctor assignment:", assignmentError);
        throw assignmentError;
      }

      if (!assignmentData) {
        return null;
      }

      // Second query to get the doctor details
      const { data: doctorData, error: doctorError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("id", assignmentData.doctor_id)
        .maybeSingle();

      if (doctorError) {
        console.error("Error fetching doctor profile:", doctorError);
        throw doctorError;
      }

      return {
        doctor_id: assignmentData.doctor_id,
        doctor: doctorData as Doctor
      } as DoctorAssignment;
    },
    enabled: !!user?.id && userRole === "patient",
  });

  // For doctors, fetch selected patient details
  const { data: selectedPatient, error: patientError } = useQuery({
    queryKey: ["selected_patient", selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("id", selectedPatientId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!selectedPatientId,
  });

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const receiverId = userRole === "doctor" 
      ? selectedPatientId 
      : doctorAssignment?.doctor_id;

    if (!user?.id) {
      toast({
        title: "Cannot send message",
        description: "You must be logged in to send messages.",
        variant: "destructive",
      });
      return;
    }

    // For patients, allow sending messages even without an assigned doctor
    if (userRole === "doctor" && !selectedPatientId) {
      toast({
        title: "Cannot send message",
        description: "Please select a patient first.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use the new RPC function to send messages instead of direct insert
      const { data, error } = await supabase.rpc("send_chat_message", {
        p_sender_id: user.id,
        p_receiver_id: receiverId,
        p_message: newMessage,
        p_message_type: "text"
      });

      if (error) {
        console.error("Error sending message:", error);
        toast({
          title: "Error sending message",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setNewMessage("");
      toast({
        title: "Message sent successfully",
      });
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const getHeaderTitle = () => {
    const patientName = selectedPatient 
      ? `${safelyUnwrapValue(selectedPatient.first_name, "")} ${safelyUnwrapValue(selectedPatient.last_name, "")}`
      : "";
      
    const doctorName = doctorAssignment && doctorAssignment.doctor 
      ? `Dr. ${safelyUnwrapValue(doctorAssignment.doctor.first_name, "")} ${safelyUnwrapValue(doctorAssignment.doctor.last_name, "")}`
      : "";

    if (userRole === "doctor" && patientName) {
      return `Chat with ${patientName}`;
    } else if (userRole === "patient" && doctorName) {
      return `Chat with ${doctorName}`;
    }
    return "Messages";
  };

  const renderError = () => {
    if (doctorError) {
      return (
        <Alert>
          <AlertDescription>
            Unable to find your assigned doctor. You can still send messages that will be received by our medical team.
          </AlertDescription>
        </Alert>
      );
    }
    if (patientError) {
      return (
        <Alert variant="destructive">
          <AlertDescription>
            Unable to load patient information. Please try again later.
          </AlertDescription>
        </Alert>
      );
    }
    return null;
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
        {renderError()}
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
          disabled={userRole === "doctor" ? !selectedPatientId : false}
        />
      </CardContent>
    </Card>
  );
};
