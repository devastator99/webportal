
import { useAuth } from "@/contexts/AuthContext";
import { supabase, asArray, safeGet } from "@/integrations/supabase/client";
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
        
        // For doctor role, get patient assignments
        const { data: patientAssignments, error: assignmentError } = await supabase
          .from("patient_assignments")
          .select("patient_id")
          .eq("doctor_id", user.id as string);
          
        if (assignmentError) {
          console.error("Error fetching patient assignments:", assignmentError);
          throw assignmentError;
        }
        
        // If no patients assigned, return empty array
        if (!patientAssignments || patientAssignments.length === 0) {
          console.log("No patient assignments found");
          return [] as PatientProfile[];
        }
        
        // Extract patient IDs as string array
        const patientIds = patientAssignments.map(assignment => 
          safeGet(assignment, 'patient_id', '') as string
        ).filter(id => id !== '');
        
        console.log(`Found ${patientIds.length} patient assignments`);
        
        // Then fetch patient profiles data
        const { data: patientProfiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", patientIds);
          
        if (profilesError) {
          console.error("Error fetching patient profiles:", profilesError);
          throw profilesError;
        }
        
        const profiles = asArray<PatientProfile>(patientProfiles);
        console.log(`Fetched ${profiles.length} patient profiles`);
        
        return profiles;
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

  if (!patients.length) {
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
