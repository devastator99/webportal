
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

  return (
    <div className="space-y-2">
      <div 
        className="flex items-center justify-between cursor-pointer py-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Badge variant="outline" className="bg-background/80 cursor-pointer">
          {format(new Date(date), 'MMMM d, yyyy')}
          {isOpen ? (
            <ChevronUp className="h-3 w-3 ml-1 inline" />
          ) : (
            <ChevronDown className="h-3 w-3 ml-1 inline" />
          )}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {messages.length} messages
        </span>
      </div>
      
      {isOpen && (
        <div className="space-y-4">
          {children}
        </div>
      )}
    </div>
  );
};
