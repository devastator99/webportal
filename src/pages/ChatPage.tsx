
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { UsersProvider } from "@/components/chat/UsersProvider";
import { ChatPageHeader } from "@/components/chat/ChatPageHeader";
import { Card, CardContent } from "@/components/ui/card";

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
        <Card className="h-full flex flex-col overflow-hidden">
          <CardContent className="p-0 h-full">
            <UsersProvider>
              {({ careTeamGroup, assignedUsers, isLoading, error }) => (
                <ChatPageHeader 
                  careTeamGroup={careTeamGroup}
                  assignedUsers={assignedUsers}
                  isLoading={isLoading}
                  error={error}
                  userRole={userRole}
                />
              )}
            </UsersProvider>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChatPage;
