
import { format } from "date-fns";
import { Check, CheckCheck, Clock, Bot, Sparkles, Trash2, FileText, Download, Paperclip, Image } from "lucide-react";
import { cn, isImageFile, formatFileSize } from "@/lib/utils";
import { useState } from "react";
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger 
} from "@/components/ui/context-menu";
import { DeleteMessageDialog } from "./DeleteMessageDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export interface ChatMessageProps {
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
    attachment?: {
      filename: string;
      url: string;
      size?: number;
      type?: string;
    } | null;
  };
  isCurrentUser: boolean;
  showAvatar?: boolean;
  offlineMode?: boolean;
  isLocal?: boolean;
  onPdfDownload?: () => void;
  onMessageDelete?: () => void;
  onAttachmentDownload?: (url: string, filename: string) => void;
}

export const ChatMessage = ({ 
  message, 
  isCurrentUser, 
  showAvatar = false,
  offlineMode = false,
  isLocal = false,
  onPdfDownload,
  onMessageDelete,
  onAttachmentDownload
}: ChatMessageProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
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
  
  const hasAttachment = !!message.attachment;
  const isImageAttachment = hasAttachment && isImageFile(message.attachment?.filename || '');
  
  // Only allow message deletion if it's your own message and not a system or AI message
  const canDelete = isCurrentUser && !isSystemMessage && !isAiBot;

  const handleDeleteSuccess = () => {
    if (onMessageDelete) {
      onMessageDelete();
    }
  };
  
  const handleDownloadAttachment = async () => {
    if (!message.attachment?.url) return;
    
    try {
      setIsDownloading(true);
      
      if (onAttachmentDownload) {
        onAttachmentDownload(message.attachment.url, message.attachment.filename);
      } else {
        // Default download handler
        const response = await fetch(message.attachment.url);
        if (!response.ok) throw new Error('Failed to fetch file');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = message.attachment.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
      
      toast({
        title: "Download started",
        description: `Downloading ${message.attachment.filename}`,
      });
    } catch (error) {
      console.error("Error downloading attachment:", error);
      toast({
        title: "Download failed",
        description: "Could not download the attachment",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const getBubbleClass = () => {
    if (isSystemMessage) return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-100";
    if (isCurrentUser) return "bg-purple-500 text-white dark:bg-purple-600";
    if (isAiBot) return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200";
    if (isDoctor) return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-100";
    if (isNutritionist) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-100";
    return "bg-white dark:bg-gray-800";
  };
  
  // Wrap message in context menu if the user can delete it
  const MessageContent = (
    <div
      className={cn(
        "max-w-[75%] min-w-24 px-3 py-2 rounded-lg shadow-sm transition-all duration-200 message-bubble relative",
        getBubbleClass(),
        isSystemMessage && "mx-auto text-center",
        isAiBot && !isCurrentUser && !isSystemMessage && "hover:shadow-md",
        "group" // Always add group class for hover effects
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
        isAiBot && !isCurrentUser && "leading-relaxed"
      )}>
        {message.message}
      </p>
      
      {hasAttachment && (
        <div className={cn(
          "rounded-md p-2 mb-3 flex items-center gap-2",
          "border",
          isCurrentUser ? "border-white/20" : "border-gray-200 dark:border-gray-700",
          "attachment-container"
        )}>
          {isImageAttachment ? (
            <div className="w-full">
              <div className="text-xs mb-1 flex items-center">
                <Paperclip className="h-3 w-3 mr-1" />
                <span className="truncate max-w-[150px]">{message.attachment.filename}</span>
              </div>
              <img 
                src={message.attachment.url}
                alt={message.attachment.filename}
                className="max-h-48 w-auto rounded object-contain mb-1"
                loading="lazy"
              />
              <button
                className="text-xs flex items-center gap-1 hover:underline"
                onClick={handleDownloadAttachment}
                disabled={isDownloading}
              >
                <Download className="h-3 w-3" />
                {message.attachment.size && formatFileSize(message.attachment.size)}
              </button>
            </div>
          ) : (
            <>
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                <FileText className="h-6 w-6 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{message.attachment.filename}</p>
                {message.attachment.size && (
                  <p className="text-xs text-muted-foreground">{formatFileSize(message.attachment.size)}</p>
                )}
              </div>
              <button
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md flex-shrink-0"
                onClick={handleDownloadAttachment}
                disabled={isDownloading}
                aria-label="Download attachment"
              >
                <Download className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      )}
      
      <div className="flex items-center justify-end gap-1 message-time absolute bottom-1 right-2">
        {canDelete && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsDeleteDialogOpen(true);
            }}
            className="text-red-500 hover:text-red-600 transition-colors mr-1 flex items-center"
            aria-label="Delete message"
          >
            <Trash2 className="h-3.5 w-3.5" />
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
      className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} transition-opacity bubble-in mb-2`}
    >
      {canDelete ? (
        <ContextMenu>
          <ContextMenuTrigger>{MessageContent}</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem 
              className="text-red-600 flex gap-2 cursor-pointer"
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
