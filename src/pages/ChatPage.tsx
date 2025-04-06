
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

  // Helper function to check if user is a healthcare provider
  const isHealthcareProvider = () => {
    return userRole === "doctor" || userRole === "nutritionist";
  };

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
                    ) : isHealthcareProvider() ? (
                      <ChatInterface 
                        assignedUsers={assignedUsers}
                        showGroupChat={false}
                        whatsAppStyle={true}
                      />
                    ) : careTeamGroup ? (
                      <ChatInterface 
                        careTeamGroup={careTeamGroup} 
                        showGroupChat={true} 
                      />
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        {isHealthcareProvider() ? 
                          "No patients are currently assigned to you." :
                          "No care team is currently assigned to you. Please contact the clinic to set up your care team."
                        }
                      </div>
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
