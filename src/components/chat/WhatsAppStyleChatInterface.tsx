
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CareTeamRoomsSelector } from "@/components/chat/CareTeamRoomsSelector";
import { ChatMessagesList } from "@/components/chat/ChatMessagesList";
import { ChatInput } from "@/components/chat/ChatInput";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { useIsMobile, useIsIPad } from "@/hooks/use-mobile";
import { Menu, ChevronLeft, UserCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export const WhatsAppStyleChatInterface = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [roomMembers, setRoomMembers] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const isIPad = useIsIPad();
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  
  const toggleSidebar = () => {
    setShowSidebar(prev => !prev);
  };

  // When a room is selected, fetch room members
  useEffect(() => {
    setLocalMessages([]);
    if (selectedRoomId) {
      fetchRoomMembers(selectedRoomId);
    }
  }, [selectedRoomId]);

  const fetchRoomMembers = async (roomId: string) => {
    if (!roomId) return;
    
    try {
      setIsLoadingMembers(true);
      const { data, error } = await supabase
        .from('room_members')
        .select(`
          id,
          role,
          user_id,
          profiles:user_id(
            first_name,
            last_name
          )
        `)
        .eq('room_id', roomId);
        
      if (error) throw error;
      
      // Format member data
      const formattedMembers = data.map(member => ({
        id: member.user_id,
        first_name: member.profiles?.first_name || "User",
        last_name: member.profiles?.last_name || "",
        role: member.role || "member"
      }));
      
      setRoomMembers(formattedMembers);
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

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoomId || !user?.id) return;
    
    try {
      // Create temporary message for immediate display
      const tempMessage = {
        id: uuidv4(),
        message: newMessage,
        created_at: new Date().toISOString(),
        sender: {
          id: user.id,
          first_name: user.user_metadata?.first_name || (userRole === "doctor" ? "Doctor" : "Provider"),
          last_name: user.user_metadata?.last_name || "",
          role: userRole
        }
      };
      
      setLocalMessages(prev => [...prev, tempMessage]);
      
      // Send message to the room
      const { data, error } = await supabase.rpc('send_room_message', {
        p_room_id: selectedRoomId,
        p_message: newMessage
      });
      
      if (error) throw error;
      
      setNewMessage("");
      
      // Invalidate queries to refresh the messages
      queryClient.invalidateQueries({ 
        queryKey: ["room_messages", selectedRoomId] 
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error sending message",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  // Get selected room details
  const { data: roomDetails, isLoading: isLoadingRoomDetails } = useQuery({
    queryKey: ["room_details", selectedRoomId],
    queryFn: async () => {
      if (!selectedRoomId) return null;
      
      try {
        const { data, error } = await supabase
          .from('chat_rooms')
          .select(`
            id,
            name,
            description,
            patient_id,
            profiles:patient_id(
              first_name,
              last_name
            )
          `)
          .eq('id', selectedRoomId)
          .single();
          
        if (error) throw error;
        
        return data;
      } catch (error) {
        console.error("Error fetching room details:", error);
        return null;
      }
    },
    enabled: !!selectedRoomId
  });

  const showChatOnly = isMobile && selectedRoomId && !showSidebar;
  const showSidebarOnly = isMobile && showSidebar;

  return (
    <ErrorBoundary>
      <Card className="h-[calc(100vh-96px)] flex flex-col border shadow-lg">
        <CardContent className="p-0 flex flex-1 overflow-hidden">
          {/* Sidebar with Care Team Rooms */}
          {(showSidebar || showSidebarOnly) && (
            <div className={`${showSidebarOnly ? 'w-full' : (isIPad ? 'w-2/5' : 'w-1/4')} border-r h-full bg-background`}>
              <CareTeamRoomsSelector 
                selectedRoomId={selectedRoomId} 
                onSelectRoom={(roomId) => {
                  setSelectedRoomId(roomId);
                  if (isMobile) {
                    setShowSidebar(false);
                  }
                }} 
              />
            </div>
          )}
          
          {/* Chat Area */}
          {(!showSidebarOnly) && (
            <div className="flex-1 flex flex-col h-full relative">
              {selectedRoomId ? (
                <>
                  <div className="p-3 bg-muted/40 border-b flex items-center gap-3">
                    {(isMobile || isIPad) && !showSidebar && (
                      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-1">
                        <Menu className="h-5 w-5" />
                      </Button>
                    )}
                    
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {roomDetails?.name?.substring(0, 2).toUpperCase() || "CT"}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="font-medium">
                        {isLoadingRoomDetails ? (
                          <Skeleton className="h-5 w-40" />
                        ) : (
                          roomDetails?.name || 'Care Team Chat'
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {isLoadingMembers ? (
                          <Skeleton className="h-4 w-24" />
                        ) : (
                          `${roomMembers.length} members`
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-auto"
                      onClick={() => {
                        toast({
                          title: "Members",
                          description: roomMembers.map(m => `${m.first_name} ${m.last_name} (${m.role})`).join(', '),
                          duration: 5000,
                        });
                      }}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Members
                    </Button>
                  </div>
                  
                  <div className="flex-1 flex flex-col h-full bg-[#f0f2f5] dark:bg-slate-900 overflow-hidden">
                    {isLoadingMembers ? (
                      <div className="flex-1 space-y-4 p-4">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                            <Skeleton className={`h-16 w-3/4 rounded-lg ${i % 2 === 0 ? 'bg-primary/5' : 'bg-muted'}`} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <ChatMessagesList
                        roomId={selectedRoomId}
                        localMessages={localMessages}
                        careTeamMembers={roomMembers}
                        useRoomMessages={true}
                      />
                    )}
                    
                    <div className="p-3 bg-background border-t">
                      <ChatInput
                        value={newMessage}
                        onChange={setNewMessage}
                        onSend={handleSendMessage}
                        placeholder="Type a message..."
                        disabled={!selectedRoomId || isLoadingMembers}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/60" />
                    <p className="text-lg">Select a care team chat</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Choose a room from the sidebar to start chatting
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
};
