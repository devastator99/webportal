
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, MessageSquare, Users } from "lucide-react";

interface ChatPageHeaderProps {
  selectedTab: string;
  onTabChange: (value: string) => void;
}

export const ChatPageHeader = ({ selectedTab, onTabChange }: ChatPageHeaderProps) => {
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
    </Tabs>
  );
};
