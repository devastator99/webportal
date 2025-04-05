
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

// Define a type for the raw data returned from the view
interface PatientAssignmentRow {
  patient_id: string;
  patient_first_name: string | null;
  patient_last_name: string | null;
  doctor_id: string | null;
  doctor_first_name: string | null;
  doctor_last_name: string | null;
  nutritionist_id: string | null;
  nutritionist_first_name: string | null;
  nutritionist_last_name: string | null;
}

export const usePatientAssignments = () => {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ["patient_assignments_report"],
    queryFn: async () => {
      try {
        console.log("Fetching patient assignments using RPC function");
        
        // Call the secure RPC function directly to avoid typings issues
        const { data, error } = await supabase.rpc('get_patient_assignments_report');
        
        if (error) {
          console.error("Error fetching patient assignments:", error);
          throw error;
        }
        
        const typedData = data as PatientAssignmentRow[];
        console.log("Patient Assignments Report: Received", typedData?.length, "patient records");
        
        // Transform the data to match the expected format
        const formattedAssignments = (typedData || []).map(record => ({
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
