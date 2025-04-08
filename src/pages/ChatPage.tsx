
import { useAuth } from "@/contexts/AuthContext";
import { ChatPageHeader } from "@/components/chat/ChatPageHeader";
import { WhatsAppStyleChatInterface } from "@/components/chat/WhatsAppStyleChatInterface";
import { DoctorWhatsAppChat } from "@/components/chat/DoctorWhatsAppChat";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const ChatPage = () => {
  const { user, userRole, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);
  const [patientRoomId, setPatientRoomId] = useState<string | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);
  
  // For patients, get their care team chat room
  useEffect(() => {
    if (user && userRole === 'patient') {
      const fetchPatientChatRoom = async () => {
        setLoadingRoom(true);
        try {
          // Look for a care team room where the patient is a member
          const { data, error } = await supabase
            .from('chat_rooms')
            .select('id')
            .eq('patient_id', user.id)
            .eq('room_type', 'care_team')
            .eq('is_active', true)
            .limit(1)
            .single();
          
          if (error) {
            console.error("Error fetching patient care team room:", error);
            
            // If no room exists, create a new one by calling the create_care_team_room function
            // This will ensure both doctor and nutritionist are added
            if (error.code === 'PGRST116') { // No rows returned
              try {
                const { data: assignmentData, error: assignmentError } = await supabase
                  .from('patient_assignments')
                  .select('doctor_id, nutritionist_id')
                  .eq('patient_id', user.id)
                  .single();
                
                if (!assignmentError && assignmentData) {
                  // Create a care team room with the patient's assigned doctor and nutritionist
                  const { data: roomData, error: roomError } = await supabase.rpc(
                    'create_care_team_room',
                    {
                      p_patient_id: user.id,
                      p_doctor_id: assignmentData.doctor_id,
                      p_nutritionist_id: assignmentData.nutritionist_id
                    }
                  );
                  
                  if (!roomError && roomData) {
                    setPatientRoomId(roomData);
                  } else {
                    console.error("Error creating care team room:", roomError);
                  }
                }
              } catch (err) {
                console.error("Error handling room creation:", err);
              }
            }
          } else if (data) {
            setPatientRoomId(data.id);
          }
        } catch (error) {
          console.error("Error in patient room fetch:", error);
        } finally {
          setLoadingRoom(false);
        }
      };
      
      fetchPatientChatRoom();
    }
  }, [user, userRole]);
  
  useEffect(() => {
    // Hide welcome message after 3 seconds
    const timer = setTimeout(() => {
      setShowWelcomeMessage(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading || (userRole === 'patient' && loadingRoom)) {
    return (
      <div className="container pt-24 animate-fade-in">
        <div className="mx-auto flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container pt-16 md:pt-20">
      <ErrorBoundary>
        <h1 className="text-2xl font-bold mb-2">Care Team Chat</h1>
        <p className="text-muted-foreground mb-4">
          {userRole === 'patient' 
            ? "Chat with your healthcare team" 
            : "Connect with your patients and their care teams"}
        </p>
        <Separator className="my-4" />
        
        {/* Welcome tooltip */}
        {showWelcomeMessage && (
          <div className="bg-primary/10 p-3 rounded-md mb-4 animate-fade-in text-center">
            <p className="text-primary font-medium">
              {userRole === 'patient' 
                ? "Chat with your healthcare team" 
                : "Care Team Chats - Connect with your patients and their care teams"}
            </p>
          </div>
        )}
        
        <div className="h-[calc(100vh-220px)]">
          <WhatsAppStyleChatInterface 
            patientRoomId={userRole === 'patient' ? patientRoomId : undefined} 
          />
        </div>
      </ErrorBoundary>
    </div>
  );
};

export default ChatPage;
