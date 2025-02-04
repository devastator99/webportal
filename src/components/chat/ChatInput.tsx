import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export const ChatInput = ({ value, onChange, onSend, disabled }: ChatInputProps) => {
  return (
    <div className="flex gap-2 mt-4">
      <Textarea
        placeholder="Type your message..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="resize-none"
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
      />
      <Button onClick={onSend} disabled={disabled}>
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
};