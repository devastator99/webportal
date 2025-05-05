
import { useState } from "react";
import { UserProfile } from "./UsersProvider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useBreakpoint } from "@/hooks/use-responsive";

interface UsersListProps {
  users: UserProfile[];
  selectedUser: UserProfile | null;
  onUserSelect: (user: UserProfile) => void;
  disableSelection?: boolean;
  compact?: boolean;
}

export const UsersList = ({
  users,
  selectedUser,
  onUserSelect,
  disableSelection = false,
  compact = false
}: UsersListProps) => {
  const { isSmallScreen } = useBreakpoint();
  
  if (!users || users.length === 0) {
    return <div className="text-muted-foreground text-center py-2 text-sm">No users available</div>;
  }

  const getInitials = (user: UserProfile) => {
    const first = user.first_name?.charAt(0) || "";
    const last = user.last_name?.charAt(0) || "";
    return (first + last).toUpperCase();
  };

  const getUserRole = (user: UserProfile) => {
    if (user.role) return user.role;
    if (user.user_role?.role) return user.user_role.role;
    return "";
  };

  const getAvatarColor = (role?: string) => {
    if (!role) return "bg-gray-200";
    
    switch(role.toLowerCase()) {
      case 'doctor':
        return "bg-blue-100 text-blue-700";
      case 'nutritionist':
        return "bg-green-100 text-green-700";
      case 'patient':
        return "bg-purple-100 text-purple-700";
      case 'administrator':
        return "bg-amber-100 text-amber-700";
      case 'aibot':
        return "bg-cyan-100 text-cyan-700";
      default:
        return "bg-gray-200";
    }
  };

  // For compact mobile view, show avatars with role badge
  const useCompactView = compact || isSmallScreen;

  return (
    <ul className={cn(
      useCompactView ? "flex flex-row flex-nowrap overflow-x-auto gap-1.5 py-1 no-scrollbar" : "space-y-1"
    )}>
      {users.map((user) => {
        const isSelected = selectedUser?.id === user.id;
        const role = getUserRole(user);
        const initials = getInitials(user);
        const roleAbbr = role.slice(0, 2).toUpperCase();

        return (
          <li key={user.id} className={useCompactView ? "flex-shrink-0 relative" : "w-full"}>
            <button
              onClick={() => !disableSelection && onUserSelect(user)}
              disabled={disableSelection}
              className={cn(
                "flex items-center gap-1.5 rounded-md transition-colors",
                useCompactView 
                  ? "p-0.5 flex-col" 
                  : "p-2 w-full",
                isSelected 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "hover:bg-muted",
                disableSelection 
                  ? "cursor-default" 
                  : "cursor-pointer"
              )}
            >
              <Avatar className={useCompactView ? "h-8 w-8" : "h-8 w-8"}>
                <AvatarFallback className={getAvatarColor(role)}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              {useCompactView ? (
                <span className="text-[10px] bg-background rounded-full px-1.5 py-0.5 mt-1 border text-center font-medium">
                  {roleAbbr}
                </span>
              ) : (
                <div className="text-left">
                  <p className="text-sm font-medium">
                    {user.first_name} {user.last_name}
                  </p>
                  {role && (
                    <p className="text-xs text-muted-foreground capitalize">
                      {role}
                    </p>
                  )}
                </div>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
};
