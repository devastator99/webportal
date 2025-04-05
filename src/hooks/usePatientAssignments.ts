
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PatientAssignment {
  patient: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  };
  doctor: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
  nutritionist: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export const usePatientAssignments = () => {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ["patient_assignments_report"],
    queryFn: async () => {
      try {
        console.log("Fetching patient assignments using RPC function");
        
        // Call the secure RPC function to get all patient assignments
        // Using .from().select() instead of .rpc() to avoid type errors
        const { data, error } = await supabase
          .from('patient_assignments_report')
          .select('*');
        
        if (error) {
          console.error("Error fetching patient assignments:", error);
          throw error;
        }
        
        console.log("Patient Assignments Report: Received", data?.length, "patient records");
        
        // Transform the data to match the expected format
        const formattedAssignments = (data || []).map(record => ({
          patient: {
            id: record.patient_id,
            first_name: record.patient_first_name,
            last_name: record.patient_last_name
          },
          doctor: record.doctor_id ? {
            id: record.doctor_id,
            first_name: record.doctor_first_name,
            last_name: record.doctor_last_name
          } : null,
          nutritionist: record.nutritionist_id ? {
            id: record.nutritionist_id,
            first_name: record.nutritionist_first_name,
            last_name: record.nutritionist_last_name
          } : null
        }));
        
        console.log("Patient Assignments Report: Processed", formattedAssignments.length, "assignments");
        return formattedAssignments as PatientAssignment[];
      } catch (error: any) {
        toast({
          title: "Error loading assignments",
          description: error.message || "Failed to load patient assignments",
          variant: "destructive"
        });
        console.error("Error in patient assignments report:", error);
        return [];
      }
    }
  });
};
