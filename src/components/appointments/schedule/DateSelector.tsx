
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
  
  // For debugging
  console.log("DateSelector render state:", { 
    date, 
    popoverOpen, 
    formValue: form.getValues("scheduledAt"),
    formState: {
      isDirty: form.formState.isDirty,
      isValid: form.formState.isValid,
      errors: form.formState.errors
    }
  });
  
  // Get today's date with time set to noon to avoid timezone issues
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  
  // Set up a function to handle date changes
  const handleDateChange = (newDate: Date | undefined) => {
    if (!newDate) {
      console.log("Date selection canceled or undefined");
      return;
    }
    
    console.log("Date selected:", newDate);
    
    try {
      // Format date consistently with time set to noon to avoid timezone issues
      const formattedDate = new Date(
        newDate.getFullYear(),
        newDate.getMonth(),
        newDate.getDate(),
        12, 0, 0
      ).toISOString();
      
      console.log("Formatted date:", formattedDate);
      
      // Update local state
      setDate(newDate);
      console.log("Local state updated");
      
      // Update form value with validation
      console.log("Updating form value...");
      form.setValue("scheduledAt", formattedDate, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
      
      console.log("Form value updated:", form.getValues("scheduledAt"));
      console.log("Form state after update:", {
        isDirty: form.formState.isDirty,
        isValid: form.formState.isValid,
        errors: form.formState.errors
      });
      
      // Close the popover after a brief delay to ensure the form state is updated
      console.log("Scheduling popover close...");
      setTimeout(() => {
        console.log("Attempting to close popover");
        setPopoverOpen(false);
        console.log("Popover state set to false");
        
        // Show a toast for debugging
        toast({
          title: "Date selected",
          description: `Selected: ${format(newDate, "PPP")}`,
        });
      }, 300);
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
    console.log("useEffect triggered, form value:", scheduledAt);
    
    if (scheduledAt && (!date || date.toISOString() !== scheduledAt)) {
      console.log("Syncing local state with form value");
      try {
        const parsedDate = new Date(scheduledAt);
        console.log("Parsed date:", parsedDate);
        setDate(parsedDate);
      } catch (error) {
        console.error("Error parsing date from form:", error);
      }
    }
  }, [form, date]);
  
  // Debug the popover state changes
  useEffect(() => {
    console.log("Popover state changed:", popoverOpen);
  }, [popoverOpen]);

  return (
    <FormField
      control={form.control}
      name="scheduledAt"
      render={({ field }) => {
        console.log("FormField render, field value:", field.value);
        return (
          <FormItem className="flex flex-col">
            <FormLabel>Scheduled Date</FormLabel>
            <Popover open={popoverOpen} onOpenChange={(open) => {
              console.log("Popover onOpenChange:", open);
              setPopoverOpen(open);
            }}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                    onClick={() => {
                      console.log("Trigger button clicked");
                    }}
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
                    console.log("Calendar onSelect called with:", date);
                    handleDateChange(date);
                  }}
                  disabled={(date) => {
                    const isDisabled = date < today;
                    if (isDisabled) {
                      console.log("Date disabled:", date);
                    }
                    return isDisabled;
                  }}
                  initialFocus
                />
                <div className="p-3 border-t grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      console.log("Tomorrow button clicked");
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
                      console.log("Next Week button clicked");
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
        );
      }}
    />
  );
}
