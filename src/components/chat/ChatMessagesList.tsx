import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "./ChatMessage";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role?: string;
  user_role?: { role: string } | null;
}

interface CareTeamGroup {
  groupName: string;
  members: UserProfile[];
}

export interface ChatMessagesListProps {
  selectedUserId?: string | null;
  careTeamGroup?: CareTeamGroup | null;
  careTeamMembers?: UserProfile[];
  offlineMode?: boolean;
  localMessages?: any[];
  isGroupChat?: boolean; 
  includeCareTeamMessages?: boolean;
  specificEmail?: string;
}

interface ChatMessageType {
  id: string;
  message: string;
  message_type: string;
  created_at: string;
  read?: boolean;
  sender: UserProfile;
  receiver: UserProfile;
  file_url?: string | null;
}

export const ChatMessagesList = ({ 
  selectedUserId, 
  careTeamGroup = null,
  careTeamMembers = [],
  offlineMode = false,
  localMessages = [],
  isGroupChat = false,
  includeCareTeamMessages = false,
  specificEmail = null
}: ChatMessagesListProps) => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [errorRetries, setErrorRetries] = useState(0);

  console.log("ChatMessagesList render with:", {
    selectedUserId,
    careTeamGroup: careTeamGroup?.members?.length,
    careTeamMembers: careTeamMembers?.length,
    userRole,
    localMessages: localMessages?.length,
    isGroupChat,
    includeCareTeamMessages,
    specificEmail
  });

  const {
    data: messages,
    isLoading,
    error,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ["chat_messages", user?.id, selectedUserId, 
      careTeamGroup?.groupName, 
      careTeamMembers?.map(m => m.id).join('-'),
      isGroupChat,
      includeCareTeamMessages,
      specificEmail
    ],
    queryFn: async () => {
      if (!user?.id) return [];

      console.log("Fetching messages with params:", {
        userId: user?.id,
        selectedUserId,
        careTeamMembersCount: careTeamMembers?.length || 0,
        careTeamGroupName: careTeamGroup?.groupName,
        userRole,
        isGroupChat,
        includeCareTeamMessages,
        specificEmail
      });
      
      if (selectedUserId || specificEmail) {
        try {
          console.log("Getting care team messages via edge function");
          const { data, error } = await supabase.functions.invoke('get-chat-messages', {
            body: {
              user_id: user.id,
              other_user_id: selectedUserId,
              email: specificEmail,
              is_group_chat: isGroupChat || userRole === 'patient',
              care_team_members: careTeamMembers,
              include_care_team_messages: includeCareTeamMessages || userRole === 'patient'
            }
          });

          if (error) {
            console.error("Error invoking get-chat-messages:", error);
            throw error;
          }

          console.log(`Retrieved ${data?.messages?.length || 0} messages via edge function`);
          return data?.messages || [];
        } catch (err) {
          console.error("Error in messages retrieval:", err);
          
          if (errorRetries > 2) {
            toast({
              title: "Trouble loading messages",
              description: "We're having trouble connecting to the message service. Please try again later.",
              variant: "destructive"
            });
          }
          
          setErrorRetries(prev => prev + 1);
          throw err;
        }
      }

      return [];
    },
    enabled: !!user?.id && (!!selectedUserId || !!specificEmail),
    staleTime: 5000,
    refetchInterval: 10000,
    retry: 2,
    refetchOnWindowFocus: true
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages, localMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleManualRefresh = () => {
    setErrorRetries(0);
    refetch();
  };

  const serverMessages = Array.isArray(messages) ? messages : [];
  const allMessages = [...serverMessages, ...localMessages];
  
  allMessages.sort((a, b) => (new Date(a.created_at)).getTime() - (new Date(b.created_at)).getTime());

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center">Loading messages...</div>;
  }

  return (
    <div className="flex-1 overflow-hidden relative">
      {error && (
        <div className="absolute top-2 right-2 z-50">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefetching}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      )}
      
      <ScrollArea className="h-full w-full p-4">
        <div className="flex flex-col gap-2">
          {error && allMessages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-destructive mb-2">Error loading messages</p>
              <p className="text-sm">Try refreshing or check your connection</p>
            </div>
          ) : allMessages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No messages yet. Start a conversation in the Care Team Chat!
            </div>
          ) : (
            allMessages.map((message, index) => {
              if (!message) return null;
              
              const isLocal = localMessages.some(localMessage => localMessage.id === message.id);
              const isCurrentUser = message.sender?.id === user?.id;
              const showAvatar = index === 0 || allMessages[index - 1]?.sender?.id !== message.sender?.id;
              
              return (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isCurrentUser={isCurrentUser}
                  showAvatar={showAvatar}
                  offlineMode={offlineMode}
                  isLocal={isLocal}
                />
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
};
