import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, RefreshCw, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useNavigate } from "react-router-dom";
import { getDoctorPatients, PatientProfile } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PatientAvatar } from "./PatientAvatar";

interface AllPatientsListProps {
  compact?: boolean;
}

export const AllPatientsList = ({ compact }: AllPatientsListProps = {}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  const { data: patients = [], isLoading: isLoadingPatients, refetch: refetchPatients } = useQuery({
    queryKey: ["patients_for_doctor", user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as PatientProfile[];
      
      try {
        const result = await getDoctorPatients(user.id);
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
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-full">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>{compact ? "Recent Patients" : "Your Patients"}</CardTitle>
          </div>
          {!compact && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshPatients}
              disabled={isRefreshing || isLoadingPatients}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>
        
        {!compact && (
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {isLoadingPatients ? (
          <div className="flex justify-center p-8">
            <LoadingSpinner />
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            {searchTerm ? "No matching patients found" : "No patients assigned yet"}
          </div>
        ) : (
          <ScrollArea className={compact ? "h-[300px]" : "h-[calc(100vh-350px)]"}>
            <div className={`grid gap-4 p-2 ${
              compact 
                ? "grid-cols-1 sm:grid-cols-2" 
                : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            }`}>
              {(compact ? filteredPatients.slice(0, 6) : filteredPatients).map((patient) => (
                <div
                  key={patient.id}
                  className="flex flex-col items-center gap-2 p-2"
                  onClick={() => handlePatientClick(patient.id)}
                >
                  <PatientAvatar
                    firstName={patient.first_name || ''}
                    lastName={patient.last_name || ''}
                    size={compact ? "md" : "lg"}
                    onClick={() => handlePatientClick(patient.id)}
                  />
                  <div className="text-center">
                    <p className="font-medium text-sm truncate max-w-[120px]">
                      {patient.first_name} {patient.last_name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
