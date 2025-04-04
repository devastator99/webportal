
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Heart } from "lucide-react";
import { PatientAssignment } from "@/hooks/usePatientAssignments";

interface PatientAssignmentsTableProps {
  assignments: PatientAssignment[];
}

export const PatientAssignmentsTable = ({ assignments }: PatientAssignmentsTableProps) => {
  const formatName = (profile: { first_name: string | null; last_name: string | null } | null) => {
    if (!profile) return 'Not assigned';
    return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown';
  };
  
  return (
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
  );
};
