
import { useState, useEffect } from 'react';
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

interface CollapsibleMessageGroupProps {
  date: string;
  messages: any[];
  children: React.ReactNode;
}

export const CollapsibleMessageGroup = ({ date, messages, children }: CollapsibleMessageGroupProps) => {
  // Default to open for today's messages, closed for older messages
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    try {
      // Ensure we have a proper date string before parsing
      const messageDate = parseISO(date);
      console.log(`Initializing date group: ${date}, isToday: ${isToday(messageDate)}`);
      return isToday(messageDate) || isYesterday(messageDate);
    } catch (error) {
      console.error("Error parsing date:", date, error);
      return true; // Default to open if date parsing fails
    }
  });
  
  // Format the date to be more readable
  const formatMessageDate = (dateString: string): string => {
    try {
      // Ensure we have a proper date string before formatting
      const messageDate = parseISO(dateString);
      
      if (isToday(messageDate)) {
        return "Today";
      } else if (isYesterday(messageDate)) {
        return "Yesterday";
      } else {
        return format(messageDate, 'MMMM d, yyyy');
      }
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return dateString; // Return original string if formatting fails
    }
  };
  
  const formattedDate = formatMessageDate(date);

  // Update open state when date changes
  useEffect(() => {
    try {
      const messageDate = parseISO(date);
      setIsOpen(isToday(messageDate) || isYesterday(messageDate));
    } catch (error) {
      console.error("Error in useEffect date handling:", date, error);
      setIsOpen(true); // Default to open if date parsing fails
    }
  }, [date]);

  return (
    <div className="space-y-2 mb-6 relative date-group" data-date={date}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="relative py-2">
          <Separator className="absolute inset-0 my-auto z-0" />
          <div className="flex justify-between items-center relative z-10">
            <CollapsibleTrigger asChild>
              <Badge 
                variant="outline" 
                className="bg-background/95 shadow-sm cursor-pointer flex items-center hover:bg-accent/80 transition-colors px-3 py-1"
              >
                {formattedDate}
                {isOpen ? (
                  <ChevronUp className="h-3 w-3 ml-1" />
                ) : (
                  <ChevronDown className="h-3 w-3 ml-1" />
                )}
              </Badge>
            </CollapsibleTrigger>
            <span className="text-xs text-muted-foreground bg-background/95 px-2 rounded-sm">
              {messages.length} {messages.length === 1 ? 'message' : 'messages'}
            </span>
          </div>
        </div>
        
        <CollapsibleContent className="space-y-2 mt-2 collapsible-messages">
          {children}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
