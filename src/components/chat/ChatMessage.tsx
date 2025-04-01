
import { formatDistanceToNow } from "date-fns";

interface ChatMessageProps {
  message: {
    id: string;
    message: string;
    created_at: string;
    sender: {
      id: string;
      first_name: string | null;
      last_name: string | null;
    };
  };
  isCurrentUser: boolean;
  showSender?: boolean;
}

export const ChatMessage = ({ message, isCurrentUser, showSender = false }: ChatMessageProps) => {
  const senderName = message.sender.first_name || message.sender.last_name 
    ? `${message.sender.first_name || ''} ${message.sender.last_name || ''}`.trim()
    : 'Unknown User';

  return (
    <div
      className={`flex ${
        isCurrentUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[80%] rounded-lg p-3 ${
          isCurrentUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        }`}
      >
        {(showSender || !isCurrentUser) && (
          <p className="text-sm font-medium">{senderName}</p>
        )}
        <p className="text-sm">{message.message}</p>
        <p className="text-xs opacity-70">
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
};
