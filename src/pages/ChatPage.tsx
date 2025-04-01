
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { UsersProvider } from "@/components/chat/UsersProvider";
import { ChatPageHeader } from "@/components/chat/ChatPageHeader";
import { ChatPageContent } from "@/components/chat/ChatPageContent";

const ChatPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<string>("messages");
  
  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  return (
    <>
      <Navbar />
      <div className="container mx-auto pt-20 pb-6 px-6">
        <ChatPageHeader 
          selectedTab={selectedTab} 
          onTabChange={setSelectedTab} 
        />
        
        <UsersProvider>
          {({ assignedUsers, careTeamGroup, isLoading, error }) => (
            <ChatPageContent
              selectedTab={selectedTab}
              assignedUsers={assignedUsers}
              careTeamGroup={careTeamGroup}
              isLoading={isLoading}
              error={error}
            />
          )}
        </UsersProvider>
      </div>
    </>
  );
};

export default ChatPage;
