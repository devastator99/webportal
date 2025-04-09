
import React, { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Clock, Plus, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScheduleAppointment } from "@/components/appointments/ScheduleAppointment";
import { Button } from "@/components/ui/button";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // Format the selected date to be used in the query
  const formattedDate = format(selectedDate, "yyyy-MM-dd");

  // Fetch appointments for the selected date
  const {
    data: appointments = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["doctor-appointments", doctorId, formattedDate],
    queryFn: async () => {
      if (!doctorId) return [];

      // Call RPC function to get appointments for this doctor on the selected date
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

  // Handle date change
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  // Callback when an appointment is scheduled
  const handleAppointmentScheduled = () => {
    queryClient.invalidateQueries({
      queryKey: ["doctor-appointments", doctorId, formattedDate],
    });
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-bold">Appointment Calendar</CardTitle>
            <CardDescription>
              View and manage your appointments for {format(selectedDate, "MMMM d, yyyy")}
            </CardDescription>
          </div>
          <ScheduleAppointment 
            callerRole="doctor" 
            preSelectedDoctorId={doctorId}
            preSelectedDate={selectedDate}>
            <Button 
              className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white flex items-center gap-1"
              onClick={() => {}}>
              <Plus size={16} />
              <span>Schedule</span>
            </Button>
          </ScheduleAppointment>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-6' : 'md:grid-cols-7 gap-8'}`}>
          {/* Calendar takes up 3 columns on desktop */}
          <div className={isMobile ? 'w-full' : 'md:col-span-3'}>
            <div className="flex justify-center md:justify-start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateChange}
                className="border rounded-md bg-white shadow-sm"
              />
            </div>
          </div>

          {/* Appointments take up 4 columns on desktop */}
          <div className={isMobile ? 'w-full mt-6 md:mt-0' : 'md:col-span-4'}>
            <div className="bg-slate-50 p-4 rounded-lg h-full">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <CalendarIcon className="mr-2 h-5 w-5 text-[#9b87f5]" />
                Appointments for {format(selectedDate, "MMMM d, yyyy")}
              </h3>

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
                <div className="text-center py-8 text-gray-500 bg-white rounded-md border border-dashed border-gray-300">
                  No appointments scheduled for this day
                  <div className="mt-4">
                    <ScheduleAppointment 
                      callerRole="doctor" 
                      preSelectedDoctorId={doctorId}
                      preSelectedDate={selectedDate}>
                      <Button 
                        className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white flex items-center gap-1"
                        onClick={() => {}}>
                        <Plus size={16} />
                        <span>Schedule Appointment</span>
                      </Button>
                    </ScheduleAppointment>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                  {appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex flex-col p-4 border rounded-lg bg-white hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <User className="mr-2 h-5 w-5 text-slate-500" />
                          <span className="font-medium">
                            {appointment.patient_json.first_name} {appointment.patient_json.last_name}
                          </span>
                        </div>
                        <Badge
                          className={`
                            ${appointment.status === "scheduled" ? "bg-blue-500" : ""}
                            ${appointment.status === "completed" ? "bg-green-500" : ""}
                            ${appointment.status === "cancelled" ? "bg-red-500" : ""}
                          `}
                        >
                          {appointment.status}
                        </Badge>
                      </div>
                      <div className="flex items-center mt-2 text-slate-500">
                        <Clock className="mr-2 h-4 w-4" />
                        <time dateTime={appointment.scheduled_at}>
                          {format(parseISO(appointment.scheduled_at), "h:mm a")}
                        </time>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
