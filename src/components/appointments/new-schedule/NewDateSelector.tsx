
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { AppointmentFormData } from "../schedule/schema";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfDay } from "date-fns";
import { formatInTimeZone } from 'date-fns-tz';
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

// Define India timezone
const INDIA_TIMEZONE = 'Asia/Kolkata';

interface NewDateSelectorProps {
  form: UseFormReturn<AppointmentFormData>;
}

export function NewDateSelector({ form }: NewDateSelectorProps) {
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [isValidating, setIsValidating] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Get today's date with time set to start of day to avoid timezone issues
  const today = startOfDay(new Date());

  // This function handles date selection from the calendar
  const handleDateSelect = async (selectedDate: Date | undefined) => {
    if (!selectedDate) return;
    
    // Normalize the selected date to avoid timezone issues
    const normalizedDate = startOfDay(selectedDate);
    setDate(normalizedDate);
    setIsValidating(true);
    
    try {
      // Format date for database with proper timezone handling
      const formattedDate = format(normalizedDate, "yyyy-MM-dd");
      console.log("Selected date formatted:", formattedDate);
      
      // Create ISO string with noon time to avoid timezone issues
      const year = normalizedDate.getFullYear();
      const month = normalizedDate.getMonth();
      const day = normalizedDate.getDate();
      const isoDate = new Date(year, month, day, 12, 0, 0, 0).toISOString();
      console.log("ISO date string:", isoDate);
      
      const doctorId = form.getValues().doctorId;
      
      // Only validate if doctor is selected
      if (doctorId) {
        console.log("Validating appointment for doctor:", doctorId, "date:", isoDate);
        
        // Use RPC call to validate appointment date
        const { data: isValid, error } = await supabase.rpc(
          'validate_appointment_date',
          { 
            p_doctor_id: doctorId,
            p_scheduled_date: isoDate
          }
        );
        
        if (error) {
          console.error("Error validating date:", error);
          toast({
            title: "Error",
            description: "Could not validate appointment date",
            variant: "destructive",
          });
          setIsValidating(false);
          return;
        }
        
        console.log("Validation result:", isValid);
        
        if (!isValid) {
          toast({
            title: "Time slot unavailable",
            description: "This time slot is already booked, please select another time",
            variant: "destructive",
          });
          setIsValidating(false);
          return;
        }
      }
      
      console.log("Setting form value:", isoDate);
      
      // Update form with ISO string, ensuring we set it properly
      form.setValue("scheduledAt", isoDate, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });
      
      toast({
        title: "Date selected",
        description: `Appointment scheduled for: ${formatInTimeZone(normalizedDate, INDIA_TIMEZONE, "PPP")}`,
      });
      
      // Close the popover after successful selection
      setPopoverOpen(false);
    } catch (error) {
      console.error("Error processing date:", error);
      toast({
        title: "Error",
        description: "Could not process the selected date",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

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
              setPopoverOpen(open);
            }}
          >
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full pl-3 text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                  disabled={isValidating}
                >
                  {date ? formatInTimeZone(date, INDIA_TIMEZONE, "PPP") : "Select a date"}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
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
                    handleDateSelect(tomorrow);
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
                    handleDateSelect(nextWeek);
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
