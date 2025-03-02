
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
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
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { AppointmentFormData } from "./schema";

interface DateSelectorProps {
  form: UseFormReturn<AppointmentFormData>;
}

export function DateSelector({ form }: DateSelectorProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [popoverOpen, setPopoverOpen] = useState(false);
  
  // Get today's date with time set to noon to avoid timezone issues
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  
  // Set up a function to handle date changes
  const handleDateChange = (newDate: Date | undefined) => {
    if (!newDate) return;
    
    // Format date consistently with time set to noon to avoid timezone issues
    const formattedDate = new Date(
      newDate.getFullYear(),
      newDate.getMonth(),
      newDate.getDate(),
      12, 0, 0
    ).toISOString();
    
    // Update local state
    setDate(newDate);
    
    // Update form value with validation
    form.setValue("scheduledAt", formattedDate, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
    
    // Close the popover after a brief delay to ensure the form state is updated
    setTimeout(() => {
      setPopoverOpen(false);
    }, 100);
  };
  
  // Sync component state with form state when form value changes externally
  useEffect(() => {
    const scheduledAt = form.getValues("scheduledAt");
    if (scheduledAt && (!date || date.toISOString() !== scheduledAt)) {
      setDate(new Date(scheduledAt));
    }
  }, [form, date]);

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
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateChange}
                disabled={(date) => date < today}
                initialFocus
              />
              <div className="p-3 border-t grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    handleDateChange(tomorrow);
                  }}
                >
                  Tomorrow
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const nextWeek = new Date(today);
                    nextWeek.setDate(nextWeek.getDate() + 7);
                    handleDateChange(nextWeek);
                  }}
                >
                  Next Week
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
