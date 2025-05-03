
import { format } from "date-fns";
import { Check, CheckCheck, Clock, Bot, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

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
    is_ai_message?: boolean;
    is_system_message?: boolean;
  };
  isCurrentUser: boolean;
  showAvatar?: boolean;
  offlineMode?: boolean;
  isLocal?: boolean;
  onPdfDownload?: () => void;
}

export const ChatMessage = ({ 
  message, 
  isCurrentUser, 
  showAvatar = false,
  offlineMode = false,
  isLocal = false,
  onPdfDownload
}: ChatMessageProps) => {
  let formattedTime = '';
  try {
    const messageTime = new Date(message.created_at);
    formattedTime = format(messageTime, "h:mm a");
  } catch (error) {
    console.error("Error formatting message time:", error);
    formattedTime = 'Unknown time';
  }

  const senderFullName = `${message.sender.first_name || ''} ${message.sender.last_name || ''}`.trim() || 'Unknown';
  
  const isAiBot = message.is_ai_message || message.sender.role === 'aibot' || message.sender.id === '00000000-0000-0000-0000-000000000000';
  
  const isNutritionist = message.sender.role === 'nutritionist';
  
  const isPdfMessage = message.message.includes("PDF has been generated") || 
                      message.message.includes("prescription as a PDF") ||
                      message.message.includes("ready for download");
  
  const isSystemMessage = message.is_system_message;
  
  return (
    <div
      className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} group transition-opacity`}
    >
      <div
        className={cn(
          "max-w-[75%] px-3 py-2 rounded-lg shadow-sm transition-all duration-200 border",
          isSystemMessage
            ? "bg-blue-50/70 dark:bg-blue-900/10 text-center mx-auto border-blue-100 dark:border-blue-800/20"
            : isCurrentUser
              ? "bg-[#9b87f5]/90 text-white border-[#8B5CF6]/20"
              : isAiBot 
                ? "bg-purple-50/80 dark:bg-purple-900/10 border-purple-200/50 dark:border-purple-500/20" 
                : "bg-neutral-100/80 dark:bg-neutral-800/50 border-neutral-200/50 dark:border-neutral-700/30",
          isAiBot && !isCurrentUser && "hover:shadow-md group-hover:bg-purple-50/90 dark:group-hover:bg-purple-900/20"
        )}
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
        
        {isPdfMessage && onPdfDownload && (
          <button
            onClick={onPdfDownload}
            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 mb-2 hover:underline"
            aria-label="Download Prescription"
          >
            <span>Download Prescription</span>
          </button>
        )}
        
        {isAiBot && !isCurrentUser && (
          <div className="flex items-center gap-1 mb-1 text-purple-700 dark:text-purple-400">
            <Sparkles className="h-3 w-3" />
            <span className="text-xs font-medium">AI Assistant</span>
          </div>
        )}
        
        <p className={cn(
          "text-sm whitespace-pre-wrap",
          isAiBot && !isCurrentUser && "leading-relaxed"
        )}>
          {message.message}
        </p>
        
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
          
          {!isCurrentUser && isAiBot && (
            <Bot className="h-3 w-3 text-purple-500 ml-1" />
          )}
          
          {!isCurrentUser && isNutritionist && (
            <CheckCheck className="h-3 w-3 text-blue-500 ml-1" />
          )}
        </div>
      </div>
    </div>
  );
}
