import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface PatientAssignment {
  id: string;
  created_at: string;
  patient: {
    first_name: string;
    last_name: string;
  };
}

interface RecentPatientsProps {
  patients: PatientAssignment[];
}

export const RecentPatients = ({ patients }: RecentPatientsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Patients</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {patients?.slice(0, 5).map((assignment) => (
            <div key={assignment.id} className="flex justify-between items-center">
              <div>
                <p className="font-medium">
                  {assignment.patient.first_name} {assignment.patient.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Assigned: {format(new Date(assignment.created_at), "MMM d, yyyy")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};