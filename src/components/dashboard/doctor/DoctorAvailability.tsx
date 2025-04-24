
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export const DoctorAvailability = ({ doctorId }: { doctorId: string }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { data: availability, isLoading } = useQuery({
    queryKey: ["doctor-availability", doctorId],
    queryFn: async () => {
      // Use raw query instead of rpc to avoid type errors
      const { data, error } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', doctorId);

      if (error) {
        console.error("Error fetching availability:", error);
        return null;
      }

      return data;
    }
  });

  const handleSaveAvailability = async () => {
    setIsSubmitting(true);
    try {
      const timeSlots = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day, index) => ({
        dayOfWeek: index + 1, // 1 = Monday, 5 = Friday
        startTime: "09:00",
        endTime: "17:00",
        isAvailable: true
      }));

      // Use direct inserts/updates instead of rpc calls
      for (const slot of timeSlots) {
        const { error } = await supabase
          .from('doctor_availability')
          .upsert({
            doctor_id: doctorId,
            day_of_week: slot.dayOfWeek,
            start_time: slot.startTime,
            end_time: slot.endTime,
            is_available: slot.isAvailable
          }, { 
            onConflict: 'doctor_id,day_of_week' 
          });
          
        if (error) {
          console.error("Error updating availability:", error);
          throw error;
        }
      }

      toast({
        title: "Availability Updated",
        description: "Your availability has been successfully updated.",
      });
    } catch (error) {
      console.error("Error saving availability:", error);
      toast({
        title: "Error",
        description: "Failed to update availability. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Availability Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
            <div key={day} className="flex items-center justify-between border-b pb-2">
              <div>
                <Label>{day}</Label>
              </div>
              <div className="flex items-center gap-4">
                <Switch />
                <span className="text-sm text-muted-foreground">
                  9:00 AM - 5:00 PM
                </span>
              </div>
            </div>
          ))}
          <Button 
            onClick={handleSaveAvailability}
            disabled={isSubmitting}
            className="w-full mt-4"
          >
            Save Availability
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
