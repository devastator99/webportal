
import { useState } from "react";
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
import { AppointmentFormData } from "../schedule/schema";
import { useToast } from "@/hooks/use-toast";

interface NewDateSelectorProps {
  form: UseFormReturn<AppointmentFormData>;
}

export function NewDateSelector({ form }: NewDateSelectorProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  
  // Get today's date with time set to noon to avoid timezone issues
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const handleSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;
    
    try {
      // First format the date properly
      const formattedDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        12, 0, 0
      ).toISOString();
      
      // Update the form value
      form.setValue("scheduledAt", formattedDate, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
      
      // Update our local state
      setDate(selectedDate);
      
      // Show success toast
      toast({
        title: "Date selected",
        description: `Selected: ${format(selectedDate, "PPP")}`,
      });
      
      // Close the popover AFTER everything is done
      setIsOpen(false);
    } catch (error) {
      console.error("Error handling date selection:", error);
      toast({
        title: "Error",
        description: `Failed to process date: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  };

  // Helper for quick date selections
  const handleQuickSelect = (daysToAdd: number) => {
    const selectedDate = new Date(today);
    selectedDate.setDate(selectedDate.getDate() + daysToAdd);
    handleSelect(selectedDate);
  };

  return (
    <FormField
      control={form.control}
      name="scheduledAt"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>Scheduled Date</FormLabel>
          <Popover open={isOpen} onOpenChange={setIsOpen}>
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
                onSelect={handleSelect}
                disabled={(date) => date < today}
                initialFocus
              />
              <div className="p-3 border-t grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    handleQuickSelect(1); // Tomorrow
                  }}
                >
                  Tomorrow
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    handleQuickSelect(7); // Next Week
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
