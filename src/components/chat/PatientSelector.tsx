
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PatientSelectorProps {
  selectedPatientId: string | null;
  onPatientSelect: (patientId: string) => void;
}

export const PatientSelector = ({ selectedPatientId, onPatientSelect }: PatientSelectorProps) => {
  const { user } = useAuth();

  const { data: assignedPatients, isLoading } = useQuery({
    queryKey: ["assigned_patients", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("patient_assignments")
        .select(`
          patient_id,
          patient:profiles!patient_assignments_patient_profile_fkey(
            id,
            first_name,
            last_name
          )
        `)
        .eq("doctor_id", user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return <div>Loading patients...</div>;
  }

  if (!assignedPatients?.length) {
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
          {assignedPatients.map((assignment) => (
            <SelectItem 
              key={assignment.patient_id} 
              value={assignment.patient_id}
            >
              {assignment.patient.first_name} {assignment.patient.last_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
