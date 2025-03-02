
import React, { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl font-bold">Appointment Calendar</CardTitle>
        <CardDescription>
          View and manage your appointments for {format(selectedDate, "MMMM d, yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateChange}
              className="border rounded-md"
            />
          </div>
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5" />
              Appointments for {format(selectedDate, "MMMM d, yyyy")}
            </h3>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : isError ? (
              <div className="text-red-500">
                Error loading appointments: {(error as Error).message}
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No appointments scheduled for this day
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex flex-col p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex justify-between">
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4 text-slate-500" />
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
      </CardContent>
    </Card>
  );
};
