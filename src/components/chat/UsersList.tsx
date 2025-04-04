
import { useState } from "react";
import { UserProfile } from "./UsersProvider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UsersListProps {
  users: UserProfile[];
  selectedUser: UserProfile | null;
  onUserSelect: (user: UserProfile) => void;
  disableSelection?: boolean;
}

export const UsersList = ({
  users,
  selectedUser,
  onUserSelect,
  disableSelection = false
}: UsersListProps) => {
  if (!users || users.length === 0) {
    return <div className="text-muted-foreground text-center py-4">No users available</div>;
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

  return (
    <ul className="space-y-2">
      {users.map((user) => {
        const isSelected = selectedUser?.id === user.id;
        const role = getUserRole(user);

        return (
          <li key={user.id}>
            <button
              onClick={() => !disableSelection && onUserSelect(user)}
              disabled={disableSelection}
              className={cn(
                "w-full flex items-center gap-3 p-2 rounded-md transition-colors",
                isSelected 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "hover:bg-muted",
                disableSelection 
                  ? "cursor-default" 
                  : "cursor-pointer"
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className={getAvatarColor(role)}>
                  {getInitials(user)}
                </AvatarFallback>
              </Avatar>
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
            </button>
          </li>
        );
      })}
    </ul>
  );
};
