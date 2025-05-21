
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
  fullScreen?: boolean;
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
  uploadProgress = 0,
  fullScreen = false
}: ChatInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !isLoading && (value.trim() || selectedFile) && !validationError) {
        onSend();
      }
    }
  };
  
  const validateMessage = (message: string): boolean => {
    // Check for excessive special characters (more than 30% of the message)
    const specialChars = message.replace(/[a-zA-Z0-9\s]/g, '');
    const specialCharPercentage = message.length ? (specialChars.length / message.length) * 100 : 0;
    
    // Check for repeating characters (same character repeated more than 5 times)
    const hasRepeatingChars = /(.)\1{5,}/.test(message);
    
    // Check for very long words (longer than 30 characters without spaces)
    const hasVeryLongWords = message.split(/\s+/).some(word => word.length > 30);
    
    if (specialCharPercentage > 30) {
      setValidationError("Message contains too many special characters");
      return false;
    } else if (hasRepeatingChars) {
      setValidationError("Message contains excessive repeating characters");
      return false;
    } else if (hasVeryLongWords) {
      setValidationError("Message contains unusually long words");
      return false;
    } else {
      setValidationError(null);
      return true;
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    validateMessage(newValue);
    onChange(newValue);
    adjustTextareaHeight(e.target);
  };

  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = "inherit";
    // Increased max height from 160px to 200px for more typing space
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
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
      "flex flex-col gap-2 transition-all duration-300 mb-safe pb-6",
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
              "min-h-[60px] max-h-[200px] pr-10 py-3 resize-none overflow-y-auto", // Increased min-height from 50px to 60px and max-height from 160px to 200px
              isFocused && "border-primary ring-2 ring-primary/20",
              validationError && "border-red-500 focus:border-red-500"
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            rows={3} // Increased from 2 to 3 rows for more initial space
          />
          
          {validationError && (
            <p className="text-xs text-red-500 mt-1">{validationError}</p>
          )}
          
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className={cn(
              "absolute bottom-1 right-1 rounded-full h-8 w-8",
              (value.trim() || selectedFile) && !validationError ? "text-primary bg-primary/10" : "text-muted-foreground",
              isLoading && "pointer-events-none"
            )}
            onClick={onSend}
            disabled={disabled || isLoading || (!value.trim() && !selectedFile) || !!validationError}
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
