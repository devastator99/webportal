
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
import { format, startOfDay } from "date-fns";
import { formatInTimeZone } from 'date-fns-tz';
import { supabase } from "@/integrations/supabase/client";
import { DateSelector } from "@/components/ui/date-selector";

// Define India timezone
const INDIA_TIMEZONE = 'Asia/Kolkata';

interface NewDateSelectorProps {
  form: UseFormReturn<AppointmentFormData>;
}

export function NewDateSelector({ form }: NewDateSelectorProps) {
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(false);

  // Get today's date with time set to start of day to avoid timezone issues
  const today = startOfDay(new Date());

  // Update the parent form about validation status
  const setFormValidating = (validating: boolean) => {
    // If we're validating, mark the field as validating in the form
    // This will prevent submission
    if (validating) {
      form.setError("scheduledAt", { 
        type: "validating", 
        message: "Validating date availability..."
      });
    } else {
      // Clear the validation error when done
      if (form.formState.errors.scheduledAt?.type === "validating") {
        form.clearErrors("scheduledAt");
      }
    }
  };

  // This function handles date selection from the calendar
  const handleDateSelect = async (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      form.setError("scheduledAt", { 
        type: "required", 
        message: "Date is required" 
      });
      return;
    }
    
    setIsValidating(true);
    setFormValidating(true);
    
    try {
      // Format date for database with proper timezone handling
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      console.log("Selected date formatted:", formattedDate);
      
      // Create ISO string with noon time to avoid timezone issues
      const isoDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        12, 0, 0, 0
      ).toISOString();
      
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
          form.setError("scheduledAt", { 
            type: "validate", 
            message: "Could not validate date" 
          });
          setIsValidating(false);
          setFormValidating(false);
          return;
        }
        
        console.log("Validation result:", isValid);
        
        if (!isValid) {
          toast({
            title: "Time slot unavailable",
            description: "This time slot is already booked, please select another time",
            variant: "destructive",
          });
          form.setError("scheduledAt", { 
            type: "validate", 
            message: "Time slot is already booked" 
          });
          setIsValidating(false);
          setFormValidating(false);
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
        description: `Appointment scheduled for: ${format(selectedDate, "PPP")}`,
      });
    } catch (error) {
      console.error("Error processing date:", error);
      toast({
        title: "Error",
        description: "Could not process the selected date",
        variant: "destructive",
      });
      form.setError("scheduledAt", { 
        type: "validate", 
        message: "Error processing date" 
      });
    } finally {
      setIsValidating(false);
      setFormValidating(false);
    }
  };

  return (
    <FormField
      control={form.control}
      name="scheduledAt"
      render={({ field }) => {
        // Convert string date from form to Date object for the DateSelector
        const dateValue = field.value ? new Date(field.value) : undefined;
        
        return (
          <FormItem className="flex flex-col">
            <FormLabel>Scheduled Date<span className="text-destructive ml-1">*</span></FormLabel>
            <FormControl>
              <DateSelector
                date={dateValue}
                onDateChange={handleDateSelect}
                placeholder="Select a date"
                disabledDates={(date) => date < today}
                disabled={isValidating}
              />
            </FormControl>
            <FormMessage />
            {isValidating && (
              <p className="text-sm text-muted-foreground mt-1">
                Validating availability...
              </p>
            )}
          </FormItem>
        );
      }}
    />
  );
}
