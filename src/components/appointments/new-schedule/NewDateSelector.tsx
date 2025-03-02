
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AppointmentFormData } from "../schedule/schema";
import { useToast } from "@/hooks/use-toast";

interface NewDateSelectorProps {
  form: UseFormReturn<AppointmentFormData>;
}

export function NewDateSelector({ form }: NewDateSelectorProps) {
  const { toast } = useToast();
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, onChange: (value: string) => void) => {
    const inputValue = e.target.value;
    
    // Update the form
    onChange(inputValue);
    
    // Creating ISO string from input
    if (inputValue && isValidDateFormat(inputValue)) {
      try {
        // Convert to ISO string for database
        const date = new Date(inputValue);
        const isoString = date.toISOString();
        
        // Update form with ISO string
        form.setValue("scheduledAt", isoString, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true
        });
        
        toast({
          title: "Date formatted",
          description: `Date set to: ${isoString}`,
        });
      } catch (error) {
        console.error("Error formatting date:", error);
      }
    }
  };

  // Simple validation for YYYY-MM-DD format
  const isValidDateFormat = (dateString: string): boolean => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(dateString);
  };

  return (
    <FormField
      control={form.control}
      name="scheduledAt"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>Scheduled Date</FormLabel>
          <FormControl>
            <Input
              type="text"
              placeholder="YYYY-MM-DD"
              {...field}
              onChange={(e) => handleDateChange(e, field.onChange)}
            />
          </FormControl>
          <p className="text-xs text-muted-foreground mt-1">
            Enter date in YYYY-MM-DD format (e.g., 2024-05-15)
          </p>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
