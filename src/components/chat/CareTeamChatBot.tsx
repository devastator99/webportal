
import { useAuth } from "@/contexts/AuthContext";
import { AiChatInterface } from "./AiChatInterface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot } from "lucide-react";

export const CareTeamChatBot = () => {
  const { user } = useAuth();
  
  if (!user) {
    return null;
  }
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-500" />
          AI Care Assistant
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AiChatInterface isCareTeamChat={true} />
      </CardContent>
    </Card>
  );
};
