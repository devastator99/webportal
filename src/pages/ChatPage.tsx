
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { UsersProvider } from "@/components/chat/UsersProvider";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { MessageSquare } from "lucide-react";

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
    <div className="flex flex-col min-h-screen pt-16 md:pt-20">
      <div className="container mx-auto py-4 px-4 max-w-7xl flex-1 flex flex-col h-[calc(100vh-70px)] overflow-hidden">
        <Card className="h-full flex flex-col overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Care Team Chat
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-full flex-1 overflow-hidden">
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
                        whatsAppStyle={userRole === "doctor" || userRole === "nutritionist"}
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
