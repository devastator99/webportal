
import { useAuth } from "@/contexts/AuthContext";
import { supabase, safelyUnwrapValue, asArray } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
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

interface ChatInterfaceProps {
  assignedUsers?: UserProfile[];
}

export const ChatInterface = ({ assignedUsers = [] }: ChatInterfaceProps) => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

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
          // Get assigned care team (doctors and nutritionists)
          const { data: careTeam, error: careTeamError } = await (supabase.rpc as any)("get_patient_care_team", {
            p_patient_id: user.id
          });
          
          if (careTeamError) throw careTeamError;
          
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
          return [...(careTeam || []), ...formattedAdmins];
        } 
        // For doctors and nutritionists: get assigned patients and admins
        else if (userRole === "doctor" || userRole === "nutritionist") {
          // Get assigned patients
          const { data: patients, error: patientsError } = await (supabase.rpc as any)("get_assigned_patients", {
            p_provider_id: user.id,
            p_provider_role: userRole
          });
          
          if (patientsError) throw patientsError;
          
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
          return [...(patients || []), ...formattedAdmins];
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
        throw error;
      }
    },
    enabled: !!user?.id && !!userRole
  });

  // Select first user by default when users are loaded
  useEffect(() => {
    if (allUsers?.length > 0 && !selectedUserId) {
      setSelectedUserId(allUsers[0].id);
    }
  }, [allUsers, selectedUserId]);

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

    if (!selectedUserId) {
      toast({
        title: "Cannot send message",
        description: "Please select a recipient first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await (supabase.rpc as any)("send_chat_message", {
        p_sender_id: user.id,
        p_receiver_id: selectedUserId,
        p_message: newMessage,
        p_message_type: "text"
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
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const getHeaderTitle = () => {
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

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {getHeaderTitle()}
        </CardTitle>
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
        {renderError()}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ChatMessagesList
          selectedUserId={selectedUserId}
        />
        <ChatInput
          value={newMessage}
          onChange={setNewMessage}
          onSend={handleSendMessage}
          disabled={!selectedUserId}
        />
      </CardContent>
    </Card>
  );
};
