import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, MessageSquare, FileText, ArrowRight, Salad, Heart, Calendar } from "lucide-react";
import { DashboardHeader } from "./DashboardHeader";
import { useState } from "react";
import { HealthPlanCreator } from "./nutritionist/HealthPlanCreator";
import { useNavigate } from "react-router-dom";
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
  patient: {
    first_name: string;
    last_name: string;
  };
}

export const NutritionistDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const { data: patients, isLoading } = useQuery({
    queryKey: ["nutritionist_patients", user?.id],
    queryFn: async () => {
      console.log("Fetching patients for nutritionist:", user?.id);
      
      // Direct SQL query approach instead of going through RLS
      const { data, error } = await supabase
        .from("nutritionist_patients_view")
        .select("*")
        .eq("nutritionist_id", user?.id);

      if (error) {
        console.error("Error fetching patients for nutritionist:", error);
        
        // Try fallback query with fewer joins
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("patient_assignments")
          .select("id, patient_id, created_at, doctor_id")
          .eq("nutritionist_id", user?.id);

        if (fallbackError) {
          console.error("Fallback also failed:", fallbackError);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load assigned patients."
          });
          throw fallbackError;
        }

        // For the fallback data, we need to separately fetch patient profiles
        if (fallbackData && fallbackData.length > 0) {
          const patientIds = fallbackData.map(item => item.patient_id);
          
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, first_name, last_name")
            .in("id", patientIds);
            
          if (profilesError) {
            console.error("Error fetching patient profiles:", profilesError);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to load patient details."
            });
            return fallbackData.map(item => ({
              ...item,
              patient: { first_name: "Unknown", last_name: "Patient" }
            }));
          }
          
          // Join the profile data with the assignment data
          return fallbackData.map(assignment => {
            const profile = profilesData?.find(p => p.id === assignment.patient_id);
            return {
              ...assignment,
              patient: {
                first_name: profile?.first_name || "Unknown",
                last_name: profile?.last_name || "Patient"
              }
            };
          });
        }
        
        return [];
      }
      
      // Transform the data to match our expected format if needed
      const formattedData = data?.map(row => ({
        id: row.id,
        patient_id: row.patient_id,
        created_at: row.created_at,
        patient: {
          first_name: row.first_name,
          last_name: row.last_name
        }
      }));
      
      console.log("Fetched nutritionist patients:", formattedData);
      return formattedData || [];
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
                        {assignment.patient?.first_name} {assignment.patient?.last_name}
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
