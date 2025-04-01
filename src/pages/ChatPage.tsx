
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { AiChatInterface } from "@/components/chat/AiChatInterface";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, MessageSquare } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role?: string;
  user_role?: { role: string } | null;
}

const ChatPage = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<string>("messages");
  
  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // Get assigned users based on role
  const { data: assignedUsers, isLoading, error } = useQuery({
    queryKey: ["assigned_users", user?.id, userRole],
    queryFn: async () => {
      if (!user?.id) return [];
      
      try {
        if (userRole === "patient") {
          // Get assigned doctor and nutritionist for this patient
          const { data, error } = await (supabase.rpc as any)("get_patient_care_team", {
            p_patient_id: user.id
          });
          
          if (error) throw error;
          return (data || []) as UserProfile[];
        } else if (userRole === "doctor" || userRole === "nutritionist") {
          // Get assigned patients for this doctor/nutritionist
          const { data, error } = await (supabase.rpc as any)("get_assigned_patients", {
            p_provider_id: user.id,
            p_provider_role: userRole
          });
          
          if (error) throw error;
          return (data || []) as UserProfile[];
        } else if (userRole === "administrator") {
          // Admin can chat with everyone
          const { data, error } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, user_role:user_roles(role)")
            .neq("id", user.id);
          
          if (error) throw error;
          return data as UserProfile[];
        }
        return [] as UserProfile[];
      } catch (error) {
        console.error("Error fetching assigned users:", error);
        return [] as UserProfile[];
      }
    },
    enabled: !!user?.id && !!userRole
  });

  // Helper to render the appropriate content based on loading state
  const renderContent = () => {
    if (isLoading) {
      return <div className="space-y-6">
        <Skeleton className="h-[600px] w-full rounded-lg" />
      </div>;
    }

    if (error) {
      return <Alert>
        <AlertDescription>
          There was an error loading your contacts. Please refresh the page and try again.
        </AlertDescription>
      </Alert>;
    }

    return (
      <Tabs defaultValue={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="messages">
            <MessageSquare className="mr-2 h-4 w-4" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Brain className="mr-2 h-4 w-4" />
            AI Assistant
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="messages" className="space-y-4">
          <ChatInterface assignedUsers={assignedUsers || []} />
        </TabsContent>
        
        <TabsContent value="ai" className="space-y-4">
          <AiChatInterface />
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto pt-20 pb-6 px-6">
        {renderContent()}
      </div>
    </>
  );
};

export default ChatPage;
