
import React, { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UnifiedDoctorCalendarProps {
  doctorId: string;
}

export const UnifiedDoctorCalendar = ({ doctorId }: UnifiedDoctorCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();
  const [startTime, setStartTime] = useState("09:00 AM");
  const [endTime, setEndTime] = useState("05:00 PM");

  const timeOptions = [
    "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM",
    "06:00 PM", "07:00 PM", "08:00 PM"
  ];

  const handleSaveAvailability = async () => {
    if (!selectedDate) return;

    try {
      const availabilityData = [{
        day_of_week: selectedDate.getDay(),
        start_time: startTime,
        end_time: endTime,
        is_available: true
      }];

      const { error } = await supabase.rpc('update_doctor_availability', {
        p_doctor_id: doctorId,
        p_availabilities: JSON.stringify(availabilityData)
      });

      if (error) throw error;

      toast({
        title: "Availability Saved",
        description: `Your availability for ${format(selectedDate, 'MMMM d, yyyy')} has been updated.`,
      });
    } catch (error) {
      console.error('Error saving availability:', error);
      toast({
        title: "Error",
        description: "Failed to save availability. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Calendar</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border shadow-sm"
          />
        </div>

        <div className="space-y-6">
          <Tabs defaultValue="availability">
            <TabsList>
              <TabsTrigger value="availability">Set Availability</TabsTrigger>
              <TabsTrigger value="appointments">View Appointments</TabsTrigger>
            </TabsList>
            
            <TabsContent value="availability" className="space-y-4">
              {selectedDate && (
                <>
                  <h3 className="text-lg font-medium mb-4">
                    {format(selectedDate, 'MMMM d, yyyy')}
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Select value={startTime} onValueChange={setStartTime}>
                        <SelectTrigger id="startTime">
                          <SelectValue placeholder="Select start time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Select value={endTime} onValueChange={setEndTime}>
                        <SelectTrigger id="endTime">
                          <SelectValue placeholder="Select end time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button 
                      className="w-full mt-4" 
                      onClick={handleSaveAvailability}
                    >
                      Save Availability
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="appointments">
              {selectedDate && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    Appointments for {format(selectedDate, 'MMMM d, yyyy')}
                  </h3>
                  {/* Appointments list will be implemented here */}
                  <div className="text-muted-foreground">
                    No appointments scheduled for this day
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
