
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TimePicker } from "@/components/ui/time-picker";

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

interface DayAvailability {
  isAvailable: boolean;
  startTime: string;
  endTime: string;
}

export const DoctorAvailability = ({ doctorId }: { doctorId: string }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [availability, setAvailability] = useState<Record<number, DayAvailability>>({});

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
        [slot.day_of_week]: {
          isAvailable: slot.is_available,
          startTime: slot.start_time,
          endTime: slot.end_time
        }
      }), {} as Record<number, DayAvailability>) : {};

      setAvailability(availabilityMap);
      return data as AvailabilityRecord[];
    }
  });

  const handleToggleDay = (day: number) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        isAvailable: !prev[day]?.isAvailable,
        startTime: prev[day]?.startTime || "09:00",
        endTime: prev[day]?.endTime || "17:00"
      }
    }));
  };

  const handleTimeChange = (day: number, type: 'startTime' | 'endTime', time: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [type]: time
      }
    }));
  };

  const handleSaveAvailability = async () => {
    setIsSubmitting(true);
    try {
      const availabilityData = Object.entries(availability).map(([day, data]) => ({
        day_of_week: parseInt(day),
        start_time: data.startTime,
        end_time: data.endTime,
        is_available: data.isAvailable
      }));

      const { error } = await supabase
        .rpc('update_doctor_availability', { 
          p_doctor_id: doctorId,
          p_availabilities: JSON.stringify(availabilityData)
        });

      if (error) throw error;

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
            <div key={day} className="space-y-2">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <Label>{day}</Label>
                </div>
                <Switch 
                  checked={availability[index + 1]?.isAvailable || false}
                  onCheckedChange={() => handleToggleDay(index + 1)}
                />
              </div>
              {availability[index + 1]?.isAvailable && (
                <div className="grid grid-cols-2 gap-4 pl-4">
                  <TimePicker
                    value={availability[index + 1]?.startTime || "09:00"}
                    onChange={(time) => handleTimeChange(index + 1, 'startTime', time)}
                    label="Start Time"
                  />
                  <TimePicker
                    value={availability[index + 1]?.endTime || "17:00"}
                    onChange={(time) => handleTimeChange(index + 1, 'endTime', time)}
                    label="End Time"
                  />
                </div>
              )}
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
