
import { useState } from "react";
import { format, startOfDay } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface DateSelectorProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabledDates?: (date: Date) => boolean;
}

export function DateSelector({
  date,
  onDateChange,
  placeholder = "Select date",
  className,
  disabledDates,
}: DateSelectorProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (newDate: Date | undefined) => {
    if (newDate) {
      // Normalize date to start of day to avoid timezone issues
      const normalizedDate = startOfDay(newDate);
      console.log("Date selected:", normalizedDate);
      
      // Close popover after selection
      setOpen(false);
      
      // Call the provided callback with the new date
      onDateChange(normalizedDate);
    }
  };

  // For quick access buttons
  const handleQuickSelect = (daysToAdd: number) => {
    const today = new Date();
    const newDate = new Date(today);
    newDate.setDate(today.getDate() + daysToAdd);
    
    // Use the same handler to normalize and propagate the date
    handleSelect(newDate);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          disabled={disabledDates}
          initialFocus
        />
        <div className="p-3 border-t grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickSelect(1)}
          >
            Tomorrow
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickSelect(7)}
          >
            Next Week
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
