import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface PatientSelectorProps {
  selectedPatientId: string | null;
  onPatientSelect: (patientId: string) => void;
}

export const PatientSelector = ({ selectedPatientId, onPatientSelect }: PatientSelectorProps) => {
  const { user } = useAuth();

  const { data: assignedPatients } = useQuery({
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

  return (
    <select
      className="mt-2 w-full p-2 rounded-md border"
      value={selectedPatientId || ""}
      onChange={(e) => onPatientSelect(e.target.value)}
    >
      {assignedPatients?.map((assignment) => (
        <option key={assignment.patient_id} value={assignment.patient_id}>
          {assignment.patient.first_name} {assignment.patient.last_name}
        </option>
      ))}
    </select>
  );
};