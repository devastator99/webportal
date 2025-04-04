
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Paperclip } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  offlineMode?: boolean;
}

export const ChatInput = ({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "Type a message...",
  offlineMode = false
}: ChatInputProps) => {
  const [isUploading, setIsUploading] = useState(false);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className="flex items-end gap-2 mt-4 w-full">
      <div className="relative flex-1">
        <Textarea
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-24 resize-none pr-12 py-3 w-full"
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        <div className="absolute right-3 bottom-3">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => {}}
            className="rounded-full"
            disabled={disabled || isUploading}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <Button
        onClick={onSend}
        disabled={disabled || !value.trim() || isUploading}
        className="h-10 w-10 shrink-0 rounded-full"
      >
        {isUploading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Send className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
};
