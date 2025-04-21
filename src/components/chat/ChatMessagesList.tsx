import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Loader2, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ChatMessagesListProps {
  selectedUserId?: string;
  roomId?: string;
  careTeamMembers?: any[];
  localMessages?: any[];
  useRoomMessages?: boolean;
}

export const ChatMessagesList = ({
  selectedUserId,
  roomId,
  careTeamMembers = [],
  localMessages = [],
  useRoomMessages = false,
}: ChatMessagesListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchUserId() {
      const { data: userData } = await supabase.auth.getUser();
      if (mounted) setAuthUserId(userData?.user?.id || null);
    }
    fetchUserId();
    return () => { mounted = false; };
  }, []);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: useRoomMessages 
      ? ["room_messages", roomId] 
      : ["chat_messages", authUserId, selectedUserId],
    queryFn: async () => {
      try {
        if (useRoomMessages && roomId) {
          const { data, error } = await supabase.rpc('get_room_messages', {
            p_room_id: roomId,
            p_limit: 100,
            p_offset: 0
          });
          if (error) throw error;
          return data || [];
        } else if (selectedUserId && authUserId) {
          const { data, error } = await supabase.rpc('get_user_chat_messages', { 
            p_user_id: authUserId,
            p_other_user_id: selectedUserId,
            p_limit: 100,
            p_offset: 0
          });
          if (error) throw error;
          return data || [];
        }
        return [];
      } catch (error) {
        console.error("Error fetching messages:", error);
        return [];
      }
    },
    enabled: (useRoomMessages && !!roomId) || (!!selectedUserId && !!authUserId),
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, localMessages]);

  const isFileMessage = (message: string) => {
    return message.startsWith("Uploaded medical report:") || 
           message.includes("medical report") || 
           message.includes("test report");
  };

  const getFileName = (message: string) => {
    const parts = message.split(":");
    if (parts.length > 1) {
      return parts[1].trim();
    }
    return "medical-report.pdf";
  };

  const downloadFile = async (fileName: string) => {
    try {
      const { data, error } = await supabase
        .from('patient_medical_reports')
        .select('file_path')
        .eq('file_name', fileName)
        .order('uploaded_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) throw error;
      
      if (data?.file_path) {
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('patient_medical_reports')
          .createSignedUrl(data.file_path, 60);
        
        if (signedUrlError) throw signedUrlError;
        
        window.open(signedUrlData.signedUrl, '_blank');
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Unable to download file. Please try again later.");
    }
  };

  if (isLoading && messages.length === 0 && localMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const allMessages = [...messages, ...localMessages].sort((a, b) => {
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "??";
    return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();
  };

  const getAvatarColor = (role?: string) => {
    switch (role) {
      case 'doctor':
        return 'bg-blue-100 text-blue-800';
      case 'patient':
        return 'bg-green-100 text-green-800';
      case 'nutritionist':
        return 'bg-purple-100 text-purple-800';
      case 'aibot':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ScrollArea className="flex-1 px-4 py-4">
      {allMessages.length === 0 ? (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          <p>No messages yet. Start a conversation!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {allMessages.map((message, index) => {
            const isCurrentUser = message.sender?.id === authUserId;
            const isAI = message.is_ai_message || message.sender?.id === '00000000-0000-0000-0000-000000000000' || message.sender?.role === 'aibot';
            const isSystemMessage = message.is_system_message;
            const isTyping = message.isTyping;
            
            const senderMember = careTeamMembers.find(m => m.id === message.sender?.id || m.id === message.sender_id);
            const senderRole = senderMember?.role || message.sender?.role || 'unknown';
            const senderName = senderMember ? 
              `${senderMember.first_name || ''} ${senderMember.last_name || ''}`.trim() : 
              message.sender_name || `${message.sender?.first_name || ''} ${message.sender?.last_name || ''}`.trim();
            
            const avatarColor = getAvatarColor(senderRole);
            const initials = isAI ? 'AI' : getInitials(
              senderMember?.first_name || message.sender?.first_name, 
              senderMember?.last_name || message.sender?.last_name
            );
            
            const isFile = isFileMessage(message.message);
            const fileName = isFile ? getFileName(message.message) : '';
            
            if (isSystemMessage) {
              return (
                <div key={index} className="flex justify-center">
                  <div className="bg-muted px-3 py-1 rounded-full text-xs text-center text-muted-foreground max-w-[80%]">
                    {message.message}
                  </div>
                </div>
              );
            }
            
            if (isTyping) {
              return (
                <div key={index} className="flex items-start gap-2">
                  <Avatar className={`h-8 w-8 ${avatarColor}`}>
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1 max-w-[80%]">
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="flex space-x-2">
                        <div className="h-2 w-2 bg-primary rounded-full animate-bounce" />
                        <div className="h-2 w-2 bg-primary rounded-full animate-bounce delay-75" />
                        <div className="h-2 w-2 bg-primary rounded-full animate-bounce delay-150" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
            
            return (
              <div
                key={index}
                className={`flex items-start gap-2 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
              >
                <Avatar className={`h-8 w-8 ${avatarColor}`}>
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                
                <div className={`flex flex-col space-y-1 max-w-[80%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                  <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                    <span className="text-xs text-muted-foreground mb-1">
                      {senderName || 'Unknown user'}
                    </span>
                    
                    {isFile ? (
                      <div className={`p-3 rounded-lg flex items-center ${
                        isCurrentUser 
                          ? 'bg-primary text-primary-foreground' 
                          : isAI
                            ? 'bg-amber-100 border border-amber-200'
                            : 'bg-muted'
                      }`}>
                        <FileText className="h-5 w-5 mr-2" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate" style={{ maxWidth: '200px' }}>{fileName}</p>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 ml-2"
                                onClick={() => downloadFile(fileName)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Download file</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ) : (
                      <div className={`p-3 rounded-lg ${
                        isCurrentUser 
                          ? 'bg-primary text-primary-foreground' 
                          : isAI
                            ? 'bg-amber-100 border border-amber-200'
                            : 'bg-muted'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {message.created_at ? format(new Date(message.created_at), 'p') : ''}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      )}
    </ScrollArea>
  );
};
