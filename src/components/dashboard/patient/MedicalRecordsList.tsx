import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";

type MedicalRecord = {
  id: string;
  diagnosis: string | null;
  created_at: string;
};

type MedicalRecordsListProps = {
  records: MedicalRecord[];
};

export const MedicalRecordsList = ({ records }: MedicalRecordsListProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Recent Medical Records
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {records.map((record) => (
              <div key={record.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{record.diagnosis || 'General Check-up'}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(record.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};