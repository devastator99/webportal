import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CareTeamRoomsSelector } from "@/components/chat/CareTeamRoomsSelector";
import { ChatMessagesList } from "@/components/chat/ChatMessagesList";
import { ChatInput } from "@/components/chat/ChatInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { useIsMobile, useIsIPad } from "@/hooks/use-mobile";
import { Menu, ChevronLeft, UserCircle, Users, MessageCircle, Loader, AlertCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { sortByDate, formatChatMessageTime } from "@/utils/dateUtils";
import { SearchMessages } from "./SearchMessages";
import { generatePdfFromElement } from "@/utils/pdfUtils";

interface WhatsAppStyleChatInterfaceProps {
  patientRoomId?: string | null;
}

interface CareTeamMember {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
}

interface DoctorData {
  first_name: string | null;
  last_name: string | null;
}

interface NutritionistData {
  first_name: string | null;
  last_name: string | null;
}

interface CareTeamInfo {
  doctor?: DoctorData | null;
  nutritionist?: NutritionistData | null;
  doctor_id?: string | null;
  nutritionist_id?: string | null;
}

export const WhatsAppStyleChatInterface = ({ patientRoomId }: WhatsAppStyleChatInterfaceProps) => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(patientRoomId || null);
  const [newMessage, setNewMessage] = useState("");
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [roomMembers, setRoomMembers] = useState<CareTeamMember[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const isIPad = useIsIPad();
  const [showSidebar, setShowSidebar] = useState(!isMobile && userRole !== 'patient');
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(isAiResponding);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);

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
    if (messagesEndRef.current && !isLoadingMessages) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [localMessages, isLoadingMessages]);

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

  const fetchMessages = async (roomId: string, pageNum: number) => {
    if (!roomId) return;
    
    try {
      setIsLoadingMessages(true);
      setRoomError(null);
      console.log(`Fetching messages for room ${roomId}, page ${pageNum}`);
      
      const { data, error } = await supabase.rpc('get_room_messages_with_role', {
        p_room_id: roomId,
        p_limit: 50,
        p_offset: (pageNum - 1) * 50,
        p_user_role: userRole || 'patient'
      });
      
      if (error) {
        console.error("Error fetching room messages:", error);
        setRoomError(`Failed to load messages: ${error.message}`);
        throw error;
      }
      
      console.log(`Fetched ${data?.length || 0} messages:`, data);
      
      if (data && data.length > 0) {
        if (pageNum === 1) {
          setLocalMessages(data);
        } else {
          setLocalMessages(prev => [...prev, ...data]);
        }
        setHasMoreMessages(data.length === 50);
      } else {
        if (pageNum === 1) {
          setLocalMessages([]);
        }
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      setRoomError("Could not load messages. Please try again.");
      toast({
        title: "Error",
        description: "Could not load messages",
        variant: "destructive"
      });
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const loadMoreMessages = () => {
    if (selectedRoomId && hasMoreMessages && !isLoadingMessages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMessages(selectedRoomId, nextPage);
    }
  };

  const triggerAiResponse = async (message: string, roomId: string) => {
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

      // Handle PDF generation if requested
      if (data.generatePdf && data.pdfType === 'prescription') {
        const { pdfData } = data;
        
        // Create a temporary div for PDF content
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
        
        // Generate and download PDF
        await generatePdfFromElement(
          'prescription-pdf',
          `prescription_${pdfData.date.replace(/\//g, '-')}.pdf`
        );
        
        // Clean up
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
      
      setLocalMessages(prev => [optimisticMessage, ...prev]);
      
      setNewMessage("");
      
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
      
      fetchMessages(selectedRoomId, 1);
      
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

      // Handle PDF generation if requested
      if (data.generatePdf && data.pdfType === 'prescription') {
        const { pdfData } = data;
        
        // Create a temporary div for PDF content
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
        
        // Generate and download PDF
        await generatePdfFromElement(
          'prescription-pdf',
          `prescription_${pdfData.date.replace(/\//g, '-')}.pdf`
        );
        
        // Clean up
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
              
              <ScrollArea className="flex-1 p-4">
                {hasMoreMessages && !isLoadingMessages && localMessages.length > 0 && (
                  <div className="flex justify-center mb-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={loadMoreMessages}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Load more messages
                    </Button>
                  </div>
                )}
                
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
                  <div className="space-y-4 flex flex-col-reverse">
                    {sortByDate(localMessages, 'created_at', false)
                      .map((message, i) => {
                        const isCurrentUser = message.sender_id === user?.id;
                        const isAi = message.is_ai_message || message.sender_id === '00000000-0000-0000-0000-000000000000';
                        
                        return (
                          <div 
                            key={message.id} 
                            id={`message-${message.id}`}
                            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
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
                    <div ref={messagesEndRef} />
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
              </ScrollArea>
              
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
