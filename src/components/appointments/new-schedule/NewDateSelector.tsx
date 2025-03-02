
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
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface NewDateSelectorProps {
  form: UseFormReturn<AppointmentFormData>;
}

export function NewDateSelector({ form }: NewDateSelectorProps) {
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [isValidating, setIsValidating] = useState(false);

  // This function handles date selection from the calendar
  const handleDateSelect = async (selectedDate: Date | undefined, onChange: (value: string) => void) => {
    if (!selectedDate) return;
    
    setDate(selectedDate);
    setIsValidating(true);
    
    try {
      // Convert to ISO string for database
      const isoString = selectedDate.toISOString();
      const doctorId = form.getValues().doctorId;
      
      // Only validate if doctor is selected
      if (doctorId) {
        // Use RPC call to validate appointment date
        const { data: isValid, error } = await supabase.rpc(
          'validate_appointment_date',
          { 
            p_doctor_id: doctorId,
            p_scheduled_date: isoString
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
      
      // Update form with ISO string
      onChange(isoString);
      
      // Also update the form value directly to ensure it's set correctly
      form.setValue("scheduledAt", isoString, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });
      
      toast({
        title: "Date selected",
        description: `Appointment scheduled for: ${format(selectedDate, "PPP")}`,
      });
    } catch (error) {
      console.error("Error formatting date:", error);
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
          <Popover>
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
                  {date ? format(date, "PPP") : "Select a date"}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(selectedDate) => handleDateSelect(selectedDate, field.onChange)}
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
