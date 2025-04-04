
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PatientProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

export interface PatientAssignment {
  patient: PatientProfile;
  doctor: PatientProfile | null;
  nutritionist: PatientProfile | null;
}

export const usePatientAssignments = () => {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ["patient_assignments_report"],
    queryFn: async () => {
      try {
        console.log("Fetching patient assignments report");
        
        // Get all patients
        const { data: patients, error: patientsError } = await supabase.rpc('get_admin_patients');
        
        if (patientsError) {
          console.error("Error fetching patients:", patientsError);
          throw patientsError;
        }
        
        console.log("Patient Assignments Report: Found", patients?.length, "patients");
        
        // Get all assignments directly from patient_assignments table
        const { data: allAssignments, error: assignmentsError } = await supabase
          .from('patient_assignments')
          .select(`
            id,
            patient_id,
            doctor_id,
            nutritionist_id
          `);
        
        if (assignmentsError) {
          console.error("Error fetching assignments:", assignmentsError);
          throw assignmentsError;
        }
        
        console.log("Patient Assignments Report: Found", allAssignments?.length, "assignments");
        
        // Get all profiles for doctors and nutritionists
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name');
          
        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          throw profilesError;
        }
        
        // Create maps for faster lookups
        const profileMap = new Map();
        profiles?.forEach(profile => {
          profileMap.set(profile.id, profile);
        });
        
        const assignmentMap = new Map();
        allAssignments?.forEach(assignment => {
          assignmentMap.set(assignment.patient_id, {
            doctorId: assignment.doctor_id,
            nutritionistId: assignment.nutritionist_id
          });
        });
        
        // Map patients to their assignments
        const patientAssignments = patients.map(patient => {
          const assignment = assignmentMap.get(patient.id);
          
          return {
            patient,
            doctor: assignment?.doctorId ? profileMap.get(assignment.doctorId) : null,
            nutritionist: assignment?.nutritionistId ? profileMap.get(assignment.nutritionistId) : null
          };
        });
        
        console.log("Patient Assignments Report: Processed", patientAssignments.length, "assignments");
        return patientAssignments as PatientAssignment[];
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
