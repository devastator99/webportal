
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { UsersProvider } from "@/components/chat/UsersProvider";
import { ChatPageHeader } from "@/components/chat/ChatPageHeader";

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
    </>
  );
};

export default ChatPage;
