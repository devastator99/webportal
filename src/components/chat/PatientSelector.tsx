
import { useAuth } from "@/contexts/AuthContext";
import { getAllPatients, PatientProfile } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface PatientSelectorProps {
  selectedPatientId: string | null;
  onPatientSelect: (patientId: string) => void;
}

export const PatientSelector = ({ selectedPatientId, onPatientSelect }: PatientSelectorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: patients, isLoading } = useQuery({
    queryKey: ["all_patients"],
    queryFn: async () => {
      try {
        console.log("Fetching all patients");
        
        // Use RPC function to get all patients
        const patients = await getAllPatients();
        console.log(`Fetched ${patients.length} patient profiles:`, patients);
        
        return patients;
      } catch (error) {
        console.error("Error in PatientSelector:", error);
        toast({
          title: "Failed to load patients",
          description: "There was an error loading patients. Please refresh and try again.",
          variant: "destructive",
        });
        return [] as PatientProfile[];
      }
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return <div>Loading patients...</div>;
  }

  if (!patients || patients.length === 0) {
    return <div className="text-sm text-muted-foreground">No patients found.</div>;
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="patient-select">Select Patient</Label>
      <Select
        value={selectedPatientId || ""}
        onValueChange={onPatientSelect}
      >
        <SelectTrigger id="patient-select">
          <SelectValue placeholder="Select a patient" />
        </SelectTrigger>
        <SelectContent>
          {patients.map((patient) => (
            <SelectItem 
              key={patient.id} 
              value={patient.id}
            >
              {patient.first_name || ''} {patient.last_name || ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
