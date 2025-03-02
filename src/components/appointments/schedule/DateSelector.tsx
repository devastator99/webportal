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
import { useToast } from "@/hooks/use-toast";

interface DateSelectorProps {
  form: UseFormReturn<AppointmentFormData>;
}

export function DateSelector({ form }: DateSelectorProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { toast } = useToast();
  
  // Get today's date with time set to noon to avoid timezone issues
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  
  // Handle date selection from calendar
  const handleDateChange = (newDate: Date | undefined) => {
    if (!newDate) {
      console.log("Date selection canceled or undefined");
      return;
    }
    
    console.log("Date selected:", newDate);
    
    try {
      // First update the local state
      setDate(newDate);
      
      // Create a new date object with time set to noon to avoid timezone issues
      const year = newDate.getFullYear();
      const month = newDate.getMonth();
      const day = newDate.getDate();
      const normalizedDate = new Date(year, month, day, 12, 0, 0, 0);
      const formattedDate = normalizedDate.toISOString();
      
      console.log("Setting form value to:", formattedDate);
      
      // Update form value BEFORE closing popover
      form.setValue("scheduledAt", formattedDate, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
      
      console.log("Form value updated, now closing popover");
      
      // Close popover AFTER form value is set
      setPopoverOpen(false);
      
      // Show toast notification
      toast({
        title: "Date selected",
        description: `Selected: ${format(newDate, "PPP")}`,
      });
    } catch (error) {
      console.error("Error handling date change:", error);
      toast({
        title: "Error",
        description: `Failed to process date: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
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
          <FormLabel>Scheduled Date</FormLabel>
          <Popover 
            open={popoverOpen} 
            onOpenChange={(open) => {
              // Only handle opening the popover or explicit closing
              if (open) {
                setPopoverOpen(open);
              }
            }}
          >
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
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(date) => {
                  handleDateChange(date);
                }}
                disabled={(date) => date < today}
                initialFocus
              />
              <div className="p-3 border-t grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
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
                  onClick={(e) => {
                    e.preventDefault();
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
