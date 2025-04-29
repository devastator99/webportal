import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { CalendarCheckIcon, ClipboardList, BookOpenIcon, MessageCircle, Calendar, Clock, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PatientSidebar } from "@/components/dashboard/patient/PatientSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

// Simplified dashboard components for patient
const UserWelcome = ({ title, description }: { title: string; description: string }) => (
  <div className="mb-8">
    <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

const DashboardSection = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-4">{children}</div>
);

const DashboardMetricsCard = ({ 
  title, 
  value, 
  icon, 
  description, 
  linkUrl, 
  linkText 
}: { 
  title: string; 
  value: string;
  icon: React.ReactNode;
  description: string;
  linkUrl: string;
  linkText: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
      <Button asChild variant="link" className="px-0 mt-2">
        <Link to={linkUrl}>{linkText}</Link>
      </Button>
    </CardContent>
  </Card>
);

// Simplified component versions to fix missing imports
const CareTeamCard = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <ClipboardList className="h-5 w-5" />
        Care Team
      </CardTitle>
      <CardDescription>Your healthcare professionals</CardDescription>
    </CardHeader>
    <CardContent>
      <Button asChild className="w-full">
        <Link to="/chat">Contact Care Team</Link>
      </Button>
    </CardContent>
  </Card>
);

const UpcomingAppointmentsCard = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Calendar className="h-5 w-5" />
        Upcoming Appointments
      </CardTitle>
      <CardDescription>Your scheduled consultations</CardDescription>
    </CardHeader>
    <CardContent>
      <Button asChild className="w-full">
        <Link to="/book-appointment">Book Appointment</Link>
      </Button>
    </CardContent>
  </Card>
);

const RecentPrescriptionsCard = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <BookOpenIcon className="h-5 w-5" />
        Recent Prescriptions
      </CardTitle>
      <CardDescription>Your recent prescriptions</CardDescription>
    </CardHeader>
    <CardContent>
      <Button asChild className="w-full">
        <Link to="/prescriptions">View Prescriptions</Link>
      </Button>
    </CardContent>
  </Card>
);

const HealthMetricsCard = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Activity className="h-5 w-5" />
        Health Metrics
      </CardTitle>
      <CardDescription>Your health statistics</CardDescription>
    </CardHeader>
    <CardContent>
      <Button asChild className="w-full">
        <Link to="/habits">Track Progress</Link>
      </Button>
    </CardContent>
  </Card>
);

const AiChatCard = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        AI Health Assistant
      </CardTitle>
      <CardDescription>Ask health-related questions</CardDescription>
    </CardHeader>
    <CardContent>
      <Button asChild className="w-full">
        <Link to="/ai-chat">Chat with AI</Link>
      </Button>
    </CardContent>
  </Card>
);

const PatientDashboard = () => {
  const { user } = useAuth();
  const [careTeamRoomId, setCareTeamRoomId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
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
    <SidebarProvider>
      <div className="flex flex-col md:flex-row min-h-screen w-full">
        <PatientSidebar />
        <div className={`flex-1 ${isMobile ? "pt-16" : ""}`}>
          <div className="container mx-auto px-4 py-6">
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
        </div>
      </div>
    </SidebarProvider>
  );
};

export default PatientDashboard;
