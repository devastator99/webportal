import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useNavigate } from "react-router-dom";
import { fetchPatientPrescriptions, getDoctorPatients, PatientProfile } from "@/integrations/supabase/client";

export const AllPatientsList = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  const { data: patients = [], isLoading: isLoadingPatients, refetch: refetchPatients } = useQuery({
    queryKey: ["patients_for_doctor", user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as PatientProfile[];
      
      try {
        console.log("Fetching patients for doctor:", user.id);
        const result = await getDoctorPatients(user.id);
        console.log("Retrieved patients:", result.length);
        return result;
      } catch (error) {
        console.error("Error fetching patients:", error);
        toast({
          title: "Error",
          description: "Failed to load patients. Please try again.",
          variant: "destructive",
        });
        return [] as PatientProfile[];
      }
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });

  const handlePatientClick = (patientId: string) => {
    navigate(`/patient/${patientId}`);
  };

  const handleRefreshPatients = async () => {
    try {
      setIsRefreshing(true);
      await refetchPatients();
      toast({
        title: "Patient list refreshed",
        description: "Latest assigned patients have been loaded"
      });
    } catch (error) {
      console.error("Error refreshing patient list:", error);
      toast({
        title: "Error refreshing",
        description: "Could not refresh patient list",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="container mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>All Patients</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshPatients}
              disabled={isRefreshing || isLoadingPatients}
              className="gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <CardDescription>
            View and manage your patient list
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
            />
            
            <div className="border rounded-md divide-y max-h-[60vh] overflow-y-auto">
              {isLoadingPatients ? (
                <div className="p-4 flex justify-center">
                  <LoadingSpinner size="md" />
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {searchTerm ? "No matching patients found" : "No patients assigned yet"}
                </div>
              ) : (
                filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="p-3 cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handlePatientClick(patient.id)}
                  >
                    <div className="font-medium">
                      {patient.first_name} {patient.last_name}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
