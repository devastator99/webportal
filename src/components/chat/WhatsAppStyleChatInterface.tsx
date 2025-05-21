
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ChatInput } from "./ChatInput";
import { RecentCareTeamMessages } from "./RecentCareTeamMessages";
import { CareTeamRoomsSelector } from "./CareTeamRoomsSelector";
import { CareTeamRoomChat } from "./CareTeamRoomChat";
import { ResponsiveChatContainer } from "./ResponsiveChatContainer";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface WhatsAppStyleChatInterfaceProps {
  patientRoomId?: string | null;
  fullScreen?: boolean;
}

export const WhatsAppStyleChatInterface = ({ 
  patientRoomId, 
  fullScreen = false 
}: WhatsAppStyleChatInterfaceProps) => {
  const { user } = useAuth();
  const [selectedRoom, setSelectedRoom] = useState<string | null>(patientRoomId || null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sentMessages, setSentMessages] = useState<any[]>([]);
  const [roomDetails, setRoomDetails] = useState<any>(null);
  
  // Fetch room details when selected room changes
  const { data: fetchedRoomDetails } = useQuery({
    queryKey: ["care_team_room_details", selectedRoom],
    queryFn: async () => {
      if (!selectedRoom) return null;
      
      try {
        const { data: roomData, error: roomError } = await supabase
          .from('chat_rooms')
          .select('id, name, description, room_type, patient_id, created_at')
          .eq('id', selectedRoom)
          .single();
          
        if (roomError) {
          console.error("Error fetching room details:", roomError);
          return null;
        }
        
        let patientName = 'Patient';
        if (roomData.patient_id) {
          const { data: patientData, error: patientError } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', roomData.patient_id)
            .single();
            
          if (!patientError && patientData) {
            patientName = `${patientData.first_name || ''} ${patientData.last_name || ''}`.trim();
          }
        }
        
        const { count, error: countError } = await supabase
          .from('room_members')
          .select('*', { count: 'exact', head: true })
          .eq('room_id', selectedRoom);
          
        return {
          room_id: roomData.id,
          room_name: roomData.name,
          room_description: roomData.description,
          patient_id: roomData.patient_id,
          patient_name: patientName,
          member_count: count || 0,
          last_message: '',
          last_message_time: roomData.created_at
        };
      } catch (error) {
        console.error("Error in room details query:", error);
        return null;
      }
    },
    enabled: !!selectedRoom
  });
  
  useEffect(() => {
    if (fetchedRoomDetails) {
      setRoomDetails(fetchedRoomDetails);
    }
  }, [fetchedRoomDetails]);
  
  useEffect(() => {
    if (patientRoomId) {
      setSelectedRoom(patientRoomId);
      console.log("WhatsAppStyleChatInterface: Setting patient room ID:", patientRoomId);
    }
  }, [patientRoomId]);
  
  console.log("WhatsAppStyleChatInterface rendering with patientRoomId:", patientRoomId, "selectedRoom:", selectedRoom);
  
  return (
    <div className="flex h-full">
      {user?.role !== 'patient' && !fullScreen ? (
        <CareTeamRoomsSelector onRoomSelect={setSelectedRoom} selectedRoomId={selectedRoom} />
      ) : null}
      
      <div className="flex flex-col flex-1 h-full">
        {selectedRoom ? (
          <CareTeamRoomChat 
            selectedRoomId={selectedRoom} 
            isMobileView={fullScreen}
            roomDetails={roomDetails} 
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {user?.role === 'patient' ? "Loading care team chat..." : "Select a room to start chatting"}
          </div>
        )}
      </div>
    </div>
  );
};
