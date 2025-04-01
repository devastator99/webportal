
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { TabsContent } from "@/components/ui/tabs";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { AiChatInterface } from "@/components/chat/AiChatInterface";
import { UserProfile, CareTeamGroup } from "./UsersProvider";

interface ChatPageContentProps {
  selectedTab: string;
  assignedUsers: UserProfile[];
  careTeamGroup: CareTeamGroup | null;
  isLoading: boolean;
  error: unknown;
}

export const ChatPageContent = ({
  selectedTab,
  assignedUsers,
  careTeamGroup,
  isLoading,
  error
}: ChatPageContentProps) => {
  
  // Helper to render the appropriate content based on loading state
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

  return (
    <>
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
    </>
  );
};
