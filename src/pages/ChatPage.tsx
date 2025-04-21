
import { useAuth } from "@/contexts/AuthContext";
import { ChatPageHeader } from "@/components/chat/ChatPageHeader";
import { WhatsAppStyleChatInterface } from "@/components/chat/WhatsAppStyleChatInterface";
import { DoctorWhatsAppChat } from "@/components/chat/DoctorWhatsAppChat";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ChatPage = () => {
  const { user, userRole, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);
  const [patientRoomId, setPatientRoomId] = useState<string | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);

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
        setRoomError(null);
        
        try {
          console.log("Fetching care team room for patient ID:", user.id);
          
          // Use the edge function instead of direct RPC
          const { data, error } = await supabase.functions.invoke('get-patient-care-team-room', {
            body: { patient_id: user.id }
          });
          
          if (error) {
            console.error("Error fetching patient care team room:", error);
            setRoomError(`Error fetching room: ${error.message}`);
            
            toast({
              title: "Error loading chat room",
              description: "Could not load your care team chat room",
              variant: "destructive"
            });
          } else if (data) {
            console.log("Found patient care team room:", data);
            setPatientRoomId(String(data));
          } else {
            console.log("No care team room found for patient:", user.id);
            setRoomError("No care team room found");
          }
          
          // Check if there are ANY rooms for this patient
          const { data: roomMemberships, error: membershipError } = await supabase
            .from('room_members')
            .select('room_id')
            .eq('user_id', user.id);
            
          if (membershipError) {
            console.error("Error checking room memberships:", membershipError);
          } else {
            console.log(`Patient is a member of ${roomMemberships?.length || 0} rooms:`, roomMemberships);
          }
        } catch (error) {
          console.error("Exception in patient room fetch:", error);
          setRoomError(`Exception: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
          setLoadingRoom(false);
        }
      };
      
      fetchPatientChatRoom();
    }
  }, [user, userRole, toast]);
  
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
        <div className="mx-auto flex flex-col items-center justify-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-muted-foreground text-sm">
            {userRole === 'patient' ? 'Loading your care team chat...' : 'Loading chat...'}
          </p>
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
            ? "Chat with your healthcare team and upload medical reports" 
            : "Connect with your patients and their care teams"}
        </p>
        <Separator className="my-4" />
        
        {/* Welcome tooltip */}
        {showWelcomeMessage && (
          <div className="bg-primary/10 p-3 rounded-md mb-4 animate-fade-in text-center">
            <p className="text-primary font-medium">
              {userRole === 'patient' 
                ? "Chat with your healthcare team and upload medical reports using the paperclip icon" 
                : "Care Team Chats - Connect with your patients and their care teams"}
            </p>
          </div>
        )}
        
        {userRole === 'patient' && roomError && !patientRoomId && (
          <div className="bg-destructive/10 p-4 rounded-md mb-4">
            <h3 className="font-medium">No care team chat available</h3>
            <p className="text-sm text-muted-foreground mt-1">
              You currently don't have a care team assigned. Please contact your healthcare provider.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Debug info: {roomError}
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
