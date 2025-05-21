
import React from "react";
import { TeamMember } from "@/types/chat";
import { cn } from "@/lib/utils";

interface CareTeamMembersListProps {
  members: TeamMember[];
}

export const CareTeamMembersList: React.FC<CareTeamMembersListProps> = ({ members }) => {
  if (!members || members.length === 0) {
    return <div className="text-muted-foreground text-sm">No team members</div>;
  }

  // Get the initials from a name
  const getInitials = (firstName: string, lastName: string) => {
    const firstInitial = firstName?.charAt(0) || '';
    const lastInitial = lastName?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase();
  };

  // Get avatar background color based on role
  const getAvatarClass = (role: string) => {
    switch (role.toLowerCase()) {
      case 'doctor':
        return 'bg-blue-100 text-blue-800';
      case 'nutritionist':
        return 'bg-green-100 text-green-800';
      case 'patient':
        return 'bg-orange-100 text-orange-800';
      case 'aibot':
      case 'assistant':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get role badge style
  const getRoleBadgeClass = (role: string) => {
    switch (role.toLowerCase()) {
      case 'doctor':
        return 'bg-blue-50 text-blue-700';
      case 'nutritionist':
        return 'bg-green-50 text-green-700';
      case 'patient':
        return 'bg-orange-50 text-orange-700';
      case 'aibot':
        return 'bg-purple-50 text-purple-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="space-y-2 mt-3">
      <div className="flex items-center gap-2">
        <div className="text-sm font-medium">Care Team Members</div>
        <div className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800">
          {members.length} members
        </div>
      </div>
      
      <div className="space-y-3">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium",
              getAvatarClass(member.role)
            )}>
              {getInitials(member.first_name, member.last_name)}
            </div>
            <div className="flex-1">
              <div className="font-medium">{member.first_name} {member.last_name}</div>
              <div className="inline-flex px-2 py-0.5 text-xs rounded-full whitespace-nowrap"
                style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}>
                {member.role}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
