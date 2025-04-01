
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

export const ChatInterface = ({ assignedUsers = [], careTeamGroup = null, showGroupChat = false }: ChatInterfaceProps) => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isGroupChat, setIsGroupChat] = useState<boolean>(showGroupChat && !!careTeamGroup);

  // Fetch available chat users based on user role
  const { data: allUsers, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ["available_chat_users", user?.id, userRole],
    queryFn: async () => {
      if (!user?.id) return [];
      
      if (assignedUsers?.length > 0) {
        // If we have assigned users from props, use them directly
        return assignedUsers;
      }
      
      try {
        // For patients: always ensure admins are included
        if (userRole === "patient") {
          let careTeam: UserProfile[] = [];
          let careTeamError = null;
          
          // Try to get care team using get_patient_care_team function
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
          
          // If the function call fails, try to get doctor and nutritionist separately using functions
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
              
              // Add AI bot manually if using fallback
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
          
          // Always get administrators for patients
          const { data: admins, error: adminsError } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, user_role:user_roles(role)")
            .eq("user_roles.role", "administrator");
            
          if (adminsError) throw adminsError;
          
          // Format admin users
          const formattedAdmins = (admins || []).map(admin => ({
            id: admin.id,
            first_name: admin.first_name,
            last_name: admin.last_name,
            role: "administrator"
          }));
          
          // Combine providers and admins, ensuring admins are always included
          return [...careTeam, ...formattedAdmins];
        } 
        // For doctors and nutritionists: get assigned patients and admins
        else if (userRole === "doctor" || userRole === "nutritionist") {
          // Get assigned patients
          const { data: patients } = await supabase.functions.invoke('get-assigned-patients', {
            body: {
              provider_id: user.id,
              provider_role: userRole
            }
          });
          
          // Get administrators
          const { data: admins, error: adminsError } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, user_role:user_roles(role)")
            .eq("user_roles.role", "administrator");
            
          if (adminsError) throw adminsError;
          
          // Format admin users
          const formattedAdmins = (admins || []).map(admin => ({
            id: admin.id,
            first_name: admin.first_name,
            last_name: admin.last_name,
            role: "administrator"
          }));
          
          // Combine patients and admins
          return [...(patients as UserProfile[] || []), ...formattedAdmins];
        } 
        // For admins: get all users
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

  // Select first user by default when users are loaded
  useEffect(() => {
    if (showGroupChat && careTeamGroup) {
      setIsGroupChat(true);
    } else if (allUsers?.length > 0 && !selectedUserId && !isGroupChat) {
      setSelectedUserId(allUsers[0].id);
    }
  }, [allUsers, selectedUserId, isGroupChat, showGroupChat, careTeamGroup]);

  // Helper functions for the component
  const getHeaderTitle = () => {
    if (isGroupChat && careTeamGroup) {
      return careTeamGroup.groupName;
    }
    if (usersLoading) return "Loading contacts...";
    if (usersError) return "Error loading contacts";
    if (allUsers?.length === 0) return "No contacts available";
    return "Messages";
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

    if (!isGroupChat && !selectedUserId) {
      toast({
        title: "Cannot send message",
        description: "Please select a recipient first.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isGroupChat && careTeamGroup) {
        // Send message to all members of the care team
        const sendPromises = careTeamGroup.members.map(member => {
          // Don't send message to AI bot through regular channels
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

        // Process messages
        await Promise.all(sendPromises);
        
        // Handle AI bot response if this is a group chat with AI
        if (careTeamGroup.members.some(member => member.role === 'aibot')) {
          try {
            // Generate AI response
            const { data: aiResponse } = await supabase.functions.invoke('doctor-ai-assistant', {
              body: { 
                messages: [{ role: "user", content: newMessage }],
                preferredLanguage: 'en'
              },
            });
            
            if (aiResponse && aiResponse.response) {
              // AI response delay for natural feel
              setTimeout(async () => {
                // Send AI response back to all human group members
                const aiSendPromises = careTeamGroup.members
                  .filter(member => member.role !== 'aibot')
                  .map(member => {
                    return supabase.functions.invoke("send-chat-message", {
                      body: {
                        sender_id: '00000000-0000-0000-0000-000000000000', // AI bot ID
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
          title: "Group message sent",
        });
      } else if (selectedUserId) {
        // Individual chat - check if user is chatting with AI bot
        if (selectedUserId === '00000000-0000-0000-0000-000000000000') {
          // Direct message to AI bot
          try {
            // Save user message
            await supabase.functions.invoke("send-chat-message", {
              body: {
                sender_id: user.id,
                receiver_id: selectedUserId,
                message: newMessage,
                message_type: "text"
              }
            });
            
            // Generate AI response
            const { data: aiResponse } = await supabase.functions.invoke('doctor-ai-assistant', {
              body: { 
                messages: [{ role: "user", content: newMessage }],
                preferredLanguage: 'en' 
              },
            });
            
            if (aiResponse && aiResponse.response) {
              // Send AI response back to user with slight delay for natural feel
              setTimeout(async () => {
                await supabase.functions.invoke("send-chat-message", {
                  body: {
                    sender_id: selectedUserId, // AI bot ID
                    receiver_id: user.id,
                    message: aiResponse.response,
                    message_type: "text"
                  }
                });
              }, 1500);
            }
            
            setNewMessage("");
            toast({
              title: "Message sent to AI Assistant",
            });
          } catch (error) {
            console.error("Error in AI chat:", error);
            toast({
              title: "Error",
              description: "Failed to get AI response. Please try again.",
              variant: "destructive",
            });
          }
        } else {
          // Regular user-to-user chat
          const { error } = await supabase.functions.invoke("send-chat-message", {
            body: {
              sender_id: user.id,
              receiver_id: selectedUserId,
              message: newMessage,
              message_type: "text"
            }
          });

          if (error) {
            console.error("Error sending message:", error);
            toast({
              title: "Error sending message",
              description: "Failed to send message. Please try again.",
              variant: "destructive",
            });
            return;
          }

          setNewMessage("");
          toast({
            title: "Message sent",
          });
        }
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
          {isGroupChat ? 
            <Users className="h-5 w-5" /> :
            <MessageSquare className="h-5 w-5" />
          }
          {getHeaderTitle()}
        </CardTitle>
        {!isGroupChat && (
          <div className="space-y-2">
            <Label htmlFor="user-select">Select Contact</Label>
            {usersLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={selectedUserId || ""}
                onValueChange={setSelectedUserId}
                disabled={allUsers?.length === 0}
              >
                <SelectTrigger id="user-select">
                  <SelectValue placeholder="Select a contact" />
                </SelectTrigger>
                <SelectContent>
                  {allUsers?.map((user) => (
                    <SelectItem 
                      key={user.id} 
                      value={user.id}
                    >
                      {getUserDisplayName(user)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
        {renderError()}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ChatMessagesList
          selectedUserId={selectedUserId}
          isGroupChat={isGroupChat}
          careTeamGroup={careTeamGroup}
        />
        <ChatInput
          value={newMessage}
          onChange={setNewMessage}
          onSend={handleSendMessage}
          disabled={(!selectedUserId && !isGroupChat)}
          placeholder={isGroupChat ? "Message your care team..." : "Type a message..."}
        />
      </CardContent>
    </Card>
  );
};
