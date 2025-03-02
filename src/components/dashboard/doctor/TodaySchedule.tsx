
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Clock } from "lucide-react";
import { format, parseISO, isToday } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

export const TodaySchedule = () => {
  const { user } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");

  const {
    data: appointments = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["today-schedule", user?.id, today],
    queryFn: async () => {
      if (!user?.id) return [];

      // Call RPC function to get today's appointments
      const { data, error } = await supabase.rpc("get_appointments_by_date", {
        p_doctor_id: user.id,
        p_date: today,
      });

      if (error) {
        console.error("Error fetching today's appointments:", error);
        throw error;
      }

      return data as AppointmentWithPatient[];
    },
    enabled: !!user?.id,
  });

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold">Today's Schedule</CardTitle>
        <CardDescription>
          Your appointments for {format(new Date(), "MMMM d, yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : isError ? (
          <div className="text-red-500">
            Error loading schedule: {(error as Error).message}
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No appointments scheduled for today
          </div>
        ) : (
          <div className="space-y-3">
            {appointments
              .sort((a, b) => {
                return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
              })
              .map((appointment) => (
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
      </CardContent>
    </Card>
  );
};
