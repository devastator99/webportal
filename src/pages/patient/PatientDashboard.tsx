
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { UserWelcome } from "@/components/dashboard/UserWelcome";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { CalendarCheckIcon, ClipboardList, BookOpenIcon, MessageCircle, Calendar, Clock, Activity } from "lucide-react";
import { DashboardMetricsCard } from "@/components/dashboard/DashboardMetricsCard";
import { CareTeamCard } from "@/components/dashboard/patient/CareTeamCard";
import { UpcomingAppointmentsCard } from "@/components/dashboard/patient/UpcomingAppointmentsCard";
import { RecentPrescriptionsCard } from "@/components/dashboard/patient/RecentPrescriptionsCard";
import { HealthMetricsCard } from "@/components/dashboard/patient/HealthMetricsCard";
import { AiChatCard } from "@/components/dashboard/AiChatCard";
import { supabase } from "@/integrations/supabase/client";

const PatientDashboard = () => {
  const { user } = useAuth();
  const [careTeamRoomId, setCareTeamRoomId] = useState<string | null>(null);
  
  useEffect(() => {
    if (user) {
      const getCareTeamRoom = async () => {
        try {
          const { data, error } = await supabase.functions.invoke('get-patient-care-team-room', {
            body: { patient_id: user.id }
          });
          
          if (error) {
            console.error("Error getting care team room:", error);
          } else if (data) {
            setCareTeamRoomId(String(data));
          }
        } catch (error) {
          console.error("Exception getting care team room:", error);
        }
      };
      
      getCareTeamRoom();
    }
  }, [user]);

  if (!user) return null;

  return (
    <div>
      <UserWelcome
        title="Welcome to Your Health Dashboard"
        description="Monitor your health progress and care plans."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <DashboardMetricsCard
          title="Care Team"
          value="View Team"
          icon={<ClipboardList className="h-5 w-5" />}
          description="Your healthcare professionals"
          linkUrl="/chat"
          linkText="Message Care Team"
        />
        <DashboardMetricsCard
          title="Prescriptions"
          value="View All"
          icon={<BookOpenIcon className="h-5 w-5" />}
          description="Your recent prescriptions"
          linkUrl="/prescriptions"
          linkText="See Prescriptions"
        />
        <DashboardMetricsCard
          title="Health Plan"
          value="View Plan"
          icon={<CalendarCheckIcon className="h-5 w-5" />}
          description="Your personalized health plan"
          linkUrl="/habits"
          linkText="Track Progress"
        />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <DashboardSection>
          <UpcomingAppointmentsCard />
          <CareTeamCard />
          <RecentPrescriptionsCard />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Care Team Chat
              </CardTitle>
              <CardDescription>
                Connect with your doctor and nutritionist
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col">
              <p className="text-sm text-muted-foreground mb-4">
                Communicate directly with your care team, send updates, and upload medical reports.
              </p>
              <Button asChild>
                <Link to="/chat">
                  Open Chat
                </Link>
              </Button>
            </CardContent>
          </Card>
        </DashboardSection>

        <DashboardSection>
          <HealthMetricsCard />
          <AiChatCard />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Health Habits
              </CardTitle>
              <CardDescription>
                Track your daily health activities
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col">
              <p className="text-sm text-muted-foreground mb-4">
                Follow your personalized health plan and track your progress.
              </p>
              <Button asChild>
                <Link to="/habits">
                  Track Habits
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Appointments
              </CardTitle>
              <CardDescription>
                Schedule your next consultation
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col">
              <p className="text-sm text-muted-foreground mb-4">
                Book appointments with your doctor or healthcare provider.
              </p>
              <Button asChild>
                <Link to="/book-appointment">
                  Book Appointment
                </Link>
              </Button>
            </CardContent>
          </Card>
        </DashboardSection>
      </div>
    </div>
  );
};

export default PatientDashboard;
