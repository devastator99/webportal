
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { UsersProvider } from "@/components/chat/UsersProvider";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { MessageSquare, Users } from "lucide-react";
import { ChatRoomInterface } from "@/components/chat/ChatRoomInterface";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
          <CardHeader className="pb-0">
            <Tabs defaultValue="care-team">
              <TabsList>
                <TabsTrigger value="care-team">
                  <Users className="h-4 w-4 mr-2" />
                  Care Team Rooms
                </TabsTrigger>
                <TabsTrigger value="direct">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Direct Messages
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="care-team" className="h-[calc(100vh-165px)] mt-2">
                <ErrorBoundary>
                  <ChatRoomInterface />
                </ErrorBoundary>
              </TabsContent>
              
              <TabsContent value="direct" className="h-[calc(100vh-165px)] mt-2">
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
                            showGroupChat={true} // Enable group chat for everyone to ensure access to all messages
                            whatsAppStyle={userRole === "doctor" || userRole === "nutritionist"}
                            includeAiBot={true} // Ensure AI bot is included for all users
                          />
                        )}
                      </div>
                    )}
                  </UsersProvider>
                </ErrorBoundary>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default ChatPage;
