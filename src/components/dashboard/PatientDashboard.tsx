import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MessageSquare, FileText, Clock, Heart, LogOut } from "lucide-react";
import { ChatInterface } from "../chat/ChatInterface";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ScheduleAppointment } from "../appointments/ScheduleAppointment";
import { DashboardSkeleton } from "./DashboardSkeleton";

export const PatientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      navigate("/auth");
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast({
        title: "Error signing out",
        description: error.message || "An error occurred while signing out. Please try again.",
        variant: "destructive",
      });
      navigate("/auth");
    }
  };

  // Optimized query to fetch all patient data in one go
  const { data: patientData, isLoading } = useQuery({
    queryKey: ["patient_dashboard", user?.id],
    queryFn: async () => {
      const [
        { data: appointments, error: appointmentsError },
        { data: medicalRecords, error: medicalRecordsError },
        { data: profile, error: profileError }
      ] = await Promise.all([
        supabase
          .from("appointments")
          .select(`
            id,
            scheduled_at,
            status,
            doctor:profiles!appointments_doctor_profile_fkey(first_name, last_name)
          `)
          .eq("patient_id", user?.id)
          .order("scheduled_at", { ascending: true }),
        supabase
          .from("medical_records")
          .select("*")
          .eq("patient_id", user?.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("*")
          .eq("id", user?.id)
          .maybeSingle()
      ]);

      if (appointmentsError) throw appointmentsError;
      if (medicalRecordsError) throw medicalRecordsError;
      if (profileError) throw profileError;

      return {
        appointments: appointments || [],
        medicalRecords: medicalRecords || [],
        profile
      };
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const scheduledAppointments = patientData?.appointments.filter(a => a.status === 'scheduled') || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Welcome, {patientData?.profile?.first_name || "Patient"}</h1>
        <div className="flex gap-4">
          <ScheduleAppointment>
            <Button>Schedule Appointment</Button>
          </ScheduleAppointment>
          <Button 
            variant="outline" 
            onClick={handleSignOut}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledAppointments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medical Records</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patientData?.medicalRecords.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Status</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Good</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Check-up</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scheduledAppointments.length > 0 ? new Date(scheduledAppointments[0].scheduled_at).toLocaleDateString() : 'No appointments'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {scheduledAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">
                          Dr. {appointment.doctor.first_name} {appointment.doctor.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(appointment.scheduled_at).toLocaleString()}
                        </p>
                      </div>
                      <span className="capitalize px-2 py-1 bg-primary/10 rounded-full text-sm">
                        {appointment.status}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Medical Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {patientData?.medicalRecords.map((record) => (
                    <div key={record.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{record.diagnosis || 'General Check-up'}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(record.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        
        <ChatInterface />
      </div>
    </div>
  );
};
