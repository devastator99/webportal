
import { UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppointmentFormData } from "./schema";

interface PatientSelectorProps {
  form: UseFormReturn<AppointmentFormData>;
}

export function PatientSelector({ form }: PatientSelectorProps) {
  const { user } = useAuth();

  // Fetch patients using RPC function
  const { data: patients, isLoading: isLoadingPatients } = useQuery({
    queryKey: ['rpc_doctor_patients', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return [];
      }
      
      console.log("Fetching patients for doctor using RPC:", user.id);
      
      try {
        // Use the get_users_by_role RPC function to get patient user_ids
        const { data: patientUserIds, error: rpcError } = await supabase
          .rpc('get_users_by_role', { role_name: 'patient' });
        
        if (rpcError) {
          console.error("Error fetching patient user IDs via RPC:", rpcError);
          throw rpcError;
        }
        
        if (!patientUserIds || patientUserIds.length === 0) {
          return [];
        }
        
        // Get profiles for these patients
        const patientProfiles = [];
        for (const item of patientUserIds) {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id, first_name, last_name")
            .eq("id", item.user_id)
            .single();
            
          if (profileError) {
            console.error(`Error fetching profile for ${item.user_id}:`, profileError);
            continue; // Skip this profile but continue with others
          }
          
          if (profile) {
            patientProfiles.push(profile);
          }
        }
        
        return patientProfiles;
      } catch (error) {
        console.error("Error fetching patients:", error);
        return [];
      }
    },
    enabled: !!user?.id,
  });

  return (
    <FormField
      control={form.control}
      name="patientId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Patient</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a patient" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {isLoadingPatients ? (
                <SelectItem value="loading" disabled>Loading patients...</SelectItem>
              ) : patients && patients.length > 0 ? (
                patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.first_name} {patient.last_name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>No patients found</SelectItem>
              )}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
