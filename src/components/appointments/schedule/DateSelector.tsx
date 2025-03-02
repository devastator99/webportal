
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    form.getValues("scheduledAt") ? new Date(form.getValues("scheduledAt")) : undefined
  );

  // When form value changes externally, update our local state
  useEffect(() => {
    const scheduledAt = form.getValues("scheduledAt");
    if (scheduledAt) {
      setSelectedDate(new Date(scheduledAt));
    }
  }, [form.getValues("scheduledAt")]);

  return (
    <FormField
      control={form.control}
      name="scheduledAt"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>Scheduled Date</FormLabel>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
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
                selected={selectedDate}
                onSelect={(date) => {
                  if (!date) return;
                  
                  // Update our local state
                  setSelectedDate(date);
                  
                  // Using both methods to ensure the form state is updated
                  field.onChange(date.toISOString());
                  
                  // Also use setValue with validation options
                  form.setValue("scheduledAt", date.toISOString(), { 
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true
                  });
                  
                  // Log to help with debugging
                  console.log("Date selected:", date, "Form value after:", form.getValues("scheduledAt"));
                  
                  // Close the calendar after a small delay to ensure value is set
                  setTimeout(() => {
                    setCalendarOpen(false);
                  }, 50);
                }}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
