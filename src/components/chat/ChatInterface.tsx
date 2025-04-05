import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Users, WifiOff } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ChatInput } from "./ChatInput";
import { ChatMessagesList } from "./ChatMessagesList";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { v4 as uuidv4 } from "uuid";
import { useOnlineStatus } from "@/utils/networkStatus";
import { saveOfflineMessage, getUnsyncedMessages, markMessageAsSynced, deleteOfflineMessage } from "@/utils/offlineStorage";

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

interface LocalMessage {
  id: string;
  message: string;
  created_at: string;
  read: boolean;
  sender: {
    id: string;
    first_name: string;
    last_name: string;
    role?: string;
  };
  synced?: boolean | string;
}

export const ChatInterface = ({ assignedUsers = [], careTeamGroup = null, showGroupChat = true }: ChatInterfaceProps) => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isGroupChat, setIsGroupChat] = useState<boolean>(showGroupChat && !!careTeamGroup);
  const isOnline = useOnlineStatus();
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [hasInitialAiMessage, setHasInitialAiMessage] = useState<boolean>(false);

  // If doctor and has assigned patients, select first patient by default
  useEffect(() => {
    if (userRole === 'doctor' && assignedUsers?.length && !selectedUserId) {
      setSelectedUserId(assignedUsers[0].id);
    }
  }, [userRole, assignedUsers, selectedUserId]);

  useEffect(() => {
    if (careTeamGroup && !hasInitialAiMessage && isOnline) {
      const hasAiBot = careTeamGroup.members.some(member => 
        member.role === 'aibot' || member.id === '00000000-0000-0000-0000-000000000000'
      );
      
      if (hasAiBot && userRole === 'patient') {
        setTimeout(async () => {
          try {
            const welcomeMessage = `Welcome to your Care Team chat! I'm your AI assistant and I'm here to help answer any questions you might have. Your doctor and nutritionist are also available in this group chat. How can we assist you today?`;
            
            const aiMessage: LocalMessage = {
              id: uuidv4(),
              message: welcomeMessage,
              created_at: new Date().toISOString(),
              read: false,
              sender: {
                id: '00000000-0000-0000-0000-000000000000',
                first_name: 'AI',
                last_name: 'Assistant',
                role: 'aibot'
              },
              synced: true
            };
            
            setLocalMessages(prev => [...prev, aiMessage]);
            setHasInitialAiMessage(true);
          } catch (error) {
            console.error("Error sending AI welcome message:", error);
          }
        }, 1000);
      }
    }
  }, [careTeamGroup, hasInitialAiMessage, isOnline, userRole]);

  useEffect(() => {
    const syncOfflineMessages = async () => {
      if (isOnline && user?.id) {
        const unsyncedMessages = await getUnsyncedMessages();
        
        if (unsyncedMessages.length > 0) {
          toast({
            title: "Syncing messages",
            description: `Syncing ${unsyncedMessages.length} messages that were sent offline...`,
          });

          for (const message of unsyncedMessages) {
            try {
              await supabase.functions.invoke("send-chat-message", {
                body: {
                  sender_id: message.sender_id,
                  receiver_id: message.receiver_id,
                  message: message.message,
                  message_type: message.message_type
                }
              });
              
              await markMessageAsSynced(message.id);
              await deleteOfflineMessage(message.id);
            } catch (error) {
              console.error("Failed to sync message:", error);
            }
          }

          toast({
            title: "Messages synced",
            description: "Your offline messages have been delivered.",
          });
        }
      }
    };

    syncOfflineMessages();
  }, [isOnline, user?.id, toast]);

  // Get users list based on role
  const availableUsers = userRole === 'doctor' ? assignedUsers : [];

  // For doctors viewing patient messages in a care group
  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
  };

  const getHeaderTitle = () => {
    if (userRole === 'doctor') {
      const selectedUser = availableUsers.find(u => u.id === selectedUserId);
      return selectedUser ? `${selectedUser.first_name} ${selectedUser.last_name}` : "Select a patient";
    }
    if (isGroupChat && careTeamGroup) {
      return (
        <div className="flex items-center gap-2">
          {careTeamGroup.groupName}
          <span className="text-xs text-muted-foreground">
            ({careTeamGroup.members.length} members)
          </span>
        </div>
      );
    }
    return "Care Team";
  };

  const getUserDisplayName = (user: UserProfile) => {
    const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    const role = user.role || (user.user_role?.role || "");
    return role ? `${name} (${role})` : name;
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
      // Doctor sending message to a patient
      if (userRole === 'doctor' && selectedUserId) {
        const timestamp = new Date().toISOString();
        
        const localMessage: LocalMessage = {
          id: uuidv4(),
          message: newMessage,
          created_at: timestamp,
          read: false,
          sender: {
            id: user.id,
            first_name: user.user_metadata?.first_name || "",
            last_name: user.user_metadata?.last_name || "",
            role: userRole
          },
          synced: !isOnline
        };
        
        setLocalMessages(prev => [...prev, localMessage]);
        
        if (!isOnline) {
          await saveOfflineMessage({
            id: uuidv4(),
            sender_id: user.id,
            receiver_id: selectedUserId,
            message: newMessage,
            message_type: "text",
            created_at: timestamp,
            synced: false
          });
          
          toast({
            title: "Message saved",
            description: "Your message will be sent when you're back online.",
          });
          
          setNewMessage("");
          return;
        }
        
        // Send message to the selected patient
        await supabase.functions.invoke("send-chat-message", {
          body: {
            sender_id: user.id,
            receiver_id: selectedUserId,
            message: newMessage,
            message_type: "text"
          }
        });
        
        setNewMessage("");
        toast({
          title: "Message sent",
        });
        return;
      }
      
      if (careTeamGroup) {
        const timestamp = new Date().toISOString();
        
        const localMessage: LocalMessage = {
          id: uuidv4(),
          message: newMessage,
          created_at: timestamp,
          read: false,
          sender: {
            id: user.id,
            first_name: user.user_metadata?.first_name || "",
            last_name: user.user_metadata?.last_name || "",
            role: userRole
          },
          synced: !isOnline
        };
        
        setLocalMessages(prev => [...prev, localMessage]);
        
        if (!isOnline) {
          for (const member of careTeamGroup.members) {
            if (member.role === 'aibot') continue;
            
            await saveOfflineMessage({
              id: uuidv4(),
              sender_id: user.id,
              receiver_id: member.id,
              message: newMessage,
              message_type: "text",
              created_at: timestamp,
              synced: false
            });
          }
          
          toast({
            title: "Message saved",
            description: "Your message will be sent when you're back online.",
          });
          
          setNewMessage("");
          return;
        }
        
        // Send message to all care team members
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
        
        // Get AI response if there's an AI bot in the care team
        if (careTeamGroup.members.some(member => member.role === 'aibot')) {
          try {
            const { data: aiResponse } = await supabase.functions.invoke('doctor-ai-assistant', {
              body: { 
                messages: [{ role: "user", content: newMessage }],
                preferredLanguage: 'en',
                patientId: user.id,
                isCareTeamChat: true
              },
            });
            
            if (aiResponse && aiResponse.response) {
              setTimeout(async () => {
                const aiMessage: LocalMessage = {
                  id: uuidv4(),
                  message: aiResponse.response,
                  created_at: new Date().toISOString(),
                  read: false,
                  sender: {
                    id: '00000000-0000-0000-0000-000000000000',
                    first_name: 'AI',
                    last_name: 'Assistant',
                    role: 'aibot'
                  },
                  synced: true
                };
                
                setLocalMessages(prev => [...prev, aiMessage]);
                
                // Send AI's response to all human care team members
                const aiSendPromises = careTeamGroup.members
                  .filter(member => member.id !== '00000000-0000-0000-0000-000000000000')
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
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {userRole === 'doctor' ? <MessageSquare className="h-5 w-5" /> : <Users className="h-5 w-5" />}
          {getHeaderTitle()}
          {!isOnline && <WifiOff className="h-4 w-4 text-red-500 ml-2" />}
        </CardTitle>
        {!isOnline && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertDescription className="text-yellow-800">
              You're currently offline. Messages will be sent when your connection returns.
            </AlertDescription>
          </Alert>
        )}
        
        {userRole === 'doctor' && (
          <div className="mt-2">
            <Label htmlFor="patientSelect">Select Patient</Label>
            <Select 
              value={selectedUserId || ''} 
              onValueChange={handleUserSelect}
            >
              <SelectTrigger id="patientSelect" className="w-full">
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {getUserDisplayName(user)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {userRole === 'doctor' ? (
          // Doctor view with patient messages
          <ChatMessagesList
            selectedUserId={selectedUserId}
            isGroupChat={false}
            offlineMode={!isOnline}
            localMessages={localMessages}
          />
        ) : (
          // Standard care team view
          <ChatMessagesList
            isGroupChat={isGroupChat}
            careTeamGroup={careTeamGroup}
            selectedUserId={!isGroupChat ? selectedUserId : null}
            offlineMode={!isOnline}
            localMessages={localMessages}
          />
        )}
        
        <ChatInput
          value={newMessage}
          onChange={setNewMessage}
          onSend={handleSendMessage}
          disabled={userRole === 'doctor' ? !selectedUserId : !careTeamGroup}
          placeholder={
            userRole === 'doctor' 
              ? "Message to patient..." 
              : isOnline 
                ? "Message your care team..." 
                : "Message your care team (offline)..."
          }
          offlineMode={!isOnline}
        />
      </CardContent>
    </Card>
  );
};
