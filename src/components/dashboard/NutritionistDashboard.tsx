import { useAuth } from "@/contexts/AuthContext";
import { getNutritionistPatients } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight, Salad, Calendar, FileText } from "lucide-react";
import { DashboardHeader } from "./DashboardHeader";
import { useState } from "react";
import { HealthPlanCreator } from "./nutritionist/HealthPlanCreator";
import { HealthPlanPDF } from "./nutritionist/HealthPlanPDF";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

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

// Interface for patient profile
interface PatientProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

export const NutritionistDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'pdf'>('list');

  // Use the updated getNutritionistPatients function to get assigned patients
  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["nutritionist_patients", user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as PatientProfile[];
      
      try {
        console.log("Fetching patients for nutritionist:", user.id);
        
        // Use our helper function to get nutritionist's patients
        const patientsData = await getNutritionistPatients(user.id);
        console.log("Patients retrieved:", patientsData);
        
        return patientsData;
      } catch (error) {
        console.error("Error fetching nutritionist's patients:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load assigned patients."
        });
        return [] as PatientProfile[];
      }
    },
    enabled: !!user?.id,
    staleTime: 60000 // Cache for 1 minute
  });

  const handlePatientAction = (patientId: string, mode: 'create' | 'pdf') => {
    setSelectedPatientId(patientId);
    setViewMode(mode);
  };

  const handleBackToList = () => {
    setSelectedPatientId(null);
    setViewMode('list');
  };

  return (
    <div className="container mx-auto pt-20 pb-6 px-6 space-y-6">
      <DashboardHeader />
      
      <NutritionistStatsCards patientsCount={patients?.length || 0} />

      {viewMode !== 'list' ? (
        <>
          <Button variant="outline" onClick={handleBackToList} className="mb-4">
            Back to Patient List
          </Button>
          
          {viewMode === 'create' && selectedPatientId && (
            <HealthPlanCreator patientId={selectedPatientId} />
          )}
          
          {viewMode === 'pdf' && selectedPatientId && (
            <HealthPlanPDF patientId={selectedPatientId} onClose={handleBackToList} />
          )}
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Assigned Patients</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 flex justify-center">
                <LoadingSpinner size="md" />
              </div>
            ) : patients?.length === 0 ? (
              <p className="text-muted-foreground">No patients assigned yet.</p>
            ) : (
              <div className="space-y-4">
                {patients.map((patient) => (
                  <div key={patient.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">
                        {patient.first_name} {patient.last_name}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handlePatientAction(patient.id, 'pdf')}
                        variant="outline"
                        size="sm"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        View Plan
                      </Button>
                      <Button
                        onClick={() => handlePatientAction(patient.id, 'create')}
                        size="sm"
                      >
                        <Salad className="h-4 w-4 mr-1" />
                        Create Plan
                      </Button>
                    </div>
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
