
import { useAuth } from "@/contexts/AuthContext";
import { supabase, asArray } from "@/integrations/supabase/client";
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
        // First, get all patient IDs assigned to this doctor
        const { data: patientAssignments, error: assignmentError } = await supabase
          .from("patient_assignments")
          .select("patient_id")
          .eq("doctor_id", user.id);
          
        if (assignmentError) {
          console.error("Error fetching patient assignments:", assignmentError);
          throw assignmentError;
        }
        
        // If no patients assigned, return empty array
        if (!patientAssignments || patientAssignments.length === 0) {
          return [] as PatientProfile[];
        }
        
        const patientIds = patientAssignments.map(assignment => assignment.patient_id as string);
        
        // Then fetch patient profiles data
        const { data: patientProfiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", patientIds);
          
        if (profilesError) {
          console.error("Error fetching patient profiles:", profilesError);
          throw profilesError;
        }
        
        return (patientProfiles || []) as PatientProfile[];
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
          {patients.map((patient: PatientProfile) => (
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
