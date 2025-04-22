
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { shouldExpandDateGroup, formatMessageDateGroup } from "@/utils/dateUtils";

interface CollapsibleMessageGroupProps {
  date: string;
  messages: any[];
  children: React.ReactNode;
}

export const CollapsibleMessageGroup = ({ date, messages, children }: CollapsibleMessageGroupProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  
  // Use the improved date utilities
  useEffect(() => {
    const shouldOpen = shouldExpandDateGroup(date);
    setIsOpen(shouldOpen);
  }, [date]);

  const formattedDate = formatMessageDateGroup(date);
  const messagesCount = messages?.length || 0;
  
  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="space-y-2 mb-6 relative date-group" data-date={date}>
      <div className="relative py-2">
        <Separator className="absolute inset-0 my-auto z-0" />
        <div className="flex justify-between items-center relative z-10">
          <Badge 
            variant="outline" 
            className="bg-background/95 shadow-sm cursor-pointer flex items-center hover:bg-accent/80 transition-colors px-3 py-1"
            onClick={toggleOpen}
          >
            {formattedDate}
            {isOpen ? (
              <ChevronUp className="h-3 w-3 ml-1" />
            ) : (
              <ChevronDown className="h-3 w-3 ml-1" />
            )}
          </Badge>
          <span className="text-xs text-muted-foreground bg-background/95 px-2 rounded-sm">
            {messagesCount} {messagesCount === 1 ? 'message' : 'messages'}
          </span>
        </div>
      </div>
      
      {isOpen && (
        <div className="space-y-2 mt-2 animate-in fade-in slide-in-from-top-5 duration-300">
          {children}
        </div>
      )}
    </div>
  );
};
