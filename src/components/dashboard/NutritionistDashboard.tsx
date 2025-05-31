
import { useAuth } from "@/contexts/AuthContext";
import { getNutritionistPatients } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight, Salad, Calendar, FileText, MessageCircle, Grid3X3, Layout } from "lucide-react";
import { DashboardHeader } from "./DashboardHeader";
import { useState } from "react";
import { HealthPlanCreator } from "./nutritionist/HealthPlanCreator";
import { HealthPlanPDF } from "./nutritionist/HealthPlanPDF";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { NutritionistCareTeamChat } from "@/components/chat/NutritionistCareTeamChat";
import { Skeleton } from "@/components/ui/skeleton";
import { useNutritionistStats } from "@/hooks/useNutritionistStats";
import { HealthPlanItemsGrid } from "./nutritionist/HealthPlanItemsGrid";
import { NutritionistHealthPlanTabs } from "./nutritionist/NutritionistHealthPlanTabs";

interface PatientProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

export const NutritionistDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'healthplan' | 'chat'>('list');
  const { data: stats, isLoading: isLoadingStats } = useNutritionistStats();

  const { data: patients = [], isLoading } = useQuery({
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

  const handlePatientAction = (patientId: string) => {
    setSelectedPatientId(patientId);
    setViewMode('healthplan');
  };

  const handleBackToList = () => {
    setSelectedPatientId(null);
    setViewMode('list');
  };

  // Extract user's name from metadata
  const firstName = user?.user_metadata?.first_name || "";
  const lastName = user?.user_metadata?.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim();

  return (
    <div className="container mx-auto pt-6 pb-6 px-6 space-y-6">
      {/* Welcome Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#7E69AB]">
          Welcome back, {fullName || "Nutritionist"}! 👋
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's an overview of your patients and health plans
        </p>
      </div>
      
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center">
              <div className="bg-[#E5DEFF] p-3 rounded-full mb-2">
                <Users className="h-6 w-6 text-[#9b87f5]" />
              </div>
              {isLoadingStats ? (
                <Skeleton className="h-8 w-16 mb-2" />
              ) : (
                <span className="text-2xl font-bold">
                  {patients?.length || 0}
                </span>
              )}
              <span className="text-xs text-gray-500 text-center">Patients</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="bg-[#F2FCE2] p-3 rounded-full mb-2">
                <Salad className="h-6 w-6 text-green-500" />
              </div>
              {isLoadingStats ? (
                <Skeleton className="h-8 w-16 mb-2" />
              ) : (
                <span className="text-2xl font-bold">
                  {stats?.health_plans_count || 0}
                </span>
              )}
              <span className="text-xs text-gray-500 text-center">Health Plans</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="bg-[#FDE1D3] p-3 rounded-full mb-2">
                <Calendar className="h-6 w-6 text-[#F97316]" />
              </div>
              {isLoadingStats ? (
                <Skeleton className="h-8 w-16 mb-2" />
              ) : (
                <span className="text-2xl font-bold">
                  {stats?.calendar_events_count || 0}
                </span>
              )}
              <span className="text-xs text-gray-500 text-center">Calendar Events</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === 'chat' ? (
        <>
          <Button variant="outline" onClick={handleBackToList} className="mb-4">
            Back to Patient List
          </Button>
          <div className="h-[600px]">
            <NutritionistCareTeamChat />
          </div>
        </>
      ) : viewMode === 'healthplan' && selectedPatientId ? (
        <>
          <Button variant="outline" onClick={handleBackToList} className="mb-4">
            Back to Patient List
          </Button>
          
          <NutritionistHealthPlanTabs patientId={selectedPatientId} onClose={handleBackToList} />
        </>
      ) : (
        <>
          <div className="flex justify-between mb-4">
            <h2 className="text-2xl font-bold">Patient Management</h2>
          </div>
        
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
                      <div>
                        <span 
                          onClick={() => handlePatientAction(patient.id)}
                          className="text-green-500 hover:text-green-600 hover:underline cursor-pointer flex items-center gap-1 transition-colors"
                        >
                          <Layout className="h-4 w-4" />
                          Manage Health Plan
                        </span>
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
  );
};
