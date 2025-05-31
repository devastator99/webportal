
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { NutritionistAppLayout } from "@/layouts/NutritionistAppLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getNutritionistPatients } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";

interface PatientProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

const NutritionistPatientsView = () => {
  const { user, userRole, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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

  console.log("Rendering NutritionistPatientsView component");

  return (
    <NutritionistAppLayout>
      <div className="container mx-auto pt-6 pb-6 px-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#7E69AB] flex items-center gap-2">
            <Users className="h-8 w-8" />
            My Patients
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage health plans for your assigned patients
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assigned Patients</CardTitle>
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
                        onClick={() => navigate(`/health-plans?patient=${patient.id}`)}
                        className="text-green-600 hover:text-green-700"
                      >
                        View Health Plan
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => navigate(`/health-plans?patient=${patient.id}&edit=true`)}
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
      </div>
    </NutritionistAppLayout>
  );
};

export default NutritionistPatientsView;
