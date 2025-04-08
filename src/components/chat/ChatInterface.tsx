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
import { v4 as uuidv4 } from "uuid";
import { useOnlineStatus } from "@/utils/networkStatus";
import { saveOfflineMessage, getUnsyncedMessages, markMessageAsSynced, deleteOfflineMessage } from "@/utils/offlineStorage";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
  whatsAppStyle?: boolean;
  includeAiBot?: boolean;
  includeCareTeamMessages?: boolean;
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

export const ChatInterface = ({ 
  assignedUsers = [], 
  careTeamGroup = null, 
  showGroupChat = true,
  whatsAppStyle = false,
  includeAiBot = false,
  includeCareTeamMessages = false
}: ChatInterfaceProps) => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isGroupChat, setIsGroupChat] = useState<boolean>(showGroupChat && !!careTeamGroup);
  const isOnline = useOnlineStatus();
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [hasInitialAiMessage, setHasInitialAiMessage] = useState<boolean>(false);

  const showWhatsAppStyle = whatsAppStyle && userRole === 'doctor' && assignedUsers.length > 0;

  const getHeaderTitle = () => {
    if (userRole === 'doctor' || userRole === 'nutritionist') {
      return "Messages";
    } else if (isGroupChat) {
      return "Care Team Chat";
    } else if (selectedUserId) {
      const selectedUser = assignedUsers.find(u => u.id === selectedUserId);
      return selectedUser ? `Chat with ${selectedUser.first_name} ${selectedUser.last_name}` : "Chat";
    }
    return "Chat";
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();
  };

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
              const { error } = await supabase.rpc('send_chat_message', {
                p_sender_id: message.sender_id,
                p_receiver_id: message.receiver_id,
                p_message: message.message,
                p_message_type: message.message_type
              });
              
              if (error) throw error;
              
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

  const availableUsers = userRole === 'doctor' ? assignedUsers : [];

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
        
        const { error } = await supabase.rpc('send_chat_message', {
          p_sender_id: user.id,
          p_receiver_id: selectedUserId,
          p_message: newMessage,
          p_message_type: 'text'
        });
        
        if (error) throw error;
        
        setNewMessage("");
        toast({
          title: "Message sent",
        });
        
        if (includeAiBot) {
          try {
            const { data: careTeamMembers } = await supabase.rpc('get_patient_care_team_members', {
              p_patient_id: selectedUserId
            });
            
            const hasAiBot = Array.isArray(careTeamMembers) && careTeamMembers.some(member => 
              member.role === 'aibot' || member.id === '00000000-0000-0000-0000-000000000000'
            );
            
            if (hasAiBot) {
              const { data: aiResponse } = await supabase.functions.invoke('doctor-ai-assistant', {
                body: { 
                  messages: [{ role: "user", content: newMessage }],
                  preferredLanguage: 'en',
                  patientId: selectedUserId,
                  isCareTeamChat: true
                },
              });
              
              if (aiResponse && aiResponse.response) {
                setTimeout(() => {
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
                  
                  supabase.rpc('send_chat_message', {
                    p_sender_id: '00000000-0000-0000-0000-000000000000',
                    p_receiver_id: selectedUserId,
                    p_message: aiResponse.response,
                    p_message_type: 'text'
                  });
                  
                  const nutritionist = careTeamMembers?.find(m => m.role === 'nutritionist');
                  if (nutritionist?.id) {
                    supabase.rpc('send_chat_message', {
                      p_sender_id: '00000000-0000-0000-0000-000000000000',
                      p_receiver_id: nutritionist.id,
                      p_message: aiResponse.response,
                      p_message_type: 'text'
                    });
                  }
                }, 1500);
              }
            }
          } catch (aiError) {
            console.error("Error getting AI response:", aiError);
          }
        }
        
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
        
        const sendPromises = careTeamGroup.members.map(member => {
          if (member.role === 'aibot' || member.id === '00000000-0000-0000-0000-000000000000') return Promise.resolve();
          
          return supabase.rpc('send_chat_message', {
            p_sender_id: user.id,
            p_receiver_id: member.id,
            p_message: newMessage,
            p_message_type: 'text'
          });
        }).filter(Boolean);

        await Promise.all(sendPromises);
        
        if (careTeamGroup.members.some(member => 
          member.role === 'aibot' || member.id === '00000000-0000-0000-0000-000000000000'
        )) {
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
                
                const aiSendPromises = careTeamGroup.members
                  .filter(member => member.id !== '00000000-0000-0000-0000-000000000000')
                  .map(member => {
                    return supabase.rpc('send_chat_message', {
                      p_sender_id: '00000000-0000-0000-0000-000000000000',
                      p_receiver_id: member.id,
                      p_message: aiResponse.response,
                      p_message_type: 'text'
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

  if (showWhatsAppStyle) {
    return (
      <div className="h-full flex flex-col md:flex-row">
        <div className="w-full md:w-1/3 border-r h-64 md:h-full overflow-y-auto">
          <div className="p-2">
            {assignedUsers.map((patient) => (
              <div 
                key={patient.id}
                className={`flex items-center gap-2 p-3 rounded-md cursor-pointer hover:bg-slate-100 transition-colors ${
                  selectedUserId === patient.id ? 'bg-slate-100' : ''
                }`}
                onClick={() => handleUserSelect(patient.id)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {getInitials(patient.first_name, patient.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {patient.first_name} {patient.last_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    Patient
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col h-full">
          {selectedUserId ? (
            <>
              <div className="p-3 border-b flex items-center gap-2 bg-slate-50">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {(() => {
                      const patient = assignedUsers.find(u => u.id === selectedUserId);
                      return patient ? getInitials(patient.first_name, patient.last_name) : "PT";
                    })()}
                  </AvatarFallback>
                </Avatar>
                <div className="font-medium">
                  {(() => {
                    const patient = assignedUsers.find(u => u.id === selectedUserId);
                    return patient ? `${patient.first_name} ${patient.last_name}` : 'Loading...';
                  })()}
                </div>
              </div>
              <div className="flex-1 flex flex-col overflow-hidden">
                <ChatMessagesList
                  selectedUserId={selectedUserId}
                  groupChat={false}
                  offlineMode={!isOnline}
                  localMessages={localMessages}
                  includeCareTeamMessages={includeCareTeamMessages}
                />
                <ChatInput
                  value={newMessage}
                  onChange={setNewMessage}
                  onSend={handleSendMessage}
                  placeholder="Type a message..."
                  disabled={!selectedUserId}
                  offlineMode={!isOnline}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a patient to view conversation
            </div>
          )}
        </div>
      </div>
    );
  }

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
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {userRole === 'doctor' ? (
          <ChatMessagesList
            selectedUserId={selectedUserId}
            groupChat={false}
            offlineMode={!isOnline}
            localMessages={localMessages}
            includeCareTeamMessages={includeCareTeamMessages}
          />
        ) : (
          <ChatMessagesList
            groupChat={isGroupChat}
            careTeamGroup={careTeamGroup}
            selectedUserId={!isGroupChat ? selectedUserId : null}
            offlineMode={!isOnline}
            localMessages={localMessages}
            includeCareTeamMessages={includeCareTeamMessages}
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
