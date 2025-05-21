
import React, { useState, useRef, useEffect } from "react";
import { Send, PaperclipIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  onAttachmentUpload?: (file: File) => void;
  allowAttachments?: boolean;
}

export const ChatInput = ({
  value,
  onChange,
  onSend,
  disabled = false,
  isLoading = false,
  placeholder = "Type a message...",
  onAttachmentUpload,
  allowAttachments = false
}: ChatInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [textareaHeight, setTextareaHeight] = useState<number>(44); // Default height
  const isMobile = useIsMobile();

  // Handle textarea height adjustment
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "0";
      const scrollHeight = Math.min(textareaRef.current.scrollHeight, 120); // Limit height to 120px
      setTextareaHeight(scrollHeight);
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled && !isLoading) {
        onSend();
      }
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onAttachmentUpload) {
      onAttachmentUpload(e.target.files[0]);
      e.target.value = ""; // Reset input value
    }
  };

  return (
    <div className="chat-input-container">
      <div className="flex items-end gap-2 relative">
        {allowAttachments && (
          <div className="relative">
            <input
              type="file"
              id="attachment"
              className="hidden"
              onChange={handleAttachmentChange}
              accept="image/*,.pdf,.doc,.docx,.txt"
              disabled={disabled}
            />
            <label
              htmlFor="attachment"
              className={cn(
                "flex items-center justify-center h-10 w-10 rounded-full cursor-pointer",
                "bg-muted hover:bg-muted/80 transition-colors",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <PaperclipIcon className="h-4 w-4" />
            </label>
          </div>
        )}

        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            style={{ height: `${textareaHeight}px` }}
            className={cn(
              "w-full resize-none rounded-2xl py-3 px-4 focus-visible:ring-1 focus-visible:ring-offset-0",
              "bg-muted text-foreground placeholder:text-muted-foreground",
              "border-none focus-visible:outline-none focus-visible:ring-primary",
              "transition-all duration-200 ease-in-out",
              "pr-12", // Make space for the send button
              isMobile ? "text-base" : "text-sm"
            )}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onSend}
            disabled={!value.trim() || disabled || isLoading}
            className={cn(
              "absolute bottom-1 right-1 h-8 w-8 rounded-full",
              "hover:bg-primary hover:text-primary-foreground",
              "transition-all duration-200",
              value.trim() && !disabled && !isLoading ? "text-primary" : "text-muted-foreground",
              isMobile ? "h-10 w-10 bottom-0.5 right-0.5" : "h-8 w-8 bottom-1 right-1"
            )}
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
