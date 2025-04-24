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

  // Redirect if not logged in or if user is a patient
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate('/');
      } else if (userRole === UserRoleEnum.PATIENT) {
        navigate('/dashboard');
      }
    }
  }, [user, isLoading, navigate, userRole]);
  
  // For patients, get their care team chat room (keeping code but will never execute due to redirect)
  useEffect(() => {
    if (user && userRole === UserRoleEnum.PATIENT) {
      const fetchPatientChatRoom = async () => {
        setLoadingRoom(true);
        setRoomError(null);
        
        try {
          console.log("Fetching care team room for patient ID:", user.id);
          
          // First try RPC call to get existing room
          const { data: roomData, error: roomError } = await supabase.rpc('get_patient_care_team_room', {
            p_patient_id: user.id
          });
          
          if (roomError && roomError.code !== 'PGRST116') {
            console.error("Error fetching patient care team room:", roomError);
            throw roomError;
          }
          
          if (roomData) {
            console.log("Found patient care team room:", roomData);
            setPatientRoomId(String(roomData));
            return;
          }
          
          // If no room exists, try to create one using patient assignments
          console.log("No existing room, checking for care team assignments");
          const { data: assignmentData, error: assignmentError } = await supabase
            .from('patient_assignments')
            .select('doctor_id, nutritionist_id')
            .eq('patient_id', user.id)
            .single();
            
          if (assignmentError && assignmentError.code !== 'PGRST116') {
            console.error("Error fetching patient assignments:", assignmentError);
            throw assignmentError;
          }
          
          if (assignmentData?.doctor_id) {
            console.log("Found doctor assignment, creating care team room");
            // Create room with doctor and nutritionist if they exist
            const { data: createdRoom, error: createError } = await supabase.rpc('create_care_team_room', {
              p_patient_id: user.id,
              p_doctor_id: assignmentData.doctor_id,
              p_nutritionist_id: assignmentData.nutritionist_id || null
            });
            
            if (createError) {
              console.error("Error creating care team room:", createError);
              throw createError;
            }
            
            if (createdRoom) {
              console.log("Created new care team room:", createdRoom);
              setPatientRoomId(String(createdRoom));
              return;
            }
          }
          
          // Fall back to checking room memberships
          console.log("Checking room memberships as fallback");
          const { data: roomMemberships, error: membershipError } = await supabase
            .from('room_members')
            .select('room_id')
            .eq('user_id', user.id)
            .order('joined_at', { ascending: false })
            .limit(1);
            
          if (membershipError) {
            console.error("Error checking room memberships:", membershipError);
            throw membershipError;
          }
          
          if (roomMemberships?.length) {
            const latestRoomId = roomMemberships[0].room_id;
            console.log("Found room membership:", latestRoomId);
            setPatientRoomId(latestRoomId);
            return;
          }
          
          // No room found or created
          console.log("No care team room found or created for patient");
          setRoomError("No care team room found or created");
          
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

  if (isLoading || (userRole === UserRoleEnum.PATIENT && loadingRoom)) {
    return (
      <div className="container pt-24 animate-fade-in">
        <div className="mx-auto flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin rounded-full border-primary border-t-transparent" />
          <p className="text-muted-foreground text-sm">
            {userRole === UserRoleEnum.PATIENT ? 'Loading your care team chat...' : 'Loading chat...'}
          </p>
        </div>
      </div>
    );
  }

  // This page should not be accessible to patients, but we'll keep the JSX just in case
  if (!user || userRole === UserRoleEnum.PATIENT) return null;

  return (
    <div className="container pt-16 md:pt-20">
      <ErrorBoundary>
        <h1 className="text-2xl font-bold mb-2">Care Team Chat</h1>
        <p className="text-muted-foreground mb-4">
          {userRole === UserRoleEnum.PATIENT 
            ? "Chat with your healthcare team and upload medical reports" 
            : "Connect with your patients and their care teams"}
        </p>
        <Separator className="my-4" />
        
        {userRole === UserRoleEnum.PATIENT && roomError && !patientRoomId && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No care team available</AlertTitle>
            <AlertDescription>
              You currently don't have a care team assigned. Please contact your healthcare provider.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="h-[calc(100vh-220px)]">
          <WhatsAppStyleChatInterface 
            patientRoomId={userRole === UserRoleEnum.PATIENT ? patientRoomId : undefined} 
          />
        </div>
      </ErrorBoundary>
    </div>
  );
};

export default ChatPage;
