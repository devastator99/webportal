
import { useState, useEffect } from "react";
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
  const [isOpen, setIsOpen] = useState<boolean>(false);
  
  useEffect(() => {
    try {
      // Parse the date string to a Date object
      const messageDate = parseISO(date);
      console.log(`Date parsed: ${date} -> ${messageDate.toISOString()}`);
      
      // Auto-expand for today and yesterday
      const shouldOpen = isToday(messageDate) || isYesterday(messageDate);
      console.log(`Should open for ${date}: ${shouldOpen}`);
      setIsOpen(shouldOpen);
    } catch (error) {
      console.error(`Error parsing date: ${date}`, error);
      // Default to open if there's an error
      setIsOpen(true);
    }
  }, [date]);

  const formatMessageDate = (dateString: string): string => {
    try {
      const messageDate = parseISO(dateString);
      
      if (isToday(messageDate)) {
        return "Today";
      } else if (isYesterday(messageDate)) {
        return "Yesterday";
      } else {
        return format(messageDate, 'MMMM d, yyyy');
      }
    } catch (error) {
      console.error(`Error formatting date: ${dateString}`, error);
      return dateString;
    }
  };

  const formattedDate = formatMessageDate(date);
  const messagesCount = messages?.length || 0;

  return (
    <div className="space-y-2 mb-6 relative date-group" data-date={date}>
      <Collapsible 
        open={isOpen} 
        onOpenChange={setIsOpen}
        className="w-full"
      >
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
              {messagesCount} {messagesCount === 1 ? 'message' : 'messages'}
            </span>
          </div>
        </div>
        
        <CollapsibleContent className="space-y-2 mt-2">
          {children}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
