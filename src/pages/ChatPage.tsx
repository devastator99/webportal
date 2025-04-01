
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { UsersProvider } from "@/components/chat/UsersProvider";
import { ChatPageHeader } from "@/components/chat/ChatPageHeader";

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
        <UsersProvider>
          {({ assignedUsers, careTeamGroup, isLoading, error }) => (
            <ChatPageHeader 
              selectedTab={selectedTab} 
              onTabChange={setSelectedTab}
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
