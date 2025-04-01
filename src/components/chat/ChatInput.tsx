
import { useState, KeyboardEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, WifiOff } from "lucide-react";

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
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className="flex items-end gap-2 mt-4">
      <Textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="flex-1 min-h-[80px] resize-none"
        onKeyDown={handleKeyDown}
      />
      <Button
        onClick={onSend}
        disabled={disabled || !value.trim()}
        size="icon"
        className={`mb-[4px] ${offlineMode ? 'bg-yellow-600 hover:bg-yellow-700' : ''}`}
      >
        {offlineMode ? <WifiOff className="h-4 w-4" /> : <Send className="h-4 w-4" />}
      </Button>
    </div>
  );
};
