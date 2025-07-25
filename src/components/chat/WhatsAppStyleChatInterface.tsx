import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CareTeamRoomsSelector } from "@/components/chat/CareTeamRoomsSelector";
import { ChatInput } from "@/components/chat/ChatInput";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { useIsMobile, useIsIPad } from "@/hooks/use-mobile";
import { Menu, ChevronLeft, UserCircle, Users, MessageCircle, Loader, AlertCircle, Search, ChevronDown, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SearchMessages } from "./SearchMessages";
import { generatePdfFromElement } from "@/utils/pdfUtils";
import { groupMessagesByDate, sortByDate, formatChatMessageTime, isToday } from "@/utils/dateUtils";
import { CollapsibleMessageGroup } from "./CollapsibleMessageGroup";
import { useChatScroll } from "@/hooks/useChatScroll";
import { useNavigate } from "react-router-dom";
import { useBreakpoint } from "@/hooks/use-responsive";

interface WhatsAppStyleChatInterfaceProps {
  patientRoomId?: string | null;
  fullScreen?: boolean;
}

export const WhatsAppStyleChatInterface = ({ patientRoomId, fullScreen = false }: WhatsAppStyleChatInterfaceProps) => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(patientRoomId || null);
  const [newMessage, setNewMessage] = useState("");
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [roomMembers, setRoomMembers] = useState<any[]>([]);
  const isMobile = useIsMobile();
  const isIPad = useIsIPad();
  const { isSmallScreen } = useBreakpoint();
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
  const [pendingPdfData, setPendingPdfData] = useState<null | any>(null);
  const [showAllMembers, setShowAllMembers] = useState(false);
  
  const messageGroups = groupMessagesByDate(localMessages);
  
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
        p_limit: null, // Setting to null to get all messages
        p_offset: 0,
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
      
      setLocalMessages(sortedData);
      
      // Since we're getting all messages, there are no more to paginate
      setHasMoreMessages(false);
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
      
      const { data: signedUrl, error: signedUrlError } = await supabase.storage
        .from('chat_attachments')
        .createSignedUrl(filePath, 60 * 60 * 24); // 24 hours expiration
        
      if (signedUrlError) {
        console.error("Error generating signed URL:", signedUrlError);
        toast({
          title: "URL Generation Error",
          description: "Could not generate download link. File uploaded but may not be accessible.",
          variant: "destructive"
        });
      }
      
      const downloadUrl = signedUrl?.signedUrl || '';
      
      const { data: messageData, error: messageError } = await supabase.rpc('send_room_message', {
        p_room_id: selectedRoomId,
        p_message: `[FILE] ${selectedFile.name} - ${downloadUrl}`,
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
        setPendingPdfData({ ...data.pdfData, date: data.pdfData.date });
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

  const handleDownloadPrescriptionPdf = async () => {
    if (!pendingPdfData) return;
    const pdfData = pendingPdfData;

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
  };

  const generateAndDownloadPdf = async (pdfData: any) => {
    if (!pdfData) return;
    
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = `
        <div id="prescription-pdf" class="p-8">
          <h1 class="text-2xl font-bold mb-6">Medical Prescription</h1>
          <div class="mb-4">
            <p><strong>Doctor:</strong> ${pdfData.doctorName || 'N/A'}</p>
            <p><strong>Date:</strong> ${pdfData.date || new Date().toLocaleDateString()}</p>
            <p><strong>Patient:</strong> ${pdfData.patientName || 'N/A'}</p>
          </div>
          <div class="mb-4">
            <h2 class="text-xl font-semibold mb-2">Diagnosis</h2>
            <p>${pdfData.diagnosis || 'N/A'}</p>
          </div>
          <div class="mb-4">
            <h2 class="text-xl font-semibold mb-2">Medications</h2>
            <p>${pdfData.medications || 'N/A'}</p>
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
        `prescription_${(pdfData.date || new Date().toLocaleDateString()).replace(/\//g, '-')}.pdf`
      );

      document.body.removeChild(tempDiv);
      
      toast({
        title: "PDF Generated",
        description: "Your prescription PDF has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadPdf = async (message: any) => {
    if (pendingPdfData) {
      generateAndDownloadPdf(pendingPdfData);
      return;
    }
    
    try {
      setIsAiResponding(true);
      toast({
        title: "Generating PDF",
        description: "We're generating your PDF, please wait a moment...",
      });
      
      const isPrescription = message.message.toLowerCase().includes("prescription");
      const isHealthPlan = message.message.toLowerCase().includes("health plan");
      const isMedicalReport = message.message.toLowerCase().includes("medical report");
      
      const requestType = isPrescription ? "prescription" : 
                         isHealthPlan ? "health_plan" : 
                         isMedicalReport ? "medical_report" : "prescription";
                         
      const { data, error } = await supabase.functions.invoke('doctor-ai-assistant', {
        body: { 
          messages: [{role: 'user', content: `Generate a ${requestType} PDF`}],
          patientId: user?.id,
          isCareTeamChat: true,
          requestType: 'pdf_request'
        },
      });

      if (error) throw error;
      
      if (data.pdfData) {
        setPendingPdfData(data.pdfData);
        generateAndDownloadPdf(data.pdfData);
      } else {
        throw new Error("No PDF data returned");
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "PDF Generation Failed",
        description: "Could not generate the PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAiResponding(false);
    }
  };

  return (
    <div className="h-full flex overflow-hidden rounded-md border-none shadow-none">
      {showSidebar && (
        <div className="w-72 border-r border-neutral-100 dark:border-neutral-800/50 flex flex-col bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm">
          <div className="p-3 border-b border-neutral-100 dark:border-neutral-800/50 flex items-center justify-between chat-header">
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
            <div className="p-3 border-b border-neutral-100 dark:border-neutral-800/50 flex items-center justify-between chat-header">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#7E69AB]" />
                  Care Team Members
                </h3>
                <span className="text-xs text-muted-foreground">
                  {roomMembers.length} members
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSearch(!showSearch)}
                  className="h-8 w-8 p-0"
                >
                  <Search className="h-4 w-4" />
                </Button>
                {isSmallScreen && roomMembers.length > 4 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllMembers(!showAllMembers)}
                    className="h-7 text-xs px-2"
                  >
                    {showAllMembers ? "Show Less" : "Show All"}
                  </Button>
                )}
              </div>
            </div>
            
            <div className={`${isSmallScreen ? 'overflow-x-auto' : 'flex flex-wrap'} gap-2 px-3 pb-2 pt-1 bg-white/20 dark:bg-neutral-900/20 backdrop-blur-sm`}>
              {/* Horizontal scrollable container for mobile */}
              <div className={`${isSmallScreen ? 'flex py-1 no-scrollbar' : 'flex flex-wrap'} gap-2`}>
                {roomMembers
                  .slice(0, isSmallScreen && !showAllMembers ? 8 : undefined)
                  .map((member) => {
                    const isPatient = member.role === "patient" && user?.id === member.id && userRole === "patient";
                    const avatarClass = 
                      member.role === 'doctor' ? 'doctor-avatar' :
                      member.role === 'nutritionist' ? 'nutritionist-avatar' :
                      member.role === 'aibot' ? 'ai-avatar' : 
                      'patient-avatar';
                    
                    const roleAbbr = member.role?.slice(0, 2).toUpperCase() || "??";
                    
                    return (
                      <div key={member.id} className="flex-shrink-0">
                        {isSmallScreen ? (
                          <div className="flex flex-col items-center">
                            {isPatient ? (
                              <button
                                onClick={() => navigate("/profile")}
                                type="button"
                                className="focus:outline-none rounded-full transition hover:scale-105"
                                title="View or edit profile"
                              >
                                <Avatar className={`h-8 w-8 ${avatarClass}`}>
                                  <AvatarFallback className="text-xs">
                                    {`${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`}
                                  </AvatarFallback>
                                </Avatar>
                              </button>
                            ) : (
                              <Avatar className={`h-8 w-8 ${avatarClass}`}>
                                <AvatarFallback className="text-xs">
                                  {member.role === 'aibot' ? 'AI' : 
                                    `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <span className="text-[10px] bg-background rounded-full px-1.5 py-0.5 mt-1 border text-center font-medium">
                              {roleAbbr}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {isPatient ? (
                              <button
                                onClick={() => navigate("/profile")}
                                type="button"
                                className="focus:outline-none rounded-full p-0.5 transition hover:scale-105"
                                title="View or edit profile"
                              >
                                <Avatar className={`h-6 w-6 ${avatarClass}`}>
                                  <AvatarFallback className="text-xs">
                                    {`${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`}
                                  </AvatarFallback>
                                </Avatar>
                              </button>
                            ) : (
                              <Avatar className={`h-6 w-6 ${avatarClass}`}>
                                <AvatarFallback className="text-xs">
                                  {member.role === 'aibot' ? 'AI' : 
                                    `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <span className="text-sm">
                              {member.first_name} {member.last_name}
                              <Badge variant="outline" className="ml-1 text-[10px] py-0 px-1">
                                {member.role}
                              </Badge>
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                {isSmallScreen && !showAllMembers && roomMembers.length > 8 && (
                  <div className="flex items-center justify-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowAllMembers(true)}
                      className="h-8 w-8 rounded-full p-0"
                    >
                      <span className="text-xs">+{roomMembers.length - 8}</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Add the CSS for no-scrollbar as a global class in globals.css,
                so we no longer need inline styles here */}
            
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
                          const isLatestGroup = index === array.length - 1; 
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
                                  const isPrescriptionMessage = isAi && typeof message.message === "string" &&
                                    (
                                      message.message.includes("prescription as a PDF") ||
                                      message.message.includes("Prescription PDF has been generated") ||
                                      message.message.includes("PDF has been generated") ||
                                      message.message.includes("ready for download")
                                    );
                                    
                                  const avatarClass = 
                                    message.sender_role === 'doctor' ? 'doctor-avatar' :
                                    message.sender_role === 'nutritionist' ? 'nutritionist-avatar' :
                                    isAi ? 'ai-avatar' : 
                                    'patient-avatar';
                                    
                                  const messageClass = 
                                    message.is_system_message ? "system-message" :
                                    isCurrentUser ? "current-user" :
                                    isAi ? "ai-message" :
                                    message.sender_role === 'doctor' ? "doctor-message" :
                                    message.sender_role === 'nutritionist' ? "nutritionist-message" :
                                    "";
                                    
                                  return (
                                    <div 
                                      key={message.id} 
                                      id={`message-${message.id}`}
                                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} my-2 bubble-in`}
                                    >
                                      <div className="flex items-start gap-2 max-w-[80%]">
                                        {!isCurrentUser && !message.is_system_message && (
                                          <Avatar className={`h-8 w-8 ${avatarClass}`}>
                                            {isAi ? (
                                              <AvatarFallback>
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
                                          <div className={`p-3  min-w-24 rounded-lg message-bubble ${messageClass}`}>
                                            {message.message.startsWith('[FILE]') ? (
                                              <div>
                                                <div className="flex items-center gap-2 text-xs">
                                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file">
                                                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                                                    <polyline points="14 2 14 8 20 8"/>
                                                  </svg>
                                                  {(() => {
                                                    const fileMsg = message.message.replace('[FILE] ', '');
                                                    const separatorIndex = fileMsg.lastIndexOf(' - ');
                                                    const fileName = separatorIndex > 0 
                                                      ? fileMsg.substring(0, separatorIndex) 
                                                      : fileMsg;
                                                    const fileUrl = separatorIndex > 0 
                                                      ? fileMsg.substring(separatorIndex + 3) 
                                                      : '';

                                                    return (
                                                      <a 
                                                        href={fileUrl}
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        download={fileName}
                                                        className="underline hover:text-primary"
                                                        onClick={(e) => {
                                                          if (!fileUrl || fileUrl.trim() === '') {
                                                            e.preventDefault();
                                                            toast({
                                                              title: "Download Error",
                                                              description: "The file link is no longer valid. Please ask the sender to share the file again.",
                                                              variant: "destructive"
                                                            });
                                                          }
                                                        }}
                                                      >
                                                        {fileName || "Attached file"}
                                                      </a>
                                                    );
                                                  })()}
                                                </div>
                                              </div>
                                            ) : (
                                              <>
                                                {isPrescriptionMessage && (
                                                  <div className="flex items-center mb-2">
                                                    <button
                                                      onClick={() => handleDownloadPdf(message)}
                                                      type="button"
                                                      className="flex items-center text-blue-600 hover:text-blue-700 hover:underline font-medium text-sm"
                                                      title="Download prescription PDF"
                                                    >
                                                      <span>Download Prescription</span>
                                                    </button>
                                                  </div>
                                                )}
                                                <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                                                <p className="text-[10px] opacity-70 mt-1 message-time">
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
                    <div className="ai-typing ml-10">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 ai-avatar">
                          <AvatarFallback className="text-xs">
                            AI
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center">
                          <div className="ai-typing-dot"></div>
                          <div className="ai-typing-dot"></div>
                          <div className="ai-typing-dot"></div>
                        </div>
                      </div>
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
              
              <div className="p-3 border-t border-neutral-100 dark:border-neutral-800/50">
                <ChatInput
                  value={newMessage}
                  onChange={setNewMessage}
                  onSend={handleSendMessage}
                  onFileSelect={handleFileSelect}
                  selectedFile={selectedFile}
                  onClearFile={() => setSelectedFile(null)}
                  isLoading={isUploading || isAiResponding}
                  uploadProgress={uploadProgress}
                  className="message-input"
                />
              </div>
            </div>
          </>
        )}
        
        {!selectedRoomId && (
          <div className="flex-1 flex items-center justify-center p-4 bg-white/20 dark:bg-neutral-900/20 backdrop-blur-sm">
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
