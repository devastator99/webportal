import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ChatInput } from "./ChatInput";
import { ChatMessagesList } from "./ChatMessagesList";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

type UserProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role?: string;
  user_role?: { role: string } | null;
};

interface CareTeamGroup {
  groupName: string;
  members: UserProfile[];
}

interface ChatInterfaceProps {
  assignedUsers?: UserProfile[];
  careTeamGroup?: CareTeamGroup | null;
  showGroupChat?: boolean;
}

export const ChatInterface = ({ assignedUsers = [], careTeamGroup = null, showGroupChat = true }: ChatInterfaceProps) => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isGroupChat, setIsGroupChat] = useState<boolean>(true);

  const { data: allUsers, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ["available_chat_users", user?.id, userRole],
    queryFn: async () => {
      if (!user?.id) return [];
      
      if (assignedUsers?.length > 0) {
        return assignedUsers;
      }
      
      try {
        if (userRole === "patient") {
          let careTeam: UserProfile[] = [];
          let careTeamError = null;
          
          try {
            const { data, error } = await supabase.functions.invoke('get-patient-care-team', {
              body: { patient_id: user.id }
            });
            
            if (!error && data) {
              careTeam = data as UserProfile[];
            } else {
              careTeamError = error;
              console.error("Error fetching care team:", error);
            }
          } catch (err) {
            careTeamError = err;
            console.error("Failed to call get_patient_care_team function:", err);
          }
          
          if (careTeamError || (Array.isArray(careTeam) && careTeam.length === 0)) {
            try {
              const { data: doctorData } = await supabase.functions.invoke('get-doctor-for-patient', { 
                body: { patient_id: user.id }
              });
              
              const { data: nutritionistData } = await supabase.functions.invoke('get-nutritionist-for-patient', { 
                body: { patient_id: user.id }
              });
              
              if (doctorData && Array.isArray(doctorData) && doctorData.length > 0) {
                const doctor = doctorData[0] as UserProfile;
                careTeam.push({
                  id: doctor.id,
                  first_name: doctor.first_name,
                  last_name: doctor.last_name,
                  role: "doctor"
                });
              }
              
              if (nutritionistData && Array.isArray(nutritionistData) && nutritionistData.length > 0) {
                const nutritionist = nutritionistData[0] as UserProfile;
                careTeam.push({
                  id: nutritionist.id,
                  first_name: nutritionist.first_name,
                  last_name: nutritionist.last_name,
                  role: "nutritionist"
                });
              }
              
              careTeam.push({
                id: '00000000-0000-0000-0000-000000000000',
                first_name: 'AI',
                last_name: 'Assistant',
                role: 'aibot'
              });
            } catch (err) {
              console.error("Error in fallback doctor/nutritionist fetch:", err);
            }
          }
          
          const { data: admins, error: adminsError } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, user_role:user_roles(role)")
            .eq("user_roles.role", "administrator");
            
          if (adminsError) throw adminsError;
          
          const formattedAdmins = (admins || []).map(admin => ({
            id: admin.id,
            first_name: admin.first_name,
            last_name: admin.last_name,
            role: "administrator"
          }));
          
          return [...careTeam, ...formattedAdmins];
        } 
        else if (userRole === "doctor" || userRole === "nutritionist") {
          const { data: patients } = await supabase.functions.invoke('get-assigned-patients', {
            body: {
              provider_id: user.id,
              provider_role: userRole
            }
          });
          
          const { data: admins, error: adminsError } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, user_role:user_roles(role)")
            .eq("user_roles.role", "administrator");
            
          if (adminsError) throw adminsError;
          
          const formattedAdmins = (admins || []).map(admin => ({
            id: admin.id,
            first_name: admin.first_name,
            last_name: admin.last_name,
            role: "administrator"
          }));
          
          return [...(patients as UserProfile[] || []), ...formattedAdmins];
        } 
        else if (userRole === "administrator") {
          const { data, error } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, user_role:user_roles(role)")
            .neq("id", user.id);
          
          if (error) throw error;
          
          return (data || []).map(profile => ({
            id: profile.id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            role: profile.user_role?.role || ""
          }));
        }
        
        return [];
      } catch (error) {
        console.error("Error fetching available users for chat:", error);
        toast({
          title: "Error loading contacts",
          description: "Unable to load your chat contacts. Please try again later.",
          variant: "destructive"
        });
        throw error;
      }
    },
    enabled: !!user?.id && !!userRole,
    retry: 2
  });

  useEffect(() => {
    if (careTeamGroup) {
      setIsGroupChat(true);
    }
  }, [careTeamGroup]);

  const getHeaderTitle = () => {
    if (isGroupChat && careTeamGroup) {
      return careTeamGroup.groupName;
    }
    if (usersLoading) return "Loading contacts...";
    if (usersError) return "Error loading contacts";
    return "Care Team";
  };

  const getUserRole = (user: UserProfile) => {
    if (user.role) return user.role;
    if (user.user_role?.role) return user.user_role.role;
    return "";
  };

  const getUserDisplayName = (user: UserProfile) => {
    const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    const role = getUserRole(user);
    return role ? `${name} (${role})` : name;
  };

  const renderError = () => {
    if (usersError) {
      return (
        <Alert>
          <AlertDescription>
            Unable to load contacts. Please refresh the page.
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    if (!user?.id) {
      toast({
        title: "Cannot send message",
        description: "You must be logged in to send messages.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (careTeamGroup) {
        const sendPromises = careTeamGroup.members.map(member => {
          if (member.role === 'aibot') return Promise.resolve();
          
          return supabase.functions.invoke("send-chat-message", {
            body: {
              sender_id: user.id,
              receiver_id: member.id,
              message: newMessage,
              message_type: "text"
            }
          });
        }).filter(Boolean);

        await Promise.all(sendPromises);
        
        if (careTeamGroup.members.some(member => member.role === 'aibot')) {
          try {
            const { data: aiResponse } = await supabase.functions.invoke('doctor-ai-assistant', {
              body: { 
                messages: [{ role: "user", content: newMessage }],
                preferredLanguage: 'en'
              },
            });
            
            if (aiResponse && aiResponse.response) {
              setTimeout(async () => {
                const aiSendPromises = careTeamGroup.members
                  .filter(member => member.role !== 'aibot')
                  .map(member => {
                    return supabase.functions.invoke("send-chat-message", {
                      body: {
                        sender_id: '00000000-0000-0000-0000-000000000000',
                        receiver_id: member.id,
                        message: aiResponse.response,
                        message_type: "text"
                      }
                    });
                  });
                
                await Promise.all(aiSendPromises);
              }, 1500);
            }
          } catch (error) {
            console.error("Error getting AI response:", error);
          }
        }
        
        setNewMessage("");
        toast({
          title: "Message sent",
        });
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {getHeaderTitle()}
        </CardTitle>
        {renderError()}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ChatMessagesList
          isGroupChat={true}
          careTeamGroup={careTeamGroup}
        />
        <ChatInput
          value={newMessage}
          onChange={setNewMessage}
          onSend={handleSendMessage}
          disabled={!careTeamGroup}
          placeholder="Message your care team..."
        />
      </CardContent>
    </Card>
  );
};
