
import { format } from "date-fns";
import { Check, CheckCheck, Clock, Bot } from "lucide-react";

interface ChatMessageProps {
  message: {
    id: string;
    message: string;
    created_at: string;
    read: boolean;
    sender: {
      id: string;
      first_name: string;
      last_name: string;
      role?: string;
    };
    synced?: boolean | string;
  };
  isCurrentUser: boolean;
  showAvatar?: boolean;
  offlineMode?: boolean;
  isLocal?: boolean;
}

export const ChatMessage = ({ 
  message, 
  isCurrentUser, 
  showAvatar = false,
  offlineMode = false,
  isLocal = false
}: ChatMessageProps) => {
  // Format message timestamp safely
  let formattedTime = '';
  try {
    const messageTime = new Date(message.created_at);
    formattedTime = format(messageTime, "h:mm a");
  } catch (error) {
    console.error("Error formatting message time:", error);
    formattedTime = 'Unknown time';
  }

  // Get sender full name
  const senderFullName = `${message.sender.first_name || ''} ${message.sender.last_name || ''}`.trim() || 'Unknown';
  
  // Determine if the sender is an AI bot
  const isAiBot = message.sender.role === 'aibot' || message.sender.id === '00000000-0000-0000-0000-000000000000';
  
  // Determine if sender is a nutritionist
  const isNutritionist = message.sender.role === 'nutritionist';
  
  return (
    <div
      className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[75%] px-3 py-2 rounded-lg ${
          isCurrentUser
            ? "bg-primary text-primary-foreground rounded-tr-none"
            : "bg-muted rounded-tl-none"
        }`}
      >
        {showAvatar && !isCurrentUser && (
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400 block mb-1">
            {senderFullName}
            {message.sender.role && message.sender.role !== "patient" && (
              <span className="ml-1 text-xs text-blue-500/80 dark:text-blue-300/80">
                ({message.sender.role})
              </span>
            )}
          </span>
        )}
        
        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
        
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-xs opacity-70">{formattedTime}</span>
          
          {isCurrentUser && (
            <>
              {offlineMode || !message.synced ? (
                <Clock className="h-3 w-3 opacity-70" />
              ) : isAiBot ? (
                <Check className="h-3 w-3 text-blue-500" />
              ) : isNutritionist ? (
                <CheckCheck className="h-3 w-3 text-blue-500" />
              ) : message.read ? (
                <CheckCheck className="h-3 w-3 opacity-70 text-blue-400" />
              ) : (
                <Check className="h-3 w-3 opacity-70" />
              )}
            </>
          )}
          
          {/* Add blue tick for AI messages */}
          {!isCurrentUser && isAiBot && (
            <Check className="h-3 w-3 text-blue-500 ml-1" />
          )}
          
          {/* Add double blue ticks for nutritionist messages */}
          {!isCurrentUser && isNutritionist && (
            <CheckCheck className="h-3 w-3 text-blue-500 ml-1" />
          )}
          
          {/* Show bot icon for AI messages */}
          {isAiBot && (
            <Bot className="h-3 w-3 text-blue-400 ml-1" />
          )}
        </div>
      </div>
    </div>
  );
}
