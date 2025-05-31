
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useSearchParams } from "react-router-dom";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { NutritionistAppLayout } from "@/layouts/NutritionistAppLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Salad } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getNutritionistPatients } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { NutritionistHealthPlanTabs } from "@/components/dashboard/nutritionist/NutritionistHealthPlanTabs";
import { useState, useEffect } from "react";

interface PatientProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

const NutritionistHealthPlansView = () => {
  const { user, userRole, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const patientFromUrl = searchParams.get('patient');
  const editMode = searchParams.get('edit') === 'true';

  useEffect(() => {
    if (patientFromUrl) {
      setSelectedPatientId(patientFromUrl);
    }
  }, [patientFromUrl]);

  const { data: patients = [], isLoading: isLoadingPatients } = useQuery({
    queryKey: ["nutritionist_patients", user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as PatientProfile[];
      
      try {
        console.log("Fetching patients for nutritionist:", user.id);
        
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
    staleTime: 60000
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (userRole !== "nutritionist") {
    return <Navigate to="/dashboard" replace />;
  }

  const handleBackToList = () => {
    setSelectedPatientId(null);
    navigate('/health-plans');
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  console.log("Rendering NutritionistHealthPlansView component");

  return (
    <NutritionistAppLayout>
      <div className="container mx-auto pt-6 pb-6 px-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectedPatientId ? handleBackToList() : navigate("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {selectedPatientId ? "Back to Health Plans" : "Back to Dashboard"}
          </Button>
        </div>

        {selectedPatientId ? (
          <>
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-[#7E69AB] flex items-center gap-2">
                <Salad className="h-8 w-8" />
                Health Plan - {selectedPatient?.first_name} {selectedPatient?.last_name}
              </h1>
              <p className="text-muted-foreground mt-2">
                Create and manage health plans for this patient
              </p>
            </div>
            
            <NutritionistHealthPlanTabs 
              patientId={selectedPatientId} 
              onClose={handleBackToList} 
            />
          </>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-[#7E69AB] flex items-center gap-2">
                <Salad className="h-8 w-8" />
                Health Plans
              </h1>
              <p className="text-muted-foreground mt-2">
                Select a patient to create or manage their health plan
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Select Patient</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingPatients ? (
                  <div className="py-8 flex justify-center">
                    <LoadingSpinner size="md" />
                  </div>
                ) : patients?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No patients assigned yet.</p>
                ) : (
                  <div className="space-y-4">
                    {patients.map((patient) => (
                      <div key={patient.id} className="flex justify-between items-center border-b pb-4 last:border-b-0">
                        <div>
                          <p className="font-medium text-lg">
                            {patient.first_name} {patient.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">Patient ID: {patient.id}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPatientId(patient.id)}
                          >
                            View Health Plan
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => setSelectedPatientId(patient.id)}
                          >
                            Manage Plan
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </NutritionistAppLayout>
  );
};

export default NutritionistHealthPlansView;
