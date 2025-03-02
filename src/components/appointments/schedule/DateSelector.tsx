
import { useState } from "react";
import { format, addDays } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { AppointmentFormData } from "./schema";

interface DateSelectorProps {
  form: UseFormReturn<AppointmentFormData>;
}

export function DateSelector({ form }: DateSelectorProps) {
  // Base calendar on today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Generate dates for next 30 days (excluding today)
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [popoverOpen, setPopoverOpen] = useState(false);
  
  // Get the days in the current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Create array of dates for the month
    const dates: Date[] = [];
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const current = new Date(year, month, d);
      dates.push(current);
    }
    
    return dates;
  };
  
  // Get days from previous month to fill the first week
  const getLeadingDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const dayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    if (dayOfWeek === 0) return []; // Sunday, no leading days needed
    
    const prevMonth = new Date(year, month, 0);
    const daysInPrevMonth = prevMonth.getDate();
    
    const leadingDays: Date[] = [];
    for (let i = dayOfWeek - 1; i >= 0; i--) {
      const day = new Date(year, month - 1, daysInPrevMonth - i);
      leadingDays.push(day);
    }
    
    return leadingDays;
  };
  
  // Get days from next month to fill the last week
  const getTrailingDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    const dayOfWeek = lastDay.getDay(); // 0 = Sunday, 6 = Saturday
    
    if (dayOfWeek === 6) return []; // Saturday, no trailing days needed
    
    const trailingDays: Date[] = [];
    for (let i = 1; i <= 6 - dayOfWeek; i++) {
      const day = new Date(year, month + 1, i);
      trailingDays.push(day);
    }
    
    return trailingDays;
  };
  
  const daysInMonth = getDaysInMonth(currentMonth);
  const leadingDays = getLeadingDays(currentMonth);
  const trailingDays = getTrailingDays(currentMonth);
  const allDays = [...leadingDays, ...daysInMonth, ...trailingDays];
  
  const weeks: Date[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }
  
  const nextMonth = () => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + 1);
    setCurrentMonth(next);
  };
  
  const prevMonth = () => {
    const prev = new Date(currentMonth);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentMonth(prev);
  };
  
  const selectDate = (date: Date) => {
    // Format date to avoid time zone issues
    const isoDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      12, 0, 0
    ).toISOString();
    
    // Update the form with the ISO string
    form.setValue("scheduledAt", isoDate, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
    
    // Close the popover
    setPopoverOpen(false);
  };
  
  // Determine if a date is disabled (before today)
  const isDisabled = (date: Date) => {
    return date < today;
  };
  
  // Determine if a date is the currently selected date
  const isSelected = (date: Date) => {
    const selectedDate = form.getValues("scheduledAt");
    if (!selectedDate) return false;
    
    const selected = new Date(selectedDate);
    return (
      date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()
    );
  };
  
  // Determine if a date is from another month
  const isOtherMonth = (date: Date) => {
    return date.getMonth() !== currentMonth.getMonth();
  };

  return (
    <FormField
      control={form.control}
      name="scheduledAt"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>Scheduled Date</FormLabel>
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full pl-3 text-left font-normal",
                    !field.value && "text-muted-foreground"
                  )}
                  onClick={() => setPopoverOpen(true)}
                >
                  {field.value ? (
                    format(new Date(field.value), "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
              <div className="space-y-4">
                {/* Calendar Header */}
                <div className="flex items-center justify-between">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={prevMonth}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="font-medium">
                    {format(currentMonth, "MMMM yyyy")}
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={nextMonth}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Calendar Body */}
                <div>
                  {/* Days of Week */}
                  <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} className="py-1">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {allDays.map((date, i) => (
                      <Button
                        key={i}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-9 w-9 p-0 font-normal",
                          isOtherMonth(date) && "text-muted-foreground opacity-50",
                          isSelected(date) && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                          isDisabled(date) && "text-muted-foreground opacity-50 cursor-not-allowed hover:bg-transparent"
                        )}
                        disabled={isDisabled(date)}
                        onClick={() => !isDisabled(date) && selectDate(date)}
                      >
                        {date.getDate()}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Quick Select Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectDate(addDays(today, 1))}
                  >
                    Tomorrow
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectDate(addDays(today, 7))}
                  >
                    Next Week
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
