
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { UsersProvider } from "@/components/chat/UsersProvider";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

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
            <ErrorBoundary>
              <UsersProvider>
                {({ careTeamGroup, assignedUsers, isLoading, error }) => (
                  <div className="w-full h-full">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                      </div>
                    ) : error ? (
                      <div className="text-center py-12 text-red-500">
                        Error loading chat data. Please try again later.
                      </div>
                    ) : (
                      <ChatInterface 
                        assignedUsers={assignedUsers}
                        careTeamGroup={careTeamGroup}
                        showGroupChat={userRole !== "doctor" && userRole !== "nutritionist"}
                        whatsAppStyle={true}
                      />
                    )}
                  </div>
                )}
              </UsersProvider>
            </ErrorBoundary>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChatPage;
