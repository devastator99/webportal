
import { useState, useEffect } from "react";
import { CareTeamRoomsSelector } from "./CareTeamRoomsSelector";
import { CareTeamRoomChat } from "./CareTeamRoomChat";
import { useMediaQuery } from "@/hooks/use-media-query";

export const ChatRoomInterface = () => {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Update UI when screen size changes
  useEffect(() => {
    if (!isMobile) {
      setShowMobileChat(false);
    }
  }, [isMobile]);

  // Handle room selection
  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    if (isMobile) {
      setShowMobileChat(true);
    }
  };

  // Handle back navigation on mobile
  const handleBackToRooms = () => {
    setShowMobileChat(false);
  };

  // If mobile and showing chat, only display chat
  if (isMobile && showMobileChat) {
    return (
      <div className="h-full">
        <CareTeamRoomChat 
          selectedRoomId={selectedRoomId} 
          onBack={handleBackToRooms}
          isMobileView={true} 
        />
      </div>
    );
  }

  // If mobile and not showing chat, only display room selector
  if (isMobile) {
    return (
      <div className="h-full">
        <CareTeamRoomsSelector
          selectedRoomId={selectedRoomId}
          onSelectRoom={handleSelectRoom}
        />
      </div>
    );
  }

  // Desktop layout with both panels
  return (
    <div className="flex h-full">
      <div className="w-1/3 border-r h-full">
        <CareTeamRoomsSelector
          selectedRoomId={selectedRoomId}
          onSelectRoom={handleSelectRoom}
        />
      </div>
      <div className="flex-1 h-full">
        <CareTeamRoomChat selectedRoomId={selectedRoomId} />
      </div>
    </div>
  );
};
