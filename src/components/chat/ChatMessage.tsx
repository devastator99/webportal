
import { formatDistanceToNow } from "date-fns";
import { Check, Clock } from "lucide-react";

interface ChatMessageProps {
  message: {
    id: string;
    message: string;
    created_at: string;
    read?: boolean;
    sender: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      role?: string;
    };
    synced?: boolean;
  };
  isCurrentUser: boolean;
  showSender?: boolean;
  offlineMode?: boolean;
}

export const ChatMessage = ({ 
  message, 
  isCurrentUser, 
  showSender = false, 
  offlineMode = false 
}: ChatMessageProps) => {
  const senderName = message.sender.first_name || message.sender.last_name 
    ? `${message.sender.first_name || ''} ${message.sender.last_name || ''}`.trim()
    : 'Unknown User';

  // AI bot has a special ID and role
  const isAiSender = message.sender.id === '00000000-0000-0000-0000-000000000000' || 
                    message.sender.role === 'aibot';
  
  // Nutritionist/Dietician role check
  const isDieticianSender = message.sender.role === 'nutritionist';

  const renderReadStatus = () => {
    if (!isCurrentUser) return null;
    
    if (offlineMode) {
      return (
        <span className="ml-1 text-yellow-500" title="Will be delivered when online">
          <Clock className="h-3 w-3" />
        </span>
      );
    } else if (isDieticianSender) {
      return (
        <span className="ml-1 inline-flex">
          <Check className="h-3 w-3" />
          <Check className="h-3 w-3 -ml-1" />
        </span>
      );
    } else if (isAiSender) {
      return (
        <span className="ml-1">
          <Check className="h-3 w-3" />
        </span>
      );
    }
    
    return null;
  };

  return (
    <div
      className={`flex ${
        isCurrentUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[80%] rounded-lg p-3 ${
          isCurrentUser
            ? offlineMode 
              ? "bg-yellow-200 text-yellow-900" 
              : "bg-primary text-primary-foreground"
            : "bg-muted"
        }`}
      >
        {(showSender || !isCurrentUser) && (
          <p className="text-sm font-medium flex items-center">
            {senderName}
            {renderReadStatus()}
          </p>
        )}
        <p className="text-sm">{message.message}</p>
        <p className="text-xs opacity-70 flex items-center">
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          {isCurrentUser && renderReadStatus()}
          {offlineMode && <span className="ml-1 text-xs font-medium"> (offline)</span>}
        </p>
      </div>
    </div>
  );
};
