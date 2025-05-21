import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowDown, Loader2, XCircle } from "lucide-react";
import { groupMessagesByDate, safeParseISO } from "@/utils/dateUtils";
import { useChatScroll } from "@/hooks/useChatScroll";
import { CollapsibleMessageGroup } from "./CollapsibleMessageGroup";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { cn, fmt } from "@/lib/utils";

interface WhatsAppStyleChatInterfaceProps {
  patientRoomId?: string | null;
  fullScreen?: boolean;
}

export const WhatsAppStyleChatInterface: React.FC<WhatsAppStyleChatInterfaceProps> = ({ 
  patientRoomId,
  fullScreen = false 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { 
    data: messagesData, 
    isLoading: messagesLoading, 
    error 
  } = useQuery({
    queryKey: ["room_messages", patientRoomId],
    queryFn: async () => {
      if (!patientRoomId) {
        return [];
      }
      
      try {
        const { data, error } = await supabase
          .from('room_messages')
          .select('*')
          .eq('room_id', patientRoomId)
          .order('created_at', { ascending: true })
          .limit(100);
          
        if (error) throw error;
        
        // Map the messages to the format expected by ChatMessage component
        return await Promise.all(data.map(async (msg) => {
          let senderName = 'Unknown';
          let senderRole = '';
          
          if (msg.sender_id === '00000000-0000-0000-0000-000000000000') {
            // This is the AI assistant
            senderName = 'AI Assistant';
            senderRole = 'aibot';
          } else {
            // Get sender name from profiles table
            const { data: senderData, error: senderError } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', msg.sender_id)
              .single();
              
            if (!senderError && senderData) {
              senderName = `${senderData.first_name || ''} ${senderData.last_name || ''}`.trim();
            }
            
            // Get sender role from user_roles table
            const { data: roleData, error: roleError } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', msg.sender_id)
              .single();
              
            if (!roleError && roleData) {
              senderRole = roleData.role;
            }
          }
          
          return {
            id: msg.id,
            message: msg.message,
            created_at: msg.created_at,
            read: msg.read_by && Array.isArray(msg.read_by) && msg.read_by.includes(user?.id),
            sender: {
              id: msg.sender_id,
              first_name: senderName.split(' ')[0] || '',
              last_name: senderName.split(' ').slice(1).join(' ') || '',
              role: senderRole
            },
            is_system_message: msg.is_system_message || false,
            is_ai_message: msg.is_ai_message || false
          };
        }));
      } catch (err) {
        console.error('Error fetching messages:', err);
        throw err;
      }
    },
    enabled: !!patientRoomId && !!user?.id,
    staleTime: 5000,
    refetchInterval: 5000
  });

  const messages = messagesData || [];
  
  const { 
    endRef, 
    containerRef, 
    showScrollButton, 
    scrollToBottom 
  } = useChatScroll({
    messages,
    loadingMessages: messagesLoading,
    loadingMore: false,
    isNewMessage: true
  });

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  const handleSendMessage = async () => {
    if ((!message.trim() && !selectedFile) || !patientRoomId || !user) return;
    
    try {
      setIsLoading(true);
      
      let fileUrl = null;
      
      // Upload file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const filePath = `${patientRoomId}/${user.id}_${Date.now()}.${fileExt}`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('chat_attachments')
          .upload(filePath, selectedFile, {
            onUploadProgress: (progress) => {
              const percent = Math.round((progress.loaded / progress.total) * 100);
              setUploadProgress(percent);
            }
          });
          
        if (uploadError) throw uploadError;
        
        if (uploadData) {
          fileUrl = filePath;
        }
      }
      
      // Insert message with file URL if applicable
      const { error } = await supabase
        .from('room_messages')
        .insert({
          room_id: patientRoomId,
          sender_id: user.id,
          message: message.trim(),
          is_system_message: false,
          read_by: [user.id],
          attachment_url: fileUrl
        });
      
      if (error) throw error;
      
      setMessage('');
      setSelectedFile(null);
      setUploadProgress(0);
      
      // Refresh messages
      queryClient.invalidateQueries({ queryKey: ["room_messages", patientRoomId] });
      
      // Check if message contains @ai or @assistant to trigger AI response
      const hasAiCommand = message.toLowerCase().includes('@ai') || 
                          message.toLowerCase().includes('@assistant');
      
      if (hasAiCommand) {
        setIsAiTyping(true);
        try {
          const { data, error } = await supabase.functions.invoke(
            'care-team-ai-chat',
            { body: { roomId: patientRoomId, message: message.trim() } }
          );
          
          if (error) {
            console.error('Error invoking AI chat:', error);
          }
          
          // Wait a bit for UI to feel natural then refresh
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["room_messages", patientRoomId] });
            setIsAiTyping(false);
          }, 1000);
        } catch (err) {
          console.error('Error with AI chat:', err);
          setIsAiTyping(false);
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
      toast({
        title: 'Error sending message',
        description: 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessageDelete = () => {
    // Refresh messages after a message is deleted
    queryClient.invalidateQueries({ queryKey: ["room_messages", patientRoomId] });
  };

  const handleDownloadPDF = () => {
    toast({
      title: "Download Prescription",
      description: "Prescription download feature will be available soon.",
    });
  };

  const handleDownloadAttachment = async (attachmentPath: string) => {
    if (!attachmentPath) return;
    
    try {
      // Get signed URL for download
      const { data: urlData, error: urlError } = await supabase.functions.invoke(
        'get-medical-report-url',
        { body: { filePath: attachmentPath } }
      );
      
      if (urlError) throw urlError;
      
      if (urlData?.signedUrl) {
        // Create a temporary link to trigger download
        const link = document.createElement('a');
        link.href = urlData.signedUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Error downloading attachment:', err);
      toast({
        title: 'Error downloading attachment',
        description: 'Please try again',
        variant: 'destructive'
      });
    }
  };

  if (!patientRoomId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <XCircle className="h-8 w-8 mb-2 text-muted-foreground/70" />
        <p>No care team room found</p>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className={cn(`flex flex-col ${fullScreen ? 'h-[calc(100vh-20px)]' : 'h-full'}`)}>
      <ScrollArea 
        className="flex-1 bg-[#f0f2f5] dark:bg-slate-900 px-2 pt-2 pb-16" 
        viewportRef={containerRef}
        invisibleScrollbar={false}
      >
        <div className="space-y-6 mb-4">
          {messagesLoading ? (
            <div className="flex justify-center pt-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No messages yet. Start the conversation with your care team!
            </div>
          ) : (
            <ErrorBoundary>
              {Object.entries(messageGroups)
                .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                .map(([day, dayMessages], index, array) => {
                  const isLatestGroup = index === array.length - 1;
                  
                  return (
                    <CollapsibleMessageGroup 
                      key={day} 
                      date={day}
                      messages={dayMessages}
                      isLatestGroup={isLatestGroup}
                    >
                      {dayMessages.map(msg => (
                        <ChatMessage
                          key={msg.id}
                          message={msg}
                          isCurrentUser={msg.sender.id === user?.id}
                          showAvatar={true}
                          onPdfDownload={handleDownloadPDF}
                          onMessageDelete={handleMessageDelete}
                          onAttachmentDownload={handleDownloadAttachment}
                        />
                      ))}
                    </CollapsibleMessageGroup>
                  );
                })}
            </ErrorBoundary>
          )}
          <div ref={endRef} />
        </div>
      </ScrollArea>
      
      {showScrollButton && (
        <Button
          size="icon"
          variant="secondary"
          className="absolute bottom-20 right-4 h-8 w-8 rounded-full shadow-md"
          onClick={scrollToBottom}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      )}
      
      <div className="p-3 bg-background border-t sticky bottom-0">
        <ChatInput
          value={message}
          onChange={setMessage}
          onSend={handleSendMessage}
          disabled={isLoading || !patientRoomId || isAiTyping}
          isLoading={isLoading || isAiTyping}
          placeholder="Type a message... (Use @AI to ask the AI assistant)"
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
          onClearFile={handleClearFile}
          uploadProgress={uploadProgress}
        />
      </div>
    </div>
  );
};
