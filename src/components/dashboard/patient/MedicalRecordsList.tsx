
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DocumentSummary } from "../doctor/DocumentSummary";

type MedicalRecord = {
  id: string;
  diagnosis: string | null;
  created_at: string;
};

type MedicalRecordsListProps = {
  records: MedicalRecord[];
};

export const MedicalRecordsList = ({ records }: MedicalRecordsListProps) => {
  // Query to fetch documents for all records
  const { data: documents } = useQuery({
    queryKey: ["medical_documents", records.map(r => r.id)],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_documents')
        .select('*')
        .in('medical_record_id', records.map(r => r.id));

      if (error) throw error;
      return data;
    },
    enabled: records.length > 0
  });

  if (!records.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Medical Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              No medical records found. Records will appear here once they are created by your doctor.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Medical Records History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {records.map((record) => {
              const recordDocuments = documents?.filter(
                doc => doc.medical_record_id === record.id
              ) || [];

              return (
                <div key={record.id} className="space-y-4">
                  <div className="p-4 border rounded-lg hover:bg-gray-50">
                    <p className="font-medium">{record.diagnosis || 'General Check-up'}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(record.created_at).toLocaleDateString()}
                    </p>
                    {recordDocuments.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {recordDocuments.length} document{recordDocuments.length !== 1 ? 's' : ''} attached
                      </p>
                    )}
                  </div>

                  {recordDocuments.map(doc => (
                    <DocumentSummary
                      key={doc.id}
                      documentId={doc.id}
                      documentPath={doc.file_path}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
