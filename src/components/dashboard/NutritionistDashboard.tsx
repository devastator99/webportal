
import { useAuth } from "@/contexts/AuthContext";
import { getNutritionistPatients } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight, Salad, Calendar, FileText, MessageCircle } from "lucide-react";
import { DashboardHeader } from "./DashboardHeader";
import { useState } from "react";
import { HealthPlanCreator } from "./nutritionist/HealthPlanCreator";
import { HealthPlanPDF } from "./nutritionist/HealthPlanPDF";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { NutritionistCareTeamChat } from "@/components/chat/NutritionistCareTeamChat";

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

interface PatientProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

export const NutritionistDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'pdf' | 'chat'>('list');

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
      
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center">
              <div className="bg-[#E5DEFF] p-3 rounded-full mb-2">
                <Users className="h-6 w-6 text-[#9b87f5]" />
              </div>
              <span className="text-2xl font-bold">{user?.id ? (patients?.length || 0) : 0}</span>
              <span className="text-xs text-gray-500 text-center">Patients</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="bg-[#F2FCE2] p-3 rounded-full mb-2">
                <Salad className="h-6 w-6 text-green-500" />
              </div>
              <span className="text-2xl font-bold">0</span>
              <span className="text-xs text-gray-500 text-center">Health Plans</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="bg-[#FDE1D3] p-3 rounded-full mb-2">
                <Calendar className="h-6 w-6 text-[#F97316]" />
              </div>
              <span className="text-2xl font-bold">0</span>
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
      ) : viewMode !== 'list' ? (
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
        <>
          <div className="flex justify-between mb-4">
            <h2 className="text-2xl font-bold">Patient Management</h2>
            <Button 
              onClick={() => setViewMode('chat')}
              className="bg-green-500 hover:bg-green-600"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Care Team Chat
            </Button>
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
                          className="bg-green-500 hover:bg-green-600"
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
        </>
      )}
    </div>
  );
};
