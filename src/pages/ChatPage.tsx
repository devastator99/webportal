
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { AiChatInterface } from "@/components/chat/AiChatInterface";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, MessageSquare, Users } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role?: string;
  user_role?: { role: string } | null;
}

// Group chat object to represent a care team group
interface CareTeamGroup {
  groupName: string;
  members: UserProfile[];
}

const ChatPage = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<string>("messages");
  const { toast } = useToast();
  
  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // Get assigned users and care team group based on role
  const { data, isLoading, error } = useQuery({
    queryKey: ["assigned_users", user?.id, userRole],
    queryFn: async () => {
      if (!user?.id) return { assignedUsers: [], careTeamGroup: null };
      
      try {
        if (userRole === "patient") {
          let careTeam: UserProfile[] = [];
          let careTeamError = null;
          
          // Try to get care team using get_patient_care_team function
          try {
            const { data, error } = await supabase.rpc("get_patient_care_team", {
              p_patient_id: user.id
            });
            
            if (!error && data) {
              careTeam = data;
            } else {
              careTeamError = error;
              console.error("Error fetching care team:", error);
            }
          } catch (err) {
            careTeamError = err;
            console.error("Failed to call get_patient_care_team function:", err);
          }
          
          // If the function call fails, try to get doctor and nutritionist separately using RPC
          if (careTeamError) {
            try {
              // Get assigned doctor information
              const { data: doctorData } = await supabase.rpc("get_doctor_for_patient", { 
                p_patient_id: user.id 
              });
              
              // Get assigned nutritionist information
              const { data: nutritionistData } = await supabase.rpc("get_nutritionist_for_patient", { 
                p_patient_id: user.id 
              });
              
              if (doctorData && doctorData.length > 0) {
                const doctor = doctorData[0];
                careTeam.push({
                  id: doctor.id,
                  first_name: doctor.first_name,
                  last_name: doctor.last_name,
                  role: "doctor"
                });
              }
              
              if (nutritionistData && nutritionistData.length > 0) {
                const nutritionist = nutritionistData[0];
                careTeam.push({
                  id: nutritionist.id,
                  first_name: nutritionist.first_name,
                  last_name: nutritionist.last_name,
                  role: "nutritionist"
                });
              }
            } catch (err) {
              console.error("Error in fallback doctor/nutritionist fetch:", err);
            }
          }
          
          // Always get administrators for patients
          const { data: admins, error: adminsError } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, user_role:user_roles(role)")
            .eq("user_roles.role", "administrator");
            
          if (adminsError) {
            console.error("Error fetching admins:", adminsError);
            toast({
              title: "Error",
              description: "Could not load administrators for chat",
              variant: "destructive"
            });
          }
          
          // Format admin users
          const formattedAdmins = (admins || []).map(admin => ({
            id: admin.id,
            first_name: admin.first_name,
            last_name: admin.last_name,
            role: "administrator"
          }));
          
          // Create care team group from assigned doctor and nutritionist
          const careTeamMembers = careTeam.filter(member => 
            member.role === "doctor" || member.role === "nutritionist"
          );
          
          const careTeamGroup = careTeamMembers.length > 0 ? {
            groupName: "Care Team",
            members: [...careTeamMembers]
          } : null;
          
          // Combine providers and admins, ensuring admins are always included
          const allUsers = [...careTeam, ...formattedAdmins];
          
          return { 
            assignedUsers: allUsers,
            careTeamGroup: careTeamGroup
          };
        } else if (userRole === "doctor" || userRole === "nutritionist") {
          // Get assigned patients for this doctor/nutritionist
          const { data, error } = await supabase.rpc("get_assigned_patients", {
            p_provider_id: user.id,
            p_provider_role: userRole
          });
          
          if (error) throw error;
          return { 
            assignedUsers: (data || []) as UserProfile[],
            careTeamGroup: null
          };
        } else if (userRole === "administrator") {
          // Admin can chat with everyone
          const { data, error } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, user_role:user_roles(role)")
            .neq("id", user.id);
          
          if (error) throw error;
          return { 
            assignedUsers: data as UserProfile[],
            careTeamGroup: null
          };
        }
        return { assignedUsers: [] as UserProfile[], careTeamGroup: null };
      } catch (error) {
        console.error("Error fetching assigned users:", error);
        toast({
          title: "Error",
          description: "Could not load chat contacts. Please try again later.",
          variant: "destructive"
        });
        return { assignedUsers: [] as UserProfile[], careTeamGroup: null };
      }
    },
    enabled: !!user?.id && !!userRole
  });

  const assignedUsers = data?.assignedUsers || [];
  const careTeamGroup = data?.careTeamGroup;

  // Helper to render the appropriate content based on loading state
  const renderContent = () => {
    if (isLoading) {
      return <div className="space-y-6">
        <Skeleton className="h-[600px] w-full rounded-lg" />
      </div>;
    }

    if (error) {
      return <Alert>
        <AlertDescription>
          There was an error loading your contacts. Please refresh the page and try again.
        </AlertDescription>
      </Alert>;
    }

    return (
      <Tabs defaultValue={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="group">
            <Users className="mr-2 h-4 w-4" />
            Care Team
          </TabsTrigger>
          <TabsTrigger value="messages">
            <MessageSquare className="mr-2 h-4 w-4" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Brain className="mr-2 h-4 w-4" />
            AI Assistant
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="group" className="space-y-4">
          <ChatInterface 
            assignedUsers={assignedUsers} 
            careTeamGroup={careTeamGroup}
            showGroupChat={true}
          />
        </TabsContent>
        
        <TabsContent value="messages" className="space-y-4">
          <ChatInterface assignedUsers={assignedUsers} />
        </TabsContent>
        
        <TabsContent value="ai" className="space-y-4">
          <AiChatInterface />
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto pt-20 pb-6 px-6">
        {renderContent()}
      </div>
    </>
  );
};

export default ChatPage;
