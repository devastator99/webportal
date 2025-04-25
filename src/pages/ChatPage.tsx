import { useAuth, UserRoleEnum } from "@/contexts/AuthContext";
import { WhatsAppStyleChatInterface } from "@/components/chat/WhatsAppStyleChatInterface";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MessageCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ChatPage = () => {
  const { user, userRole, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patientRoomId, setPatientRoomId] = useState<string | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);

  const isPatient = userRole === UserRoleEnum.PATIENT;

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate('/');
      } else if (isPatient) {
        // Redirect patients to dashboard where the care team chat exists
        navigate('/dashboard');
      }
    }
  }, [user, isLoading, navigate, userRole, isPatient]);
  
  useEffect(() => {
    if (user && !isPatient) {
      // For non-patient users, the chat page functionality remains the same
      setLoadingRoom(true);
      setRoomError(null);
      
      // We could add room loading logic here for non-patient users if needed
      setLoadingRoom(false);
    }
  }, [user, userRole, isPatient]);

  if (isLoading || loadingRoom) {
    return (
      <div className="container pt-24 animate-fade-in">
        <div className="mx-auto flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin rounded-full border-primary border-t-transparent" />
          <p className="text-muted-foreground text-sm">
            {isPatient ? 'Loading your care team chat...' : 'Loading chat...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user || isPatient) return null;

  return (
    <div className="container pt-16 md:pt-20">
      <ErrorBoundary>
        <h1 className="text-2xl font-bold mb-2">Care Team Chat</h1>
        <p className="text-muted-foreground mb-4">
          Connect with your patients and their care teams
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
