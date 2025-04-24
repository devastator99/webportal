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
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface AvailabilityRecord {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export const DoctorAvailability = ({ doctorId }: { doctorId: string }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [availability, setAvailability] = React.useState<Record<number, boolean>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["doctor-availability", doctorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_doctor_availability', { p_doctor_id: doctorId });

      if (error) {
        console.error("Error fetching availability:", error);
        return null;
      }

      // Convert data to state format
      const availabilityMap = Array.isArray(data) ? data.reduce((acc, slot: AvailabilityRecord) => ({
        ...acc,
        [slot.day_of_week]: slot.is_available
      }), {} as Record<number, boolean>) : {};

      setAvailability(availabilityMap);
      return data as AvailabilityRecord[];
    }
  });

  const handleToggleDay = (day: number) => {
    setAvailability(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };

  const handleSaveAvailability = async () => {
    setIsSubmitting(true);
    try {
      const availabilityData = Object.entries(availability).map(([day, isAvailable]) => ({
        day_of_week: parseInt(day),
        start_time: "09:00",
        end_time: "17:00",
        is_available: isAvailable
      }));

      const { error } = await supabase
        .rpc('update_doctor_availability', { 
          p_doctor_id: doctorId,
          p_availabilities: JSON.stringify(availabilityData)
        });

      if (error) {
        throw error;
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

  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

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
          {dayNames.map((day, index) => (
            <div key={day} className="flex items-center justify-between border-b pb-2">
              <div>
                <Label>{day}</Label>
              </div>
              <div className="flex items-center gap-4">
                <Switch 
                  checked={availability[index + 1] || false}
                  onCheckedChange={() => handleToggleDay(index + 1)}
                />
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
