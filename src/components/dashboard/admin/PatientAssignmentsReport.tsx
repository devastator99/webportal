
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Users, Stethoscope, Heart, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PatientAssignment {
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

export const PatientAssignmentsReport = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  
  const { data: assignments = [], isLoading, refetch } = useQuery({
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

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refetch();
      toast({
        title: "Assignments refreshed",
        description: "Latest patient assignments have been loaded"
      });
    } catch (error: any) {
      toast({
        title: "Error refreshing data",
        description: error.message || "Failed to refresh assignments",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  const formatName = (profile: { first_name: string | null; last_name: string | null } | null) => {
    if (!profile) return 'Not assigned';
    return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown';
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Patient Care Team Assignments
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={isLoading || refreshing}
          className="gap-1"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Doctor Assignment</TableHead>
                  <TableHead>Nutritionist Assignment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                      No patient assignments found
                    </TableCell>
                  </TableRow>
                ) : (
                  assignments.map((assignment) => (
                    <TableRow key={assignment.patient.id}>
                      <TableCell className="font-medium">{formatName(assignment.patient)}</TableCell>
                      <TableCell>
                        {assignment.doctor ? (
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-blue-500" />
                            <span>{formatName(assignment.doctor)}</span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            No doctor assigned
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {assignment.nutritionist ? (
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-green-500" />
                            <span>{formatName(assignment.nutritionist)}</span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            No nutritionist assigned
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
