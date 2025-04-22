
import { useState, useEffect } from 'react';
import { format, isToday, isYesterday } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CollapsibleMessageGroupProps {
  date: string;
  messages: any[];
  children: React.ReactNode;
}

export const CollapsibleMessageGroup = ({ date, messages, children }: CollapsibleMessageGroupProps) => {
  // Default to open for today's messages, closed for older messages
  const [isOpen, setIsOpen] = useState(() => {
    const messageDate = new Date(date);
    return isToday(messageDate) || isYesterday(messageDate);
  });
  
  // Format the date to be more readable
  const formatMessageDate = (dateString: string) => {
    const messageDate = new Date(dateString);
    
    if (isToday(messageDate)) {
      return "Today";
    } else if (isYesterday(messageDate)) {
      return "Yesterday";
    } else {
      return format(messageDate, 'MMMM d, yyyy');
    }
  };
  
  const formattedDate = formatMessageDate(date);

  // Update open state when date changes
  useEffect(() => {
    const messageDate = new Date(date);
    setIsOpen(isToday(messageDate) || isYesterday(messageDate));
  }, [date]);

  return (
    <div className="space-y-2">
      <div 
        className="flex items-center justify-between cursor-pointer py-2 hover:bg-muted/20 px-2 rounded-md transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Badge variant="outline" className="bg-background/80 cursor-pointer flex items-center">
          {formattedDate}
          {isOpen ? (
            <ChevronUp className="h-3 w-3 ml-1" />
          ) : (
            <ChevronDown className="h-3 w-3 ml-1" />
          )}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {messages.length} {messages.length === 1 ? 'message' : 'messages'}
        </span>
      </div>
      
      {isOpen && (
        <div className="space-y-2 pl-1">
          {children}
        </div>
      )}
    </div>
  );
};
