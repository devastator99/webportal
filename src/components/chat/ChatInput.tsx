
import { useState, useRef, ChangeEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Paperclip, Send, X, Loader2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  offlineMode?: boolean;
  className?: string;
  onFileSelect?: (file: File) => void;
  selectedFile?: File | null;
  onClearFile?: () => void;
  uploadProgress?: number;
}

export const ChatInput = ({ 
  value, 
  onChange, 
  onSend,
  placeholder = "Type a message...", 
  disabled = false,
  isLoading = false,
  offlineMode = false,
  className,
  onFileSelect,
  selectedFile,
  onClearFile,
  uploadProgress = 0
}: ChatInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !isLoading && (value.trim() || selectedFile)) {
        onSend();
      }
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    adjustTextareaHeight(e.target);
  };

  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = "inherit";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };
  
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onFileSelect) {
      onFileSelect(e.target.files[0]);
    }
  };
  
  const handleClearFile = () => {
    if (onClearFile) {
      onClearFile();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className={cn(
      "flex flex-col gap-2 transition-all duration-300",
      className
    )}>
      {selectedFile && (
        <div className="flex items-center gap-2 p-2 bg-muted/40 rounded-lg">
          <FileText className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm truncate flex-1">{selectedFile.name}</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full" 
            onClick={handleClearFile}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
      
      {uploadProgress > 0 && uploadProgress < 100 && (
        <Progress value={uploadProgress} className="h-1" />
      )}
      
      <div className="flex items-end gap-2">
        {onFileSelect && (
          <>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange} 
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-full h-9 w-9 flex-shrink-0",
                isFocused && "text-primary"
              )}
              onClick={triggerFileUpload}
              disabled={disabled || isLoading}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
          </>
        )}
        
        <div className="relative flex-1">
          <Textarea 
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className={cn(
              "min-h-[40px] max-h-[120px] pr-10 py-2.5 resize-none overflow-y-auto",
              isFocused && "border-primary ring-2 ring-primary/20"
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            rows={1}
          />
          
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className={cn(
              "absolute bottom-1 right-1 rounded-full h-8 w-8",
              value.trim() || selectedFile ? "text-primary bg-primary/10" : "text-muted-foreground",
              isLoading && "pointer-events-none"
            )}
            onClick={onSend}
            disabled={disabled || isLoading || (!value.trim() && !selectedFile)}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      {offlineMode && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
          You're offline. Messages will be sent when you reconnect.
        </p>
      )}
    </div>
  );
};
