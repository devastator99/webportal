
import { format } from "date-fns";
import { Check, CheckCheck, Clock, Bot, Sparkles, Trash2, FileIcon, FileText, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger 
} from "@/components/ui/context-menu";
import { DeleteMessageDialog } from "./DeleteMessageDialog";
import { useToast } from "@/hooks/use-toast";

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
    file_url?: string;
    message_type?: 'text' | 'image' | 'file' | 'pdf';
  };
  isCurrentUser: boolean;
  showAvatar?: boolean;
  offlineMode?: boolean;
  isLocal?: boolean;
  onPdfDownload?: () => void;
  onMessageDelete?: () => void;
  onFileOpen?: (url: string, type: string) => void;
}

export const ChatMessage = ({ 
  message, 
  isCurrentUser, 
  showAvatar = false,
  offlineMode = false,
  isLocal = false,
  onPdfDownload,
  onMessageDelete,
  onFileOpen
}: ChatMessageProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

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
  const isDoctor = message.sender.role === 'doctor';
  
  const isPdfMessage = message.message.includes("PDF has been generated") || 
                      message.message.includes("prescription as a PDF") ||
                      message.message.includes("ready for download");
  
  const isSystemMessage = message.is_system_message;
  
  // Check if message has attached file
  const hasFile = !!message.file_url;
  const isPdf = message.message_type === 'pdf' || 
                (hasFile && message.file_url?.toLowerCase().endsWith('.pdf'));
  const isImage = message.message_type === 'image' || 
                 (hasFile && /\.(jpg|jpeg|png|gif|webp)$/i.test(message.file_url || ''));
  
  // Only allow message deletion if it's your own message and not a system or AI message
  const canDelete = isCurrentUser && !isSystemMessage && !isAiBot;

  const handleDeleteSuccess = () => {
    if (onMessageDelete) {
      onMessageDelete();
    }
  };

  const handleFileClick = () => {
    if (hasFile && onFileOpen && message.file_url) {
      const fileType = isPdf ? 'pdf' : isImage ? 'image' : 'file';
      onFileOpen(message.file_url, fileType);
    }
  };

  const getBubbleClass = () => {
    if (isSystemMessage) return "system-message";
    if (isCurrentUser) return "current-user";
    if (isAiBot) return "ai-message";
    if (isDoctor) return "doctor-message";
    if (isNutritionist) return "nutritionist-message";
    return "";
  };
  
  // Get the appropriate file icon
  const getFileIcon = () => {
    if (isPdf) {
      return <FileIcon className="h-4 w-4 text-red-500" />;
    } else if (isImage) {
      return <Image className="h-4 w-4 text-blue-500" />;
    } else {
      return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Wrap message in context menu if the user can delete it
  const MessageContent = (
    <div
      className={cn(
        "max-w-[75%] min-w-24 px-3 py-2 rounded-lg shadow-sm transition-all duration-200 message-bubble relative",
        getBubbleClass(),
        isSystemMessage && "mx-auto text-center",
        isAiBot && !isCurrentUser && !isSystemMessage && "hover:shadow-md"
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
        "text-sm whitespace-pre-wrap mb-4",
        isAiBot && !isCurrentUser && "leading-relaxed text-white"
      )}>
        {message.message}
      </p>
      
      {/* Render file attachment if present */}
      {hasFile && (
        <div 
          className={cn(
            "mb-4 p-2 rounded bg-background/50 flex items-center gap-2 cursor-pointer hover:bg-background/80 transition-colors",
            isPdf && "border border-red-200"
          )}
          onClick={handleFileClick}
        >
          {getFileIcon()}
          <span className="text-xs truncate">
            {message.file_url?.split('/').pop() || 'Attachment'}
          </span>
        </div>
      )}
      
      <div className="flex items-center justify-end gap-1 message-time absolute bottom-1 right-2">
        {canDelete && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsDeleteDialogOpen(true);
            }}
            className="opacity-0 group-hover:opacity-70 hover:opacity-100 transition-opacity mr-2"
          >
            <Trash2 className="h-3 w-3 text-red-500" />
          </button>
        )}
        
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
  );
  
  return (
    <div
      className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} group transition-opacity bubble-in`}
    >
      {canDelete ? (
        <ContextMenu>
          <ContextMenuTrigger>{MessageContent}</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem 
              className="text-red-600 flex gap-2"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete Message
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      ) : (
        MessageContent
      )}
      
      <DeleteMessageDialog 
        messageId={message.id}
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        onDeleteSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
