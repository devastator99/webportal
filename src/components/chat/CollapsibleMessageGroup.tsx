
import { ReactNode, useState } from "react";
import { ChevronDown, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { RoomMessage } from "@/types/chat";

interface CollapsibleMessageGroupProps {
  date: string;
  messages: RoomMessage[];
  children: ReactNode;
  isLatestGroup?: boolean;
}

export const CollapsibleMessageGroup = ({
  date,
  messages,
  children,
  isLatestGroup = false
}: CollapsibleMessageGroupProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    if (isLatestGroup) return; // Don't allow collapsing the latest group
    setIsCollapsed(!isCollapsed);
  };

  // Format the date header
  let dateHeader = date;
  try {
    const dateObj = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateObj.toDateString() === today.toDateString()) {
      dateHeader = "Today";
    } else if (dateObj.toDateString() === yesterday.toDateString()) {
      dateHeader = "Yesterday";
    } else {
      dateHeader = format(dateObj, "EEEE, MMMM d, yyyy");
    }
  } catch (e) {
    console.error("Error formatting date:", e);
  }

  return (
    <div className="message-date-group w-full">
      <div className="message-date-divider">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "px-2 py-0.5 h-auto text-xs font-normal rounded-full",
            "flex items-center gap-1 text-muted-foreground",
            isLatestGroup ? "cursor-default" : "cursor-pointer"
          )}
          onClick={toggleCollapse}
        >
          <CalendarDays className="h-3 w-3 mr-1" />
          {dateHeader}
          {!isLatestGroup && (
            <>
              {isCollapsed ? (
                <ChevronRight className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </>
          )}
        </Button>
      </div>

      <div
        className={cn(
          "transition-all duration-300 w-full",
          isCollapsed ? "h-0 overflow-hidden opacity-0" : "opacity-100"
        )}
      >
        {children}
      </div>
    </div>
  );
};
