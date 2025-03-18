import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight, Salad, Calendar } from "lucide-react";
import { DashboardHeader } from "./DashboardHeader";
import { useState } from "react";
import { HealthPlanCreator } from "./nutritionist/HealthPlanCreator";
import { useToast } from "@/hooks/use-toast";

// Create a StatsCards component to keep the file size manageable
const NutritionistStatsCards = ({ patientsCount }: { patientsCount: number }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Assigned Patients</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{patientsCount || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Health Plans Created</CardTitle>
          <Salad className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">0</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Calendar Events</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">0</div>
        </CardContent>
      </Card>
    </div>
  );
};

// Interface for patient assignment data
interface PatientAssignment {
  id: string;
  patient_id: string;
  created_at: string;
  patient_first_name: string;
  patient_last_name: string;
}

export const NutritionistDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const { data: patients, isLoading } = useQuery({
    queryKey: ["nutritionist_patients", user?.id],
    queryFn: async () => {
      console.log("Fetching patients for nutritionist:", user?.id);
      
      // Use the RPC function to get nutritionist's patients
      const { data, error } = await supabase
        .rpc('get_nutritionist_patients', { p_nutritionist_id: user?.id });

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
      return data as PatientAssignment[] || [];
    },
    enabled: !!user?.id,
  });

  return (
    <div className="container mx-auto pt-20 pb-6 px-6 space-y-6">
      <DashboardHeader />
      
      <NutritionistStatsCards patientsCount={patients?.length || 0} />

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
                        {assignment.patient_first_name} {assignment.patient_last_name}
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
