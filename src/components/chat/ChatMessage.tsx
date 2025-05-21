
import React, { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { cn, fmt } from "@/lib/utils";
import { MoreHorizontal, FileText, Download } from "lucide-react";
import { DeleteMessageDialog } from "./DeleteMessageDialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface Sender {
  id: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}

interface Message {
  id: string;
  message: string;
  created_at: string;
  read?: boolean;
  sender: Sender;
  is_system_message?: boolean;
  is_ai_message?: boolean;
  attachment_url?: string | null;
}

interface ChatMessageProps {
  message: Message;
  isCurrentUser: boolean;
  showAvatar?: boolean;
  onMessageDelete?: () => void;
  onPdfDownload?: () => void;
  onAttachmentDownload?: (path: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isCurrentUser,
  showAvatar = false,
  onMessageDelete,
  onPdfDownload,
  onAttachmentDownload
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const senderName = message.sender.first_name 
    ? `${message.sender.first_name} ${message.sender.last_name || ''}`.trim()
    : 'Unknown User';
  
  const senderRole = message.sender.role || '';
  const isAi = message.is_ai_message || message.sender.role === 'aibot';
  const isSystem = message.is_system_message || false;
  const hasAttachment = !!message.attachment_url;
  
  const timeAgo = formatDistanceToNow(new Date(message.created_at), { addSuffix: true });
  
  const handleDeleteMessage = () => {
    setIsDeleteDialogOpen(true);
  };
  
  const getAttachmentFilename = (url: string) => {
    if (!url) return 'attachment';
    return url.split('/').pop() || 'attachment';
  };
  
  return (
    <>
      <div
        className={cn(
          "flex mb-4",
          isCurrentUser ? "justify-end" : "justify-start"
        )}
      >
        <div className={cn("flex", isCurrentUser ? "flex-row-reverse" : "flex-row")}>
          {showAvatar && !isCurrentUser && (
            <div className="flex-shrink-0 mr-2">
              <Avatar className="h-8 w-8 border">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white h-full w-full flex items-center justify-center">
                  {senderName.charAt(0)}
                </div>
              </Avatar>
            </div>
          )}
          
          <div className={cn("flex flex-col max-w-[80%]", isCurrentUser ? "items-end" : "items-start")}>
            {!isCurrentUser && (
              <div className="text-xs text-muted-foreground mb-1">
                <span className="font-medium">{senderName}</span>
                {senderRole && (
                  <span className="ml-1 text-xs opacity-75">({senderRole})</span>
                )}
              </div>
            )}
            
            <div className={cn(
              "rounded-lg py-2 px-3",
              isCurrentUser 
                ? "bg-primary text-primary-foreground" 
                : isAi 
                  ? "bg-secondary/40 border border-secondary/20 text-secondary-foreground" 
                  : isSystem 
                    ? "bg-muted text-muted-foreground italic" 
                    : "bg-background border dark:bg-slate-800 dark:border-slate-700",
              "relative flex flex-col"
            )}>
              <div className="message-content break-words">{message.message}</div>
              
              {hasAttachment && (
                <div className="mt-2 flex items-center gap-2 p-2 bg-background/50 dark:bg-slate-800/50 rounded-md">
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  <span className="text-xs truncate flex-1">{getAttachmentFilename(message.attachment_url!)}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 rounded-full flex-shrink-0"
                    onClick={() => onAttachmentDownload?.(message.attachment_url!)}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              <div className="text-xs opacity-50 self-end mt-1">
                {timeAgo}
              </div>
            </div>
          </div>
          
          {isCurrentUser && (
            <div className="flex-shrink-0 ml-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0 rounded-full" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDeleteMessage}>
                    Delete Message
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
      
      {isDeleteDialogOpen && (
        <DeleteMessageDialog
          messageId={message.id}
          isOpen={isDeleteDialogOpen}
          setIsOpen={setIsDeleteDialogOpen}
          onDeleteSuccess={() => {
            if (onMessageDelete) onMessageDelete();
          }}
        />
      )}
    </>
  );
};
