
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, MessageSquare, FileText, ArrowRight } from "lucide-react";
import { DashboardHeader } from "./DashboardHeader";
import { useState } from "react";
import { HealthPlanCreator } from "./nutritionist/HealthPlanCreator";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export const NutritionistDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const { data: patients, isLoading } = useQuery({
    queryKey: ["nutritionist_patients", user?.id],
    queryFn: async () => {
      console.log("Fetching patients for nutritionist:", user?.id);
      
      // Get patients assigned to this nutritionist directly
      const { data, error } = await supabase
        .from("patient_assignments")
        .select(`
          id,
          patient_id,
          created_at,
          profiles!patient_id(first_name, last_name)
        `)
        .eq("nutritionist_id", user?.id);

      if (error) {
        console.error("Error fetching patients for nutritionist:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load assigned patients."
        });
        throw error;
      }
      
      console.log("Fetched nutritionist patients:", data);
      return data;
    },
    enabled: !!user?.id,
  });

  return (
    <div className="container mx-auto pt-20 pb-6 px-6 space-y-6">
      <DashboardHeader />
      
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

      {selectedPatientId ? (
        <>
          <Button variant="outline" onClick={() => setSelectedPatientId(null)} className="mb-4">
            Back to Patient List
          </Button>
          <HealthPlanCreator patientId={selectedPatientId} />
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Assigned Patients</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading patients...</p>
            ) : patients?.length === 0 ? (
              <p className="text-muted-foreground">No patients assigned yet.</p>
            ) : (
              <div className="space-y-4">
                {patients?.map((assignment) => (
                  <div key={assignment.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">
                        {assignment.profiles?.first_name} {assignment.profiles?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Assigned: {new Date(assignment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button onClick={() => setSelectedPatientId(assignment.patient_id)} size="sm">
                      Create Health Plan <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
