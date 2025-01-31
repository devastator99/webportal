import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, FileText, Clock } from "lucide-react";
import { format } from "date-fns";

interface StatsCardsProps {
  patientsCount: number;
  todayAppointmentsCount: number;
  medicalRecordsCount: number;
  upcomingAppointmentsCount: number;
}

export const StatsCards = ({
  patientsCount,
  todayAppointmentsCount,
  medicalRecordsCount,
  upcomingAppointmentsCount,
}: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{patientsCount}</div>
          <p className="text-xs text-muted-foreground">Active patients under care</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{todayAppointmentsCount}</div>
          <p className="text-xs text-muted-foreground">Scheduled for today</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Medical Records</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{medicalRecordsCount}</div>
          <p className="text-xs text-muted-foreground">Total records created</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Consultations</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{upcomingAppointmentsCount}</div>
          <p className="text-xs text-muted-foreground">Pending appointments</p>
        </CardContent>
      </Card>
    </div>
  );
};