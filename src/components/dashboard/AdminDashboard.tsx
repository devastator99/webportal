
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Stethoscope, Heart, Settings } from "lucide-react";
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
  const { data: userStats } = useQuery({
    queryKey: ["user_stats"],
    queryFn: async () => {
      const { data: patients, error: patientsError } = await supabase
        .from("user_roles")
        .select("count")
        .eq("role", "patient");

      const { data: doctors, error: doctorsError } = await supabase
        .from("user_roles")
        .select("count")
        .eq("role", "doctor");

      const { data: nutritionists, error: nutritionistsError } = await supabase
        .from("user_roles")
        .select("count")
        .eq("role", "nutritionist");

      if (patientsError || doctorsError || nutritionistsError) throw new Error("Failed to fetch stats");

      return {
        patients: patients?.[0]?.count || 0,
        doctors: doctors?.[0]?.count || 0,
        nutritionists: nutritionists?.[0]?.count || 0,
      };
    },
  });

  return (
    <div className="container mx-auto pt-20 pb-6 px-4 md:px-6 space-y-6">
      <DashboardHeader />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.patients || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.doctors || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Nutritionists</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.nutritionists || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Active</div>
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
