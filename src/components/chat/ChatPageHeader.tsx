
import { Loader2, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ChatInterface } from "./ChatInterface";
import { UsersList } from "./UsersList";
import { CareTeamGroup, UserProfile } from "./UsersProvider";
import { useBreakpoint } from "@/hooks/use-responsive";

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
  const { isSmallScreen, isMediumScreen } = useBreakpoint();
  
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

  const title = "Care Team Chat";
  const isCompactView = isSmallScreen;

  return (
    <div className="space-y-2 w-full h-full">
      {!isCompactView && <h2 className="text-2xl font-bold text-center p-2">{title}</h2>}
      
      {userRole === "doctor" || userRole === "nutritionist" ? (
        // Healthcare provider view - WhatsApp-like interface showing all patient messages
        <Card className="h-full">
          <CardContent className="p-2 h-full">
            <ChatInterface 
              assignedUsers={assignedUsers}
              showGroupChat={true}
              whatsAppStyle={true}
              careTeamGroup={careTeamGroup}
            />
          </CardContent>
        </Card>
      ) : careTeamGroup ? (
        // Patient view - show care team chat with compact user list
        <div className={cn(
          "grid gap-2 h-full",
          isCompactView ? "grid-rows-[auto_1fr]" : "lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-1 gap-4"
        )}>
          <Card className={cn(
            isCompactView ? "row-span-1" : "lg:col-span-1 md:col-span-1 sm:col-span-1"
          )}>
            <CardContent className="p-0.5 sm:p-1">
              <div className="space-y-0.5">
                <div>
                  <div className="flex items-center justify-between mb-0.5 px-1">
                    <h3 className="text-xs font-medium flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {isCompactView ? `Team (${careTeamGroup.members.length})` : 'Care Team'}
                    </h3>
                  </div>
                  <UsersList
                    users={careTeamGroup.members}
                    selectedUser={null}
                    onUserSelect={() => {}}
                    disableSelection
                    compact={true}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={cn(
            isCompactView ? "row-span-1" : "lg:col-span-3 md:col-span-2 sm:col-span-1"
          )}>
            <CardContent className="p-1 sm:p-2">
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

// Helper function since we need cn here
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
