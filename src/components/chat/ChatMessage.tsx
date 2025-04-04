
import { formatDistanceToNow } from "date-fns";
import { Check, Clock, User, Stethoscope, Apple, Bot } from "lucide-react";

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
    synced?: boolean | string;
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

  const firstName = message.sender.first_name || '';
  
  // AI bot has a special ID and role
  const isAiSender = message.sender.id === '00000000-0000-0000-0000-000000000000' || 
                    message.sender.role === 'aibot';
  
  // Nutritionist/Dietician role check
  const isDieticianSender = message.sender.role === 'nutritionist';
  const isDoctorSender = message.sender.role === 'doctor';
  const isPatientSender = message.sender.role === 'patient';

  const renderSenderIcon = () => {
    if (isAiSender) return <Bot className="h-4 w-4 mr-1" />;
    if (isDoctorSender) return <Stethoscope className="h-4 w-4 mr-1" />;
    if (isDieticianSender) return <Apple className="h-4 w-4 mr-1" />;
    if (isPatientSender) return <User className="h-4 w-4 mr-1" />;
    return <User className="h-4 w-4 mr-1" />;
  };

  const renderReadStatus = () => {
    if (!isCurrentUser) return null;
    
    if (offlineMode) {
      return (
        <span className="ml-1 text-yellow-500" title="Will be delivered when online">
          <Clock className="h-3 w-3" />
        </span>
      );
    } else if (message.read) {
      return (
        <span className="ml-1 inline-flex">
          <Check className="h-3 w-3" />
          <Check className="h-3 w-3 -ml-1" />
        </span>
      );
    } else {
      return (
        <span className="ml-1">
          <Check className="h-3 w-3" />
        </span>
      );
    }
  };

  return (
    <div
      className={`flex mb-3 ${
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
          <p className="text-sm font-medium flex items-center mb-1">
            {renderSenderIcon()}
            {firstName}
            {renderReadStatus()}
          </p>
        )}
        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
        <p className="text-xs opacity-70 flex items-center mt-1">
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          {isCurrentUser && renderReadStatus()}
          {offlineMode && <span className="ml-1 text-xs font-medium"> (offline)</span>}
        </p>
      </div>
    </div>
  );
};
