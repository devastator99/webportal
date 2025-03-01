import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, FileText, LogOut } from "lucide-react";
import { DashboardHeader } from "./DashboardHeader";
import { Button } from "@/components/ui/button"; 
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

export const NutritionistDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const { data: patients } = useQuery({
    queryKey: ["nutritionist_patients", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_assignments")
        .select(`
          id,
          patient_id,
          created_at,
          patient:profiles!patient_assignments_patient_profile_fkey(first_name, last_name)
        `)
        .eq("nutritionist_id", user?.id);

      if (error) throw error;
      return data;
    },
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Successfully signed out",
        description: "You have been signed out of your account",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: "There was a problem signing you out. Please try again.",
      });
    }
  };

  const actionButtons = (
    <div className="flex items-center justify-end">
      <Button 
        onClick={handleSignOut}
        variant="outline" 
        className="border-[#9b87f5] text-[#7E69AB] hover:bg-[#E5DEFF]"
        size={isMobile ? "sm" : "default"}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto pt-20 pb-6 px-6 space-y-6">
      <DashboardHeader actionButton={actionButtons} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patients?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resources Shared</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Patients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {patients?.slice(0, 5).map((assignment) => (
              <div key={assignment.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">
                    {assignment.patient.first_name} {assignment.patient.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(assignment.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
