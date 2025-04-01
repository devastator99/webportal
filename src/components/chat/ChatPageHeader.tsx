
import { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, MessageSquare, Users } from "lucide-react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { AiChatInterface } from "@/components/chat/AiChatInterface";
import { UserProfile, CareTeamGroup } from "./UsersProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatPageHeaderProps {
  selectedTab: string;
  onTabChange: (value: string) => void;
  assignedUsers?: UserProfile[];
  careTeamGroup?: CareTeamGroup | null;
  isLoading?: boolean;
  error?: unknown;
}

export const ChatPageHeader = ({ 
  selectedTab, 
  onTabChange,
  assignedUsers = [],
  careTeamGroup = null,
  isLoading = false,
  error = null
}: ChatPageHeaderProps) => {
  // Helper to render the appropriate content based on loading state
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-6">
          <Skeleton className="h-[600px] w-full rounded-lg" />
        </div>
      );
    }

    if (error) {
      return (
        <Alert>
          <AlertDescription>
            There was an error loading your contacts. Please refresh the page and try again.
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  return (
    <Tabs value={selectedTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-4">
        <TabsTrigger value="group">
          <Users className="mr-2 h-4 w-4" />
          Care Team
        </TabsTrigger>
        <TabsTrigger value="messages">
          <MessageSquare className="mr-2 h-4 w-4" />
          Messages
        </TabsTrigger>
        <TabsTrigger value="ai">
          <Brain className="mr-2 h-4 w-4" />
          AI Assistant
        </TabsTrigger>
      </TabsList>

      {renderContent()}
      
      <TabsContent value="group" className="space-y-4">
        <ChatInterface 
          assignedUsers={assignedUsers} 
          careTeamGroup={careTeamGroup}
          showGroupChat={true}
        />
      </TabsContent>
      
      <TabsContent value="messages" className="space-y-4">
        <ChatInterface assignedUsers={assignedUsers} />
      </TabsContent>
      
      <TabsContent value="ai" className="space-y-4">
        <AiChatInterface />
      </TabsContent>
    </Tabs>
  );
};
