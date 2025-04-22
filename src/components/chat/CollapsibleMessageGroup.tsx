
import { useState } from 'react';
import { format } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CollapsibleMessageGroupProps {
  date: string;
  messages: any[];
  children: React.ReactNode;
}

export const CollapsibleMessageGroup = ({ date, messages, children }: CollapsibleMessageGroupProps) => {
  const [isOpen, setIsOpen] = useState(true);
  
  // Format the date to be more readable
  const formattedDate = format(new Date(date), 'MMMM d, yyyy');
  
  // Check if this date is today
  const isToday = new Date(date).toDateString() === new Date().toDateString();

  return (
    <div className="space-y-2">
      <div 
        className="flex items-center justify-between cursor-pointer py-2 hover:bg-muted/20 px-2 rounded-md transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Badge variant="outline" className="bg-background/80 cursor-pointer">
          {isToday ? "Today" : formattedDate}
          {isOpen ? (
            <ChevronUp className="h-3 w-3 ml-1 inline" />
          ) : (
            <ChevronDown className="h-3 w-3 ml-1 inline" />
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
