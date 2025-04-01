
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

  // If assignedUsers is provided, use that instead of fetching all users
  const { data: allUsers, error: usersError } = useQuery({
    queryKey: ["all_users", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      if (assignedUsers?.length > 0) {
        return assignedUsers;
      }
      
      // Get all profiles except current user
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .neq("id", user.id);

      if (error) {
        console.error("Error fetching users:", error);
        throw error;
      }
      
      return data as UserProfile[];
    },
    enabled: !!user?.id,
  });

  // Select first user by default
  useEffect(() => {
    if (allUsers?.length > 0 && !selectedUserId) {
      setSelectedUserId(allUsers[0].id);
    }
  }, [allUsers, selectedUserId]);

  // Fetch selected user details
  const { data: selectedUser, error: selectedUserError } = useQuery({
    queryKey: ["selected_user", selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return null;
      
      if (assignedUsers?.length > 0) {
        return assignedUsers.find(u => u.id === selectedUserId) || null;
      }
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("id", selectedUserId)
        .maybeSingle();

      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!selectedUserId,
  });

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
      const { data, error } = await supabase.rpc("send_chat_message", {
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
        title: "Message sent successfully",
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
    const userName = selectedUser 
      ? `${safelyUnwrapValue(selectedUser.first_name, "")} ${safelyUnwrapValue(selectedUser.last_name, "")}`
      : "";
      
    if (userName) {
      return `Chat with ${userName}`;
    }
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
            Unable to load users. Please refresh the page.
          </AlertDescription>
        </Alert>
      );
    }
    if (selectedUserError) {
      return (
        <Alert variant="destructive">
          <AlertDescription>
            Unable to load user information. Please try again later.
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
          <Label htmlFor="user-select">Select User</Label>
          <Select
            value={selectedUserId || ""}
            onValueChange={setSelectedUserId}
          >
            <SelectTrigger id="user-select">
              <SelectValue placeholder="Select a user to chat with" />
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
