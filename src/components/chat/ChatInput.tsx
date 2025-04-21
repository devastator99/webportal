
import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Paperclip, X, FileText, Image, File } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  offlineMode?: boolean;
  onFileSelect?: (file: File) => void;
  uploadProgress?: number;
  isUploading?: boolean;
  selectedFile?: File | null;
  onClearFile?: () => void;
  isLoading?: boolean;
}

export const ChatInput = ({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "Type a message...",
  offlineMode = false,
  onFileSelect,
  uploadProgress = 0,
  isUploading = false,
  selectedFile = null,
  onClearFile,
  isLoading = false
}: ChatInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [internalSelectedFile, setInternalSelectedFile] = useState<File | null>(null);
  
  // Use the selectedFile prop if provided, otherwise use the internal state
  const fileToDisplay = selectedFile || internalSelectedFile;
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() || fileToDisplay) {
        onSend();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf', 
        'image/jpeg', 
        'image/png', 
        'image/jpg',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      // Validate file size (50MB max)
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Please upload PDF, images, or document files.');
        return;
      }
      
      if (file.size > maxSize) {
        alert('File too large. Maximum size is 50MB.');
        return;
      }
      
      setInternalSelectedFile(file);
      if (onFileSelect) {
        onFileSelect(file);
      }
    }
  };
  
  const handleRemoveFile = () => {
    setInternalSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onClearFile) {
      onClearFile();
    }
  };
  
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    if (fileType.includes('image')) return <Image className="h-4 w-4 text-blue-500" />;
    return <File className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="flex flex-col w-full">
      {fileToDisplay && (
        <div className="mb-2 p-2 bg-muted rounded-md flex items-center justify-between">
          <div className="flex items-center">
            {getFileIcon(fileToDisplay.type)}
            <span className="ml-2 text-sm truncate max-w-[150px]">{fileToDisplay.name}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRemoveFile} disabled={isUploading || isLoading}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {isUploading && (
        <div className="mb-2">
          <div className="w-full bg-muted rounded-full h-2.5">
            <div 
              className="bg-primary h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Uploading file... {uploadProgress}%</p>
        </div>
      )}
      
      <div className="flex items-end gap-2 w-full">
        <div className="relative flex-1">
          <Textarea
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-24 resize-none pr-12 py-3 w-full"
            onKeyDown={handleKeyDown}
            disabled={disabled || isUploading || isLoading}
          />
          <div className="absolute right-3 bottom-3">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full"
              disabled={disabled || isUploading || isLoading}
            >
              <Paperclip className={cn("h-5 w-5", fileToDisplay && "text-primary")} />
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
          </div>
        </div>
        <Button
          onClick={onSend}
          disabled={disabled || ((!value.trim() && !fileToDisplay) || isUploading || isLoading)}
          className="h-10 w-10 shrink-0 rounded-full"
        >
          {isUploading || isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
};
