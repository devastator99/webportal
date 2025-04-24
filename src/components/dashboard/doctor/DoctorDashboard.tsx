import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TodaySchedule } from "./TodaySchedule";
import { DoctorAppointmentCalendar } from "./DoctorAppointmentCalendar";
import { StatsCards } from "./StatsCards";
import { PrescriptionWriter } from "./prescription/PrescriptionWriter";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ScheduleAppointment } from "@/components/appointments/ScheduleAppointment";
import { useBreakpoint } from "@/hooks/use-responsive";
import { DoctorAvailability } from "./DoctorAvailability";

export const DoctorDashboard = () => {
  const { user } = useAuth();
  const { isSmallScreen } = useBreakpoint();
  
  if (!user) return null;

  return (
    <div className="space-y-4 animate-fade-up p-4">
      {/* Welcome Section */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-semibold text-primary">
                  {user.user_metadata.first_name?.[0]}{user.user_metadata.last_name?.[0]}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  Welcome, Dr. {user.user_metadata.last_name}
                </h2>
                <p className="text-muted-foreground">
                  Here's your daily overview
                </p>
              </div>
            </div>
            
            <ScheduleAppointment callerRole="doctor" preSelectedDoctorId={user.id}>
              <Button size={isSmallScreen ? "sm" : "default"} className="bg-primary">
                <Plus className="mr-2 h-4 w-4" />
                Schedule Appointment
              </Button>
            </ScheduleAppointment>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      <StatsCards />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Today's Schedule - Takes 4 columns on desktop */}
        <div className="md:col-span-4">
          <TodaySchedule />
        </div>

        {/* Appointment Calendar - Takes 8 columns on desktop */}
        <div className="md:col-span-8">
          <DoctorAppointmentCalendar doctorId={user.id} />
        </div>
      </div>

      {/* Prescription Writer Section */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Prescription</CardTitle>
        </CardHeader>
        <CardContent>
          <PrescriptionWriter />
        </CardContent>
      </Card>
    </div>
  );
};
