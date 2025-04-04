
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
      <div className="container mx-auto py-16 px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
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
          
          <div>
            <Card className="h-full">
              <CardContent className="p-4 h-full">
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
