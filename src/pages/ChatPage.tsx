
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
  const { data: assignedUsers } = useQuery({
    queryKey: ["assigned_users", user?.id, userRole],
    queryFn: async () => {
      if (!user?.id) return [];
      
      try {
        if (userRole === "patient") {
          // Get assigned doctor and nutritionist for this patient
          const { data, error } = await supabase.rpc('get_patient_care_team', {
            p_patient_id: user.id
          });
          
          if (error) throw error;
          return data || [];
        } else if (userRole === "doctor" || userRole === "nutritionist") {
          // Get assigned patients for this doctor/nutritionist
          const { data, error } = await supabase.rpc('get_assigned_patients', {
            p_provider_id: user.id,
            p_provider_role: userRole
          });
          
          if (error) throw error;
          return data || [];
        } else if (userRole === "administrator") {
          // Admin can chat with everyone
          const { data, error } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, user_role:user_roles(role)")
            .neq("id", user.id);
          
          if (error) throw error;
          return data || [];
        }
        return [];
      } catch (error) {
        console.error("Error fetching assigned users:", error);
        return [];
      }
    },
    enabled: !!user?.id && !!userRole
  });

  return (
    <>
      <Navbar />
      <div className="container mx-auto pt-20 pb-6 px-6">
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
      </div>
    </>
  );
};

export default ChatPage;
