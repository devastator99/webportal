
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

interface DoctorSelectorProps {
  form: UseFormReturn<AppointmentFormData>;
}

export function DoctorSelector({ form }: DoctorSelectorProps) {
  const { user } = useAuth();

  // Fetch doctors using RPC function
  const { data: doctors, isLoading: isLoadingDoctors } = useQuery({
    queryKey: ['rpc_patient_doctors', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return [];
      }
      
      try {
        // Use the get_users_by_role RPC function to get doctor user_ids
        const { data: doctorUserIds, error: rpcError } = await supabase
          .rpc('get_users_by_role', { role_name: 'doctor' });
        
        if (rpcError) {
          console.error("Error fetching doctor user IDs via RPC:", rpcError);
          throw rpcError;
        }
        
        if (!doctorUserIds || doctorUserIds.length === 0) {
          return [];
        }
        
        // Get profiles for these doctors
        const doctorProfiles = [];
        for (const item of doctorUserIds) {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id, first_name, last_name")
            .eq("id", item.user_id)
            .single();
            
          if (profileError) {
            console.error(`Error fetching profile for ${item.user_id}:`, profileError);
            continue;
          }
          
          if (profile) {
            doctorProfiles.push(profile);
          }
        }
        
        return doctorProfiles;
      } catch (error) {
        console.error("Error fetching doctors:", error);
        return [];
      }
    },
    enabled: !!user?.id,
  });

  return (
    <FormField
      control={form.control}
      name="doctorId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Doctor</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a doctor" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {isLoadingDoctors ? (
                <SelectItem value="loading" disabled>Loading doctors...</SelectItem>
              ) : doctors && doctors.length > 0 ? (
                doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    {doctor.first_name} {doctor.last_name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>No doctors assigned to you</SelectItem>
              )}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
