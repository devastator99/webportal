
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PatientAssignment } from "@/hooks/usePatientAssignments";

interface PatientAssignmentsTableProps {
  assignments: PatientAssignment[];
}

export const PatientAssignmentsTable = ({ assignments }: PatientAssignmentsTableProps) => {
  console.log("Rendering PatientAssignmentsTable with", assignments.length, "assignments");
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>Doctor</TableHead>
            <TableHead>Nutritionist</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.length > 0 ? (
            assignments.map((assignment, index) => (
              <TableRow key={`${assignment.patient.id}-${index}`}>
                <TableCell className="font-medium">
                  {assignment.patient.first_name || ''} {assignment.patient.last_name || ''}
                </TableCell>
                <TableCell>
                  {assignment.doctor ? 
                    `${assignment.doctor.first_name || ''} ${assignment.doctor.last_name || ''}` : 
                    'Not Assigned'}
                </TableCell>
                <TableCell>
                  {assignment.nutritionist ? 
                    `${assignment.nutritionist.first_name || ''} ${assignment.nutritionist.last_name || ''}` : 
                    'Not Assigned'}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="h-24 text-center">
                No patient assignments found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
