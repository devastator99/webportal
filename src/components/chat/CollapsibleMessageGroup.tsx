
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { shouldExpandDateGroup, formatMessageDateGroup, isToday, normalizeDateString } from "@/utils/dateUtils";

interface CollapsibleMessageGroupProps {
  date: string;
  messages: any[];
  children: React.ReactNode;
  isLatestGroup?: boolean;
}

export const CollapsibleMessageGroup = ({ 
  date, 
  messages, 
  children,
  isLatestGroup = false
}: CollapsibleMessageGroupProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  
  // Ensure recent date groups and today's group are always expanded
  useEffect(() => {
    try {
      // Get today's date for comparison
      const todayStr = normalizeDateString(new Date());
      const isTodayGroup = date === todayStr;
      
      console.log(`Date group: ${date}, Today: ${todayStr}, isToday: ${isTodayGroup}, isLatestGroup: ${isLatestGroup}`);
      
      // Always expand today, yesterday, or most recent group
      const shouldOpen = shouldExpandDateGroup(date) || isLatestGroup || isTodayGroup;
      console.log(`Date group: ${date}, shouldOpen: ${shouldOpen}`);
      setIsOpen(shouldOpen);
    } catch (error) {
      console.error(`Error checking date expansion: ${date}`, error);
      setIsOpen(true); // Default to open on error
    }
  }, [date, isLatestGroup]);

  const formattedDate = formatMessageDateGroup(date);
  const messagesCount = messages?.length || 0;
  
  // Check if this is today's group using string comparison
  const todayStr = normalizeDateString(new Date());
  const isTodayGroup = date === todayStr;
  
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
            className={`bg-background/95 shadow-sm cursor-pointer flex items-center hover:bg-accent/80 transition-colors px-3 py-1 ${isTodayGroup ? 'bg-primary/10 border-primary/30' : ''}`}
            onClick={toggleOpen}
          >
            {formattedDate}
            {isTodayGroup && <span className="ml-1 text-xs text-primary font-semibold">(Today)</span>}
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
