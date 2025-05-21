import { useAuth, UserRoleEnum } from "@/contexts/AuthContext";
import { WhatsAppStyleChatInterface } from "@/components/chat/WhatsAppStyleChatInterface";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MessageCircle, ArrowLeft, MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile, useIsMobileOrIPad } from "@/hooks/use-mobile";
import { MobileNavigation } from "@/components/mobile/MobileNavigation";
import { PatientPageLayout } from "@/components/layout/PatientPageLayout";
import { PatientAppLayout } from "@/layouts/PatientAppLayout";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

// Interface for WhatsAppStyleChatInterface props
interface WhatsAppStyleChatInterfaceProps {
  patientRoomId?: string | null;
  fullScreen?: boolean;
}

export const ChatPage = () => {
  const { user, userRole, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patientRoomId, setPatientRoomId] = useState<string | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(false);
  const isMobile = useIsMobile();
  const isMobileOrTablet = useIsMobileOrIPad();
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

  // Function to go back to dashboard
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const generateChatPDF = () => {
    toast({
      title: "Export Chat",
      description: "Coming soon - Export chat as PDF will be available in a future update.",
    });
  };

  if (isLoading || loadingRoom) {
    return (
      <div className="container flex items-center justify-center h-screen">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin rounded-full border-primary border-t-transparent" />
          <p className="text-muted-foreground text-sm">
            Loading chat...
          </p>
        </div>
        {isMobileOrTablet && <MobileNavigation />}
      </div>
    );
  }

  if (!user) return null;
  
  // For patient users, use the PatientAppLayout with fullScreenChat mode
  if (isPatient) {
    return (
      <PatientAppLayout fullScreenChat={isMobileOrTablet} showHeader={false}>
        {isMobileOrTablet ? (
          <div className="flex flex-col h-screen w-full">
            <div className="chat-fullscreen-header h-10 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm border-b border-neutral-100 dark:border-neutral-800/50 flex items-center justify-between px-2 fixed top-0 left-0 right-0 z-10 shadow-sm">
              <Button 
                variant="ghost" 
                size="sm" 
                className="mr-2 p-0 h-8 w-8 rounded-full" 
                onClick={handleBackToDashboard}
              >
                <ArrowLeft className="h-5 w-5 text-[#7E69AB]" />
              </Button>
              
              <div className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4 text-[#7E69AB]" />
                <span className="text-sm font-medium">Care Team</span>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-0 h-8 w-8 rounded-full">
                    <MoreHorizontal className="h-5 w-5 text-[#7E69AB]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={generateChatPDF}>
                    Export Chat
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-500">
                    <SignOutButton variant="ghost" size="sm" className="p-0 h-auto w-full flex justify-start" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="chat-fullscreen-messages mt-10 flex-grow">
              <WhatsAppStyleChatInterface patientRoomId={patientRoomId} fullScreen={true} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full w-full">
            <div className="flex items-center gap-2 mb-0.5">
              <MessageCircle className="h-5 w-5 text-[#7E69AB]" />
              <h1 className="text-lg font-bold">Care Team Chat</h1>
            </div>
            <Separator className="mb-1" />
            
            <div className="h-[calc(100vh-155px)] chat-container">
              <WhatsAppStyleChatInterface patientRoomId={patientRoomId} />
            </div>
          </div>
        )}
      </PatientAppLayout>
    );
  }

  // For non-patient users, use original layout
  return (
    <div className="flex flex-col h-screen w-full">
      <ErrorBoundary>
        <div className="flex items-center gap-2 mb-0.5 px-4 pt-4">
          <MessageCircle className="h-5 w-5 text-[#7E69AB]" />
          <h1 className="text-lg font-bold">Care Team Chat</h1>
        </div>
        <Separator className="mb-1" />
        
        <div className="h-[calc(100vh-110px)] chat-container px-4">
          <WhatsAppStyleChatInterface patientRoomId={isPatient ? patientRoomId : undefined} />
        </div>
      </ErrorBoundary>
      {isMobileOrTablet && <MobileNavigation />}
    </div>
  );
};

export default ChatPage;
