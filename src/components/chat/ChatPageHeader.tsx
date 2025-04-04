
import { Loader2, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ChatInterface } from "./ChatInterface";
import { UsersList } from "./UsersList";
import { CareTeamGroup } from "./UsersProvider";

interface ChatPageHeaderProps {
  careTeamGroup: CareTeamGroup | null;
  isLoading: boolean;
  error: unknown;
}

export const ChatPageHeader = ({
  careTeamGroup,
  isLoading,
  error
}: ChatPageHeaderProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        Error loading chat data. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <h2 className="text-2xl font-bold text-center mb-6">Care Team Chat</h2>
      
      {careTeamGroup ? (
        <div className="grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-1 gap-6">
          <Card className="lg:col-span-1 md:col-span-1 sm:col-span-1">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    {careTeamGroup.groupName}
                  </h3>
                  <UsersList
                    users={careTeamGroup.members}
                    selectedUser={null}
                    onUserSelect={() => {}}
                    disableSelection
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="lg:col-span-3 md:col-span-2 sm:col-span-1">
            <CardContent className="p-4">
              <ChatInterface 
                careTeamGroup={careTeamGroup} 
                showGroupChat={true} 
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No care team is currently assigned to you.
          <br />
          Please contact the clinic to set up your care team.
        </div>
      )}
    </div>
  );
};
