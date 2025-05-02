
import React, { useState } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CollapsibleMessageGroupProps {
  date: string;
  children: React.ReactNode;
  isLatestGroup?: boolean;
  messages: any[];
}

export const CollapsibleMessageGroup = ({ 
  date, 
  children, 
  isLatestGroup = false,
  messages 
}: CollapsibleMessageGroupProps) => {
  const [isCollapsed, setIsCollapsed] = useState(!isLatestGroup);
  
  const getFormattedDate = () => {
    try {
      const dateObj = new Date(date);
      
      if (isToday(dateObj)) {
        return "Today";
      } else if (isYesterday(dateObj)) {
        return "Yesterday";
      } else {
        return format(dateObj, 'MMMM d, yyyy');
      }
    } catch (error) {
      console.error("Error formatting date:", error);
      return date;
    }
  };
  
  const formattedDate = getFormattedDate();
  
  const toggleCollapse = () => {
    setIsCollapsed(prev => !prev);
  };
  
  return (
    <div className="message-group">
      <div className="flex justify-center mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapse}
          className="h-6 text-xs text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/50 rounded-full px-3 flex items-center gap-1 shadow-sm"
        >
          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          <span>{formattedDate}</span>
          <span className="text-[10px] opacity-70">({messages.length})</span>
        </Button>
      </div>
      
      {!isCollapsed && (
        <div className="space-y-2 mb-4">
          {children}
        </div>
      )}
    </div>
  );
};
