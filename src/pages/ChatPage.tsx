
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { UsersProvider } from "@/components/chat/UsersProvider";
import { ChatPageHeader } from "@/components/chat/ChatPageHeader";
import { CareTeamAIChat } from "@/components/chat/CareTeamAIChat";
import { Card, CardContent } from "@/components/ui/card";

const ChatPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  return (
    <>
      <Navbar />
      <div className="container mx-auto py-8 px-4 max-w-7xl h-[calc(100vh-70px)] flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-grow h-full overflow-hidden">
          <div className="h-full overflow-hidden">
            <UsersProvider>
              {({ careTeamGroup, isLoading, error }) => (
                <ChatPageHeader 
                  careTeamGroup={careTeamGroup}
                  isLoading={isLoading}
                  error={error}
                />
              )}
            </UsersProvider>
          </div>
          
          <div className="h-full overflow-hidden">
            <Card className="h-full flex flex-col overflow-hidden">
              <CardContent className="p-4 h-full flex flex-col overflow-hidden">
                <CareTeamAIChat />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatPage;
