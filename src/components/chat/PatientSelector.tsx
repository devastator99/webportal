
import { useAuth } from "@/contexts/AuthContext";
import { getDoctorPatients } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PatientSelectorProps {
  selectedPatientId: string | null;
  onPatientSelect: (patientId: string) => void;
}

interface PatientProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

export const PatientSelector = ({ selectedPatientId, onPatientSelect }: PatientSelectorProps) => {
  const { user } = useAuth();

  const { data: assignedPatients, isLoading } = useQuery({
    queryKey: ["assigned_patients", user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as PatientProfile[];
      
      try {
        console.log("Fetching patient assignments for doctor:", user.id);
        
        // Use RPC function to get assigned patients for doctor
        const patients = await getDoctorPatients(user.id);
        console.log(`Fetched ${patients.length} patient profiles`);
        
        return patients as PatientProfile[];
      } catch (error) {
        console.error("Error in PatientSelector:", error);
        return [] as PatientProfile[];
      }
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return <div>Loading patients...</div>;
  }

  const patients = assignedPatients || [];

  if (patients.length === 0) {
    return <div className="text-sm text-muted-foreground">No patients assigned yet.</div>;
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
