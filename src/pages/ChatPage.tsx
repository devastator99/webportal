
import { useAuth, UserRoleEnum } from "@/contexts/AuthContext";
import { WhatsAppStyleChatInterface } from "@/components/chat/WhatsAppStyleChatInterface";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

const ChatPage = () => {
  const { user, userRole, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patientRoomId, setPatientRoomId] = useState<string | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(false);
  const isMobile = useIsMobile();
  const isPatient = userRole === UserRoleEnum.PATIENT;

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);
  
  useEffect(() => {
    if (user && isPatient) {
      // For patient users, load their care team chat room
      setLoadingRoom(true);
      
      const fetchCareTeamRoom = async () => {
        try {
          const { data, error } = await supabase.functions.invoke('get-patient-care-team-room', {
            body: { patient_id: user.id }
          });
          
          if (error) {
            console.error("Failed to get care team chat room:", error);
            toast({
              title: "Could not load care team chat",
              description: "Please try again later",
              variant: "destructive"
            });
          } else if (typeof data === "string" && data) {
            setPatientRoomId(data);
          } else if (typeof data === "object" && data !== null && data.id) {
            setPatientRoomId(data.id);
          } else if (typeof data === "object" && data !== null && "room_id" in data) {
            setPatientRoomId(data.room_id);
          } else {
            setPatientRoomId(null);
            toast({
              title: "No care team assigned",
              description: "Please contact your healthcare provider to set up a care team",
              variant: "destructive"
            });
          }
        } catch (err) {
          console.error("Error fetching care team chat room:", err);
          toast({
            title: "Error loading care team chat",
            description: "Please try again later",
            variant: "destructive"
          });
        } finally {
          setLoadingRoom(false);
        }
      };
      
      fetchCareTeamRoom();
    } else if (user) {
      // For non-patient users, no special loading needed
      setLoadingRoom(false);
    }
  }, [user, userRole, toast, isPatient]);

  if (isLoading || loadingRoom) {
    return (
      <div className="container pt-24 animate-fade-in">
        <div className="mx-auto flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin rounded-full border-primary border-t-transparent" />
          <p className="text-muted-foreground text-sm">
            Loading chat...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={`container ${isMobile ? "pt-16 pb-20" : "pt-20 pb-8"}`}>
      <ErrorBoundary>
        <div className="flex items-center gap-2 mb-2">
          <MessageCircle className="h-5 w-5 text-[#7E69AB]" />
          <h1 className="text-2xl font-bold">Care Team Chat</h1>
        </div>
        <p className="text-muted-foreground mb-4">
          {isPatient 
            ? "Connect with your healthcare team" 
            : "Connect with your patients and their care teams"}
        </p>
        <Separator className="my-4" />
        
        <div className="h-[calc(100vh-220px)]">
          <WhatsAppStyleChatInterface 
            patientRoomId={isPatient ? patientRoomId : undefined} 
          />
        </div>
      </ErrorBoundary>
    </div>
  );
};

export default ChatPage;
