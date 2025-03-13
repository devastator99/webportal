
import { useAuth } from "@/contexts/AuthContext";
import { PatientProfile } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
        
        // Instead of using the user_roles table which has RLS issues,
        // use the get_patients RPC function which is more reliable
        const { data, error } = await supabase.rpc('get_patients');
        
        if (error) {
          console.error("Error fetching patients:", error);
          throw error;
        }
        
        console.log(`Fetched ${data.length} patient profiles:`, data);
        return data as PatientProfile[];
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
