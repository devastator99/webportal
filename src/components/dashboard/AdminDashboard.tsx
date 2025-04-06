
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Stethoscope, Heart, Calendar, FileText, ChefHat, Shield } from "lucide-react";
import { VideoUploader } from "@/components/videos/VideoUploader";
import { VideoList } from "@/components/videos/VideoList";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AdminSettings } from "@/components/dashboard/admin/AdminSettings";
import { PatientAssignmentManager } from "@/components/dashboard/admin/PatientAssignmentManager";
import { UserRegistration } from "@/components/dashboard/admin/UserRegistration";
import { UserManagement } from "@/components/dashboard/admin/UserManagement";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { PatientAssignmentsReport } from "@/components/dashboard/admin/PatientAssignmentsReport";

export const AdminDashboard = () => {
  const { data: userStats, isLoading } = useQuery({
    queryKey: ["user_stats"],
    queryFn: async () => {
      try {
        // Get patients count
        const { data: patients, error: patientsError } = await supabase
          .from("user_roles")
          .select("count")
          .eq("role", "patient");

        if (patientsError) throw patientsError;

        // Get doctors count
        const { data: doctors, error: doctorsError } = await supabase
          .from("user_roles")
          .select("count")
          .eq("role", "doctor");

        if (doctorsError) throw doctorsError;

        // Get nutritionists count
        const { data: nutritionists, error: nutritionistsError } = await supabase
          .from("user_roles")
          .select("count")
          .eq("role", "nutritionist");

        if (nutritionistsError) throw nutritionistsError;

        // Get today's appointments
        const today = new Date().toISOString().split('T')[0];
        const { count: todayAppointmentsCount, error: todayAppointmentsError } = await supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .gte("scheduled_at", `${today}T00:00:00`)
          .lte("scheduled_at", `${today}T23:59:59`);

        if (todayAppointmentsError) throw todayAppointmentsError;

        console.log("Admin dashboard stats:", {
          patients: patients?.[0]?.count || 0,
          doctors: doctors?.[0]?.count || 0,
          nutritionists: nutritionists?.[0]?.count || 0,
          todayAppointments: todayAppointmentsCount || 0
        });

        return {
          patients: patients?.[0]?.count || 0,
          doctors: doctors?.[0]?.count || 0,
          nutritionists: nutritionists?.[0]?.count || 0,
          todayAppointments: todayAppointmentsCount || 0
        };
      } catch (error) {
        console.error("Error fetching admin stats:", error);
        return {
          patients: 0,
          doctors: 0,
          nutritionists: 0,
          todayAppointments: 0
        };
      }
    },
  });

  return (
    <div className="container mx-auto pt-20 pb-6 px-4 md:px-6 space-y-6">
      <DashboardHeader />
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <div className="bg-[#E5DEFF] p-2 rounded-full">
              <Users className="h-4 w-4 text-[#9b87f5]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : userStats?.patients || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doctors</CardTitle>
            <div className="bg-[#FDE1D3] p-2 rounded-full">
              <Stethoscope className="h-4 w-4 text-[#F97316]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : userStats?.doctors || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nutritionists</CardTitle>
            <div className="bg-[#F2FCE2] p-2 rounded-full">
              <ChefHat className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : userStats?.nutritionists || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <div className="bg-[#FFEDD5] p-2 rounded-full">
              <FileText className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : userStats?.todayAppointments || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <CollapsibleSection title="Patient Assignments Report" defaultOpen={true}>
          <PatientAssignmentsReport />
        </CollapsibleSection>

        <CollapsibleSection title="User Management">
          <UserManagement />
        </CollapsibleSection>
        
        <CollapsibleSection title="User Registration">
          <UserRegistration />
        </CollapsibleSection>
        
        <CollapsibleSection title="Care Team Assignments">
          <PatientAssignmentManager />
        </CollapsibleSection>
        
        <CollapsibleSection title="Education Videos">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <VideoUploader />
            </div>
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-semibold mb-4">Uploaded Videos</h2>
              <VideoList />
            </div>
          </div>
        </CollapsibleSection>
        
        <CollapsibleSection title="System Settings">
          <AdminSettings />
        </CollapsibleSection>
      </div>
    </div>
  );
};
