
import { Loader2, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ChatInterface } from "./ChatInterface";
import { UsersList } from "./UsersList";
import { CareTeamGroup, UserProfile } from "./UsersProvider";

interface ChatPageHeaderProps {
  careTeamGroup: CareTeamGroup | null;
  assignedUsers: UserProfile[];
  isLoading: boolean;
  error: unknown;
  userRole?: string;
}

export const ChatPageHeader = ({
  careTeamGroup,
  assignedUsers,
  isLoading,
  error,
  userRole
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

  const title = userRole === "doctor" || userRole === "nutritionist" 
    ? "Patient Messages" 
    : "Care Team Chat";

  return (
    <div className="space-y-6 w-full h-full">
      <h2 className="text-2xl font-bold text-center p-4">{title}</h2>
      
      {userRole === "doctor" || userRole === "nutritionist" ? (
        // Healthcare provider view - show all assigned patients in a chat interface
        <ChatInterface 
          assignedUsers={assignedUsers}
          showGroupChat={false}
        />
      ) : careTeamGroup ? (
        // Patient view - show care team chat
        <div className="grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-1 gap-6 h-full">
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
          {userRole === "doctor" || userRole === "nutritionist" ? 
            "No patients are currently assigned to you." :
            "No care team is currently assigned to you. Please contact the clinic to set up your care team."
          }
        </div>
      )}
    </div>
  );
};
