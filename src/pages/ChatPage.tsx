
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { UsersProvider } from "@/components/chat/UsersProvider";
import { ChatPageHeader } from "@/components/chat/ChatPageHeader";
import { CareTeamAIChat } from "@/components/chat/CareTeamAIChat";
import { Card, CardContent } from "@/components/ui/card";
import { DoctorChatInterface } from "@/components/chat/DoctorChatInterface";

const ChatPage = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="container mx-auto py-4 px-4 max-w-7xl flex-1 flex flex-col h-[calc(100vh-70px)] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full overflow-hidden">
          <Card className="h-full flex flex-col overflow-hidden">
            <CardContent className="p-0 h-full">
              {userRole === 'doctor' ? (
                <DoctorChatInterface />
              ) : (
                <UsersProvider>
                  {({ careTeamGroup, isLoading, error }) => (
                    <ChatPageHeader 
                      careTeamGroup={careTeamGroup}
                      isLoading={isLoading}
                      error={error}
                    />
                  )}
                </UsersProvider>
              )}
            </CardContent>
          </Card>
          
          <Card className="h-full flex flex-col overflow-hidden">
            <CardContent className="p-4 h-full flex flex-col overflow-hidden">
              <CareTeamAIChat />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
