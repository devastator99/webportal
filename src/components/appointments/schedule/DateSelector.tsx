
import { useState, useEffect } from "react";
import { format, startOfDay } from "date-fns";
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
import { useToast } from "@/hooks/use-toast";

interface DateSelectorProps {
  form: UseFormReturn<AppointmentFormData>;
}

export function DateSelector({ form }: DateSelectorProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  // Get today's date with time set to start of day to avoid timezone issues
  const today = startOfDay(new Date());
  
  // Handle date selection from calendar
  const handleDateChange = (newDate: Date | undefined) => {
    if (!newDate) {
      return;
    }
    
    console.log("Date selected:", newDate);
    
    try {
      // First update the local state
      setDate(newDate);
      
      // Normalize the date to start of day to avoid timezone issues
      const normalizedDate = startOfDay(newDate);
      const formattedDate = normalizedDate.toISOString();
      
      console.log("Setting form value to:", formattedDate);
      
      // Update form value
      form.setValue("scheduledAt", formattedDate, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
      
      // Close the popover
      setOpen(false);
      
      // Show toast notification
      toast({
        title: "Date selected",
        description: `Selected: ${format(newDate, "PPP")}`,
      });
    } catch (error) {
      console.error("Error handling date change:", error);
      toast({
        title: "Error",
        description: "Failed to process the selected date",
        variant: "destructive",
      });
      
      // Set error in form
      form.setError("scheduledAt", {
        type: "validate",
        message: "Error processing date"
      });
    }
  };
  
  // Quick selection buttons
  const handleQuickSelect = (daysToAdd: number) => {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + daysToAdd);
    handleDateChange(newDate);
  };
  
  // Sync component state with form state when form value changes externally
  useEffect(() => {
    const scheduledAt = form.getValues("scheduledAt");
    
    if (scheduledAt && (!date || date.toISOString() !== scheduledAt)) {
      try {
        const parsedDate = new Date(scheduledAt);
        setDate(parsedDate);
      } catch (error) {
        console.error("Error parsing date from form:", error);
      }
    }
  }, [form, date]);

  return (
    <FormField
      control={form.control}
      name="scheduledAt"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>Scheduled Date<span className="text-destructive ml-1">*</span></FormLabel>
          <Popover open={open} onOpenChange={setOpen}>
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
                  onClick={(e) => {
                    e.preventDefault();
                    handleQuickSelect(1);
                  }}
                >
                  Tomorrow
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    handleQuickSelect(7);
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
