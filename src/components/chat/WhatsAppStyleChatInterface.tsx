
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ChatInput } from "./ChatInput";
import { RecentCareTeamMessages } from "./RecentCareTeamMessages";
import { CareTeamRoomsSelector } from "./CareTeamRoomsSelector";
import { CareTeamRoomChat } from "./CareTeamRoomChat";
import { ResponsiveChatContainer } from "./ResponsiveChatContainer";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { TeamMember } from "@/types/chat";

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
  const [retryCount, setRetryCount] = useState(0);
  
  // Fetch room details when selected room changes
  const { data: fetchedRoomDetails, error: roomDetailsError } = useQuery({
    queryKey: ["care_team_room_details", selectedRoom, retryCount],
    queryFn: async () => {
      if (!selectedRoom) return null;
      
      try {
        console.log("Fetching room details for room:", selectedRoom);
        
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
        
        // Get team members directly from room_members to avoid RPC recursion issues
        const { data: roomMembers, error: membersError } = await supabase
          .from('room_members')
          .select('user_id, role')
          .eq('room_id', selectedRoom);
        
        let teamMembers: TeamMember[] = [];
        
        if (!membersError && roomMembers && roomMembers.length > 0) {
          console.log("Found room members:", roomMembers.length);
          
          // For each member, get their profile details
          const memberDetails = await Promise.all(
            roomMembers.map(async (member) => {
              // Special case for AI Assistant
              if (member.user_id === '00000000-0000-0000-0000-000000000000') {
                return {
                  id: member.user_id,
                  first_name: 'AI',
                  last_name: 'Assistant',
                  role: 'aibot'
                };
              }
              
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', member.user_id)
                .single();
                
              if (!profileError && profile) {
                return {
                  id: member.user_id,
                  first_name: profile.first_name || 'Unknown',
                  last_name: profile.last_name || '',
                  role: member.role || 'unknown'
                };
              } else {
                return null;
              }
            })
          );
          
          teamMembers = memberDetails.filter(Boolean) as TeamMember[];
          console.log("Team members found:", teamMembers.length);
        } else {
          console.log("No room members found or error:", membersError);
          
          // If no room members found and we have a patient ID, try fetching the patient's care team
          if (roomData.patient_id) {
            try {
              // Try direct queries instead of RPC to avoid recursion
              const doctorAssignments = await supabase
                .from('patient_assignments')
                .select('doctor_id, nutritionist_id')
                .eq('patient_id', roomData.patient_id)
                .single();
              
              if (!doctorAssignments.error && doctorAssignments.data) {
                const assignments = doctorAssignments.data;
                
                // Add doctor if assigned
                if (assignments.doctor_id) {
                  const doctorProfile = await supabase
                    .from('profiles')
                    .select('id, first_name, last_name')
                    .eq('id', assignments.doctor_id)
                    .single();
                  
                  if (!doctorProfile.error && doctorProfile.data) {
                    teamMembers.push({
                      id: doctorProfile.data.id,
                      first_name: doctorProfile.data.first_name || 'Doctor',
                      last_name: doctorProfile.data.last_name || '',
                      role: 'doctor'
                    });
                  }
                }
                
                // Add nutritionist if assigned
                if (assignments.nutritionist_id) {
                  const nutritionistProfile = await supabase
                    .from('profiles')
                    .select('id, first_name, last_name')
                    .eq('id', assignments.nutritionist_id)
                    .single();
                  
                  if (!nutritionistProfile.error && nutritionistProfile.data) {
                    teamMembers.push({
                      id: nutritionistProfile.data.id,
                      first_name: nutritionistProfile.data.first_name || 'Nutritionist',
                      last_name: nutritionistProfile.data.last_name || '',
                      role: 'nutritionist'
                    });
                  }
                }
                
                // Add patient
                const patientProfile = await supabase
                  .from('profiles')
                  .select('id, first_name, last_name')
                  .eq('id', roomData.patient_id)
                  .single();
                
                if (!patientProfile.error && patientProfile.data) {
                  teamMembers.push({
                    id: patientProfile.data.id,
                    first_name: patientProfile.data.first_name || 'Patient',
                    last_name: patientProfile.data.last_name || '',
                    role: 'patient'
                  });
                }
              }
            } catch (err) {
              console.error("Error fetching team members via assignments:", err);
            }
          }
          
          // Always add AI bot
          teamMembers.push({
            id: '00000000-0000-0000-0000-000000000000',
            first_name: 'AI',
            last_name: 'Assistant',
            role: 'aibot'
          });
        }
          
        return {
          room_id: roomData.id,
          room_name: roomData.name,
          room_description: roomData.description,
          patient_id: roomData.patient_id,
          patient_name: patientName,
          member_count: count || 0,
          last_message: '',
          last_message_time: roomData.created_at,
          team_members: teamMembers
        };
      } catch (error) {
        console.error("Error in room details query:", error);
        return null;
      }
    },
    retry: 2,
    enabled: !!selectedRoom
  });
  
  // If there's an error with room details, implement retry logic
  useEffect(() => {
    if (roomDetailsError && retryCount < 3) {
      console.log("Retrying room details query due to error:", roomDetailsError);
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [roomDetailsError, retryCount]);
  
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
