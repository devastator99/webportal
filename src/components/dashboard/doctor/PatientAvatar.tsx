
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface PatientAvatarProps {
  firstName: string;
  lastName: string;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  isActive?: boolean;
}

export const PatientAvatar = ({
  firstName,
  lastName,
  size = "md",
  onClick,
  isActive = false,
}: PatientAvatarProps) => {
  const getInitials = (first: string, last: string) => {
    return `${(first || '').charAt(0)}${(last || '').charAt(0)}`.toUpperCase();
  };

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-base"
  };

  return (
    <Avatar 
      className={`${sizeClasses[size]} ${onClick ? 'cursor-pointer' : ''} ${
        isActive ? 'ring-2 ring-primary ring-offset-2' : ''
      } transition-all hover:scale-105`}
      onClick={onClick}
    >
      <AvatarFallback className="bg-primary/10 text-primary font-medium">
        {getInitials(firstName, lastName)}
      </AvatarFallback>
    </Avatar>
  );
};
