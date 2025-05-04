
import React, { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { CalendarIcon, ChevronDown, ChevronUp, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBreakpoint } from "@/hooks/use-responsive";
import { ResponsiveText } from "@/components/ui/responsive-typography";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface DoctorAppointmentCalendarProps {
  doctorId: string;
}

interface AppointmentWithPatient {
  id: string;
  scheduled_at: string;
  status: "scheduled" | "completed" | "cancelled";
  patient_json: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export const DoctorAppointmentCalendar = ({ doctorId }: DoctorAppointmentCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isOpen, setIsOpen] = useState(true);
  const [calendarTab, setCalendarTab] = useState<string>("appointments");
  const [startTime, setStartTime] = useState("09:00 AM");
  const [endTime, setEndTime] = useState("05:00 PM");
  const { toast } = useToast();
  const { isSmallScreen, isMediumScreen } = useBreakpoint();

  const formattedDate = format(selectedDate, "yyyy-MM-dd");

  const {
    data: appointments = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["doctor-appointments", doctorId, formattedDate],
    queryFn: async () => {
      if (!doctorId) return [];

      const { data, error } = await supabase.rpc("get_appointments_by_date", {
        p_doctor_id: doctorId,
        p_date: formattedDate,
      });

      if (error) {
        console.error("Error fetching appointments:", error);
        throw error;
      }

      return data as AppointmentWithPatient[];
    },
    enabled: !!doctorId,
  });

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const timeOptions = [
    "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM",
    "06:00 PM", "07:00 PM", "08:00 PM"
  ];

  const handleSaveAvailability = async () => {
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
    <Card className="shadow-sm">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className={`pb-3 ${isSmallScreen ? 'p-3' : ''}`}>
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className={isSmallScreen ? 'text-lg' : 'text-2xl'}>
                  Appointment Calendar
                </CardTitle>
                <CollapsibleTrigger 
                  className="hover:bg-gray-100 p-1 rounded-full transition-colors"
                >
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </CollapsibleTrigger>
              </div>
              <CardDescription>
                {format(selectedDate, "MMMM d, yyyy")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className={isSmallScreen ? 'p-3 pt-0' : ''}>
            <div className={`grid ${isSmallScreen ? 'grid-cols-1 gap-4' : isMediumScreen ? 'grid-cols-1 md:grid-cols-7 gap-6' : 'md:grid-cols-7 gap-8'}`}>
              <div className={isSmallScreen ? 'w-full' : isMediumScreen ? 'w-full' : 'md:col-span-3'}>
                <div className={`flex ${isSmallScreen ? 'justify-center' : isMediumScreen ? 'justify-center md:justify-start' : 'justify-center md:justify-start'}`}>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateChange}
                    className={`border rounded-md bg-white shadow-sm ${isSmallScreen ? 'scale-90 transform origin-top' : ''}`}
                  />
                </div>
              </div>

              <div className={isSmallScreen ? 'w-full mt-2' : isMediumScreen ? 'w-full md:col-span-4' : 'md:col-span-4'}>
                <div className="bg-slate-50 p-3 sm:p-4 rounded-lg h-full">
                  <Tabs value={calendarTab} onValueChange={setCalendarTab}>
                    <TabsList className="mb-4">
                      <TabsTrigger value="appointments">Appointments</TabsTrigger>
                      <TabsTrigger value="availability">Set Availability</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="appointments">
                      <div className="flex items-center mb-3 sm:mb-4">
                        <CalendarIcon className="mr-2 h-4 w-4 text-[#9b87f5]" />
                        <ResponsiveText weight="semibold" mobileSize="sm" tabletSize="base">
                          Appointments for {format(selectedDate, "MMMM d")}
                        </ResponsiveText>
                      </div>

                      {isLoading ? (
                        <div className="space-y-3">
                          <Skeleton className="h-16 w-full" />
                          <Skeleton className="h-16 w-full" />
                          <Skeleton className="h-16 w-full" />
                        </div>
                      ) : isError ? (
                        <div className="text-red-500 p-4 bg-red-50 rounded-md">
                          Error loading appointments: {(error as Error).message}
                        </div>
                      ) : appointments.length === 0 ? (
                        <div className="text-center py-6 sm:py-8 text-gray-500 bg-white rounded-md border border-dashed border-gray-300">
                          <p className="mb-3 text-sm sm:text-base">No appointments scheduled</p>
                        </div>
                      ) : (
                        <div className="space-y-2 sm:space-y-3 max-h-[250px] sm:max-h-[350px] overflow-y-auto pr-2">
                          {appointments.map((appointment) => (
                            <div
                              key={appointment.id}
                              className="flex flex-col p-3 sm:p-4 border rounded-lg bg-white hover:bg-slate-50 transition-colors shadow-sm"
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <User className="mr-2 h-4 w-4 text-slate-500" />
                                  <span className={`font-medium ${isSmallScreen ? 'text-sm' : ''}`}>
                                    {appointment.patient_json.first_name} {appointment.patient_json.last_name}
                                  </span>
                                </div>
                                <Badge
                                  className={`text-xs ${
                                    appointment.status === "scheduled" ? "bg-blue-500" : 
                                    appointment.status === "completed" ? "bg-green-500" : 
                                    "bg-red-500"
                                  }`}
                                >
                                  {appointment.status}
                                </Badge>
                              </div>
                              <div className="flex items-center mt-2 text-slate-500">
                                <Clock className="mr-2 h-3 w-3" />
                                <time dateTime={appointment.scheduled_at} className={isSmallScreen ? 'text-xs' : 'text-sm'}>
                                  {format(parseISO(appointment.scheduled_at), "h:mm a")}
                                </time>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="availability">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium mb-4">
                          Set Availability for {format(selectedDate, 'MMMM d, yyyy')}
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
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
