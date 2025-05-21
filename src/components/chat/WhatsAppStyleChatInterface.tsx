import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ChatInput } from "./ChatInput";
import { RecentCareTeamMessages } from "./RecentCareTeamMessages";
import { CareTeamRoomsSelector } from "./CareTeamRoomsSelector";
import { CareTeamRoomChat } from "./CareTeamRoomChat";

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
  
  useEffect(() => {
    if (patientRoomId) {
      setSelectedRoom(patientRoomId);
      console.log("WhatsAppStyleChatInterface: Setting patient room ID:", patientRoomId);
    }
  }, [patientRoomId]);
  
  console.log("WhatsAppStyleChatInterface rendering with patientRoomId:", patientRoomId, "selectedRoom:", selectedRoom);
  
  // No message limit passed here - good!
  
  return (
    <div className="flex h-full">
      {user?.role !== 'patient' && !fullScreen ? (
        <CareTeamRoomsSelector onRoomSelect={setSelectedRoom} selectedRoomId={selectedRoom} />
      ) : null}
      
      <div className="flex flex-col flex-1 h-full">
        {selectedRoom ? (
          <CareTeamRoomChat selectedRoomId={selectedRoom} isMobileView={fullScreen} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {user?.role === 'patient' ? "Loading care team chat..." : "Select a room to start chatting"}
          </div>
        )}
      </div>
    </div>
  );
};
