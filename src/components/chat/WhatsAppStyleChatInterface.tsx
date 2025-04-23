import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CareTeamRoomsSelector } from "@/components/chat/CareTeamRoomsSelector";
import { ChatInput } from "@/components/chat/ChatInput";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { useIsMobile, useIsIPad } from "@/hooks/use-mobile";
import { Menu, ChevronLeft, UserCircle, Users, MessageCircle, Loader, AlertCircle, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SearchMessages } from "./SearchMessages";
import { generatePdfFromElement } from "@/utils/pdfUtils";
import { groupMessagesByDate, sortByDate, formatChatMessageTime, isToday } from "@/utils/dateUtils";
import { CollapsibleMessageGroup } from "./CollapsibleMessageGroup";
import { useChatScroll } from "@/hooks/useChatScroll";

interface WhatsAppStyleChatInterfaceProps {
  patientRoomId?: string | null;
}

export const WhatsAppStyleChatInterface = ({ patientRoomId }: WhatsAppStyleChatInterfaceProps) => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(patientRoomId || null);
  const [newMessage, setNewMessage] = useState("");
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [roomMembers, setRoomMembers] = useState<any[]>([]);
  const isMobile = useIsMobile();
  const isIPad = useIsIPad();
  const [showSidebar, setShowSidebar] = useState(!isMobile && userRole !== 'patient');
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [newMessageAdded, setNewMessageAdded] = useState(false);
  
  const { 
    endRef, 
    containerRef, 
    showScrollButton, 
    scrollToBottom 
  } = useChatScroll({
    messages: localMessages,
    loadingMessages: isLoadingMessages,
    loadingMore: false,
    isNewMessage: newMessageAdded
  });

  const triggerAiResponse = async (message: string, roomId: string) => {
    if (!roomId) return;
    
    try {
      setIsAiResponding(true);
      console.log("Triggering AI response for message:", message);
      
      const { data, error } = await supabase.functions.invoke('care-team-ai-chat', {
        body: { 
          roomId: roomId,
          message: message
        }
      });
      
      if (error) {
        console.error("Error getting AI response:", error);
        toast({
          title: "AI Assistant Error",
          description: "Could not get AI response. Please try again.",
          variant: "destructive"
        });
        setIsAiResponding(false);
        return null;
      }
      
      console.log("AI response received:", data);
      
      setTimeout(() => {
        fetchMessages(roomId, 1);
        setIsAiResponding(false);
      }, 1000);
      
      return data;
    } catch (error) {
      console.error("Error in AI chat:", error);
      setIsAiResponding(false);
      toast({
        title: "AI Assistant Error",
        description: "Could not get AI response. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  useEffect(() => {
    if (patientRoomId) {
      console.log("Patient room ID provided to interface:", patientRoomId);
      setSelectedRoomId(patientRoomId);
      if (patientRoomId) {
        fetchRoomMembers(patientRoomId);
        fetchMessages(patientRoomId, 1);
      }
      if (userRole === 'patient') {
        setShowSidebar(false);
      }
    }
  }, [patientRoomId, userRole, isMobile]);

  useEffect(() => {
    if (!selectedRoomId) return;

    console.log("Setting up realtime subscription for room:", selectedRoomId);
    
    const channel = supabase
      .channel(`room_messages:${selectedRoomId}`)
      .on('postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_messages',
          filter: `room_id=eq.${selectedRoomId}`
        }, 
        (payload) => {
          console.log('New message received via realtime:', payload);
          fetchMessages(selectedRoomId, 1);
          setNewMessageAdded(true);
        }
      )
      .subscribe();

    return () => {
      console.log("Cleaning up realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [selectedRoomId]);

  const toggleSidebar = () => {
    if (userRole !== 'patient') {
      setShowSidebar(prev => !prev);
    }
  };

  const fetchRoomMembers = async (roomId: string) => {
    if (!roomId) return;
    
    try {
      setIsLoadingMembers(true);
      console.log("Fetching members for room:", roomId);
      
      const { data, error } = await supabase.rpc('get_chat_room_members', {
        p_room_id: roomId
      });
      
      if (error) {
        console.error("Error fetching room members:", error);
        throw error;
      }
      
      console.log("Room members retrieved:", data);
      setRoomMembers(data || []);
    } catch (error) {
      console.error("Error fetching room members:", error);
      toast({
        title: "Error",
        description: "Could not load room members",
        variant: "destructive"
      });
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const fetchMessages = async (roomId: string, pageNum: number, isLoadingMore = false) => {
    if (!roomId) return;
    try {
      if (!isLoadingMore) setIsLoadingMessages(true);
      setRoomError(null);
      const { data, error } = await supabase.rpc('get_room_messages_with_role', {
        p_room_id: roomId,
        p_limit: 100,
        p_offset: (pageNum - 1) * 100,
        p_user_role: userRole || 'patient'
      });
      if (error) {
        console.error("Error fetching room messages:", error);
        setRoomError(`Failed to load messages: ${error.message}`);
        throw error;
      }
      const sortedData = Array.isArray(data)
        ? [...data].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        : [];
      if (isLoadingMore) {
        setLocalMessages(prev => [...sortedData, ...prev]);
      } else {
        setLocalMessages(sortedData);
      }
      setHasMoreMessages(Array.isArray(data) && data.length === 100);
      setNewMessageAdded(false);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setRoomError("Could not load messages. Please try again.");
      toast({
        title: "Error",
        description: "Could not load messages",
        variant: "destructive"
      });
    } finally {
      if (!isLoadingMore) setIsLoadingMessages(false);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !selectedRoomId || !user?.id) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(10);
      
      const filePath = `${user.id}/${crypto.randomUUID()}-${selectedFile.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat_attachments')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error("Error uploading file:", uploadError);
        toast({
          title: "Upload Failed",
          description: "Could not upload file. Please try again.",
          variant: "destructive"
        });
        
        await triggerAiResponse(`[FILE_UPLOAD_ERROR]${selectedFile.name}`, selectedRoomId);
        setIsUploading(false);
        setUploadProgress(0);
        setSelectedFile(null);
        return;
      }
      
      setUploadProgress(70);
      
      const { data: { publicUrl } } = supabase.storage
        .from('chat_attachments')
        .getPublicUrl(filePath);
      
      const { data: messageData, error: messageError } = await supabase.rpc('send_room_message', {
        p_room_id: selectedRoomId,
        p_message: `[FILE] ${selectedFile.name} - ${publicUrl}`,
        p_is_system_message: false,
        p_is_ai_message: false
      });
      
      if (messageError) {
        console.error("Error sending file message:", messageError);
        toast({
          title: "Message Error",
          description: "File uploaded but couldn't send message. Please try again.",
          variant: "destructive"
        });
        setIsUploading(false);
        setUploadProgress(0);
        setSelectedFile(null);
        return;
      }
      
      setUploadProgress(100);
      
      fetchMessages(selectedRoomId, 1);
      
      await triggerAiResponse(`[FILE_UPLOAD_SUCCESS]${selectedFile.name}`, selectedRoomId);
      
      toast({
        title: "File Uploaded",
        description: "Your file has been uploaded and shared with the care team.",
      });
    } catch (error) {
      console.error("Error in file upload:", error);
      toast({
        title: "Upload Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setSelectedFile(null);
    }
  };

  const handleRoomSelect = (roomId: string) => {
    console.log("Room selected:", roomId);
    if (roomId !== selectedRoomId) {
      setSelectedRoomId(roomId);
      setPage(1);
      setLocalMessages([]);
      setRoomError(null);
      fetchRoomMembers(roomId);
      fetchMessages(roomId, 1);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;
    
    if (selectedFile) {
      await handleFileUpload();
      return;
    }
    
    if (!selectedRoomId) {
      toast({
        title: "No Room Selected",
        description: "Please select a conversation to send a message.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const optimisticId = uuidv4();
      const currentTime = new Date().toISOString();
      
      const optimisticMessage = {
        id: optimisticId,
        sender_id: user?.id,
        sender_name: 'You',
        sender_role: userRole,
        message: newMessage,
        created_at: currentTime,
        is_system_message: false,
        is_ai_message: false
      };
      
      setLocalMessages(prev => [...prev, optimisticMessage]);
      setNewMessage("");
      setNewMessageAdded(true);
      
      const { data, error } = await supabase.rpc('send_room_message', {
        p_room_id: selectedRoomId,
        p_message: newMessage,
        p_is_system_message: false,
        p_is_ai_message: false
      });
      
      if (error) {
        console.error("Error sending message:", error);
        setLocalMessages(prev => prev.filter(msg => msg.id !== optimisticId));
        
        toast({
          title: "Message Error",
          description: "Couldn't send message. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      console.log("Message sent successfully, ID:", data);
      
      setTimeout(() => fetchMessages(selectedRoomId, 1), 500);
      
      const shouldTriggerAI = 
        userRole === 'patient' || 
        newMessage.toLowerCase().includes('@ai') || 
        newMessage.toLowerCase().includes('@assistant');
        
      if (shouldTriggerAI) {
        console.log("Triggering AI response");
        await triggerAiResponse(newMessage, selectedRoomId);
      }
      
    } catch (error) {
      console.error("Error in send message:", error);
      toast({
        title: "Message Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSearchMessageClick = (messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth' });
      messageElement.classList.add('highlight-message');
      setTimeout(() => {
        messageElement.classList.remove('highlight-message');
      }, 2000);
    }
    setShowSearch(false);
  };

  const handleAiMessage = async (message: string, roomId: string) => {
    try {
      setIsAiResponding(true);
      console.log("Triggering AI response for message:", message);
      
      const { data, error } = await supabase.functions.invoke('care-team-ai-chat', {
        body: { 
          roomId: roomId,
          message: message
        }
      });
      
      if (error) {
        console.error("Error getting AI response:", error);
        throw error;
      }
      
      console.log("AI response received:", data);

      if (data.generatePdf && data.pdfType === 'prescription') {
        const { pdfData } = data;
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = `
          <div id="prescription-pdf" class="p-8">
            <h1 class="text-2xl font-bold mb-6">Medical Prescription</h1>
            <div class="mb-4">
              <p><strong>Doctor:</strong> ${pdfData.doctorName}</p>
              <p><strong>Date:</strong> ${pdfData.date}</p>
              <p><strong>Patient:</strong> ${pdfData.patientName}</p>
            </div>
            <div class="mb-4">
              <h2 class="text-xl font-semibold mb-2">Diagnosis</h2>
              <p>${pdfData.diagnosis}</p>
            </div>
            <div class="mb-4">
              <h2 class="text-xl font-semibold mb-2">Medications</h2>
              <p>${pdfData.medications}</p>
            </div>
            ${pdfData.notes ? `
              <div class="mb-4">
                <h2 class="text-xl font-semibold mb-2">Additional Notes</h2>
                <p>${pdfData.notes}</p>
              </div>
            ` : ''}
          </div>
        `;
        
        document.body.appendChild(tempDiv);
        
        await generatePdfFromElement(
          'prescription-pdf',
          `prescription_${pdfData.date.replace(/\//g, '-')}.pdf`
        );
        
        document.body.removeChild(tempDiv);
      }
      
      setTimeout(() => {
        fetchMessages(roomId, 1);
        setIsAiResponding(false);
      }, 1000);
      
      return data;
    } catch (error) {
      console.error("Error in AI chat:", error);
      setIsAiResponding(false);
      toast({
        title: "AI Assistant Error",
        description: "Could not get AI response. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  const messageGroups = groupMessagesByDate(localMessages);

  return (
    <div className="h-full flex overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-800 shadow-sm">
      {showSidebar && (
        <div className="w-72 border-r border-neutral-200 dark:border-neutral-800 flex flex-col">
          <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <h3 className="font-medium text-sm">Care Team Chats</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={toggleSidebar}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <CareTeamRoomsSelector
              onRoomSelect={handleRoomSelect}
              selectedRoomId={selectedRoomId}
            />
          </div>
        </div>
      )}
      
      <div className="flex-1 flex flex-col h-full">
        {selectedRoomId && (
          <>
            <div className="p-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Care Team Members
                </h3>
                <span className="text-xs text-muted-foreground">
                  {roomMembers.length} members
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSearch(!showSearch)}
                    className="h-8 w-8 p-0"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {roomMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-1.5">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className={`text-xs ${
                        member.role === 'doctor' ? 'bg-blue-100 text-blue-800' :
                        member.role === 'nutritionist' ? 'bg-green-100 text-green-800' :
                        member.role === 'patient' ? 'bg-orange-100 text-orange-800' :
                        member.role === 'aibot' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {member.role === 'aibot' ? 'AI' : 
                          `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {member.first_name} {member.last_name}
                      <Badge variant="outline" className="ml-1 text-[10px] py-0 px-1">
                        {member.role}
                      </Badge>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col relative">
              <SearchMessages
                messages={localMessages}
                onMessageClick={handleSearchMessageClick}
                isOpen={showSearch}
              />
              
              <ScrollArea className="flex-1 p-4" viewportRef={containerRef}>
                {isLoadingMessages && page === 1 ? (
                  <div className="flex flex-col space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-start gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-16 w-72" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : localMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
                    <MessageCircle className="h-12 w-12 mb-2 opacity-20" />
                    <p>No messages yet</p>
                    <p className="text-xs">Start a conversation with your care team</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(messageGroups).length > 0 ? (
                      Object.entries(messageGroups)
                        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                        .map(([day, dayMessages], index, array) => {
                          const isLatestGroup = index === array.length - 1; // Last group is the latest
                          const isTodayGroup = isToday(new Date(day));
                          
                          return (
                            <CollapsibleMessageGroup
                              key={day}
                              date={day}
                              messages={dayMessages}
                              isLatestGroup={isLatestGroup || isTodayGroup}
                            >
                              {dayMessages
                                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                                .map((message) => {
                                  const isCurrentUser = message.sender_id === user?.id;
                                  const isAi = message.is_ai_message || message.sender_id === '00000000-0000-0000-0000-000000000000';
                                  
                                  return (
                                    <div 
                                      key={message.id} 
                                      id={`message-${message.id}`}
                                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} my-2`}
                                    >
                                      <div className="flex items-start gap-2 max-w-[80%]">
                                        {!isCurrentUser && !message.is_system_message && (
                                          <Avatar className="h-8 w-8">
                                            {isAi ? (
                                              <AvatarFallback className="bg-purple-100 text-purple-800">
                                                AI
                                              </AvatarFallback>
                                            ) : (
                                              <AvatarFallback>
                                                {message.sender_name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                                              </AvatarFallback>
                                            )}
                                          </Avatar>
                                        )}
                                        
                                        <div className={`space-y-1 ${isCurrentUser ? 'order-first mr-2' : 'ml-0'}`}>
                                          {!isCurrentUser && !message.is_system_message && (
                                            <div className="flex items-center gap-1">
                                              <span className="text-xs font-medium">
                                                {isAi ? 'AI Assistant' : message.sender_name}
                                              </span>
                                              {message.sender_role && (
                                                <Badge variant="outline" className="text-[10px] py-0 px-1">
                                                  {message.sender_role}
                                                </Badge>
                                              )}
                                            </div>
                                          )}
                                          
                                          <div 
                                            className={`p-3 rounded-lg ${
                                              message.is_system_message 
                                                ? 'bg-muted text-muted-foreground text-xs italic' 
                                                : isCurrentUser
                                                  ? 'bg-primary text-primary-foreground'
                                                  : isAi
                                                    ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800'
                                                    : 'bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700'
                                            }`}
                                          >
                                            {message.message.startsWith('[FILE]') ? (
                                              <div>
                                                <div className="flex items-center gap-2 text-xs">
                                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file">
                                                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                                                    <polyline points="14 2 14 8 20 8"/>
                                                  </svg>
                                                  <a 
                                                    href={message.message.split(' - ')[1]} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="underline"
                                                  >
                                                    {message.message.split(' - ')[0].replace('[FILE] ', '')}
                                                  </a>
                                                </div>
                                              </div>
                                            ) : (
                                              <>
                                                <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                                                <p className="text-[10px] opacity-70 mt-1">
                                                  {formatChatMessageTime(message.created_at)}
                                                </p>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                            </CollapsibleMessageGroup>
                          );
                        })
                    ) : (
                      <div className="text-center text-muted-foreground">
                        No messages to display
                      </div>
                    )}
                  </div>
                )}
                
                {isAiResponding && (
                  <div className="flex items-center justify-center py-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background px-3 py-1.5 rounded-full border">
                      <Loader className="h-3 w-3 animate-spin" />
                      <span>AI is responding...</span>
                    </div>
                  </div>
                )}
                
                <div ref={endRef} />
              </ScrollArea>
              
              {showScrollButton && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="fixed bottom-20 right-4 h-8 w-8 rounded-full shadow-md z-10"
                  onClick={scrollToBottom}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              )}
              
              <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
                <ChatInput
                  value={newMessage}
                  onChange={setNewMessage}
                  onSend={handleSendMessage}
                  onFileSelect={handleFileSelect}
                  selectedFile={selectedFile}
                  onClearFile={() => setSelectedFile(null)}
                  isLoading={isUploading || isAiResponding}
                  uploadProgress={uploadProgress}
                />
              </div>
            </div>
          </>
        )}
        
        {!selectedRoomId && (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center space-y-2">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
              <h3 className="font-medium">No conversation selected</h3>
              <p className="text-sm text-muted-foreground">
                {userRole === 'patient'
                  ? "Connect with your care team to discuss your health"
                  : "Select a care team chat from the sidebar"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
