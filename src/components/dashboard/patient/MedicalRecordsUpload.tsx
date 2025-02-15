
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { DocumentSummary } from "../doctor/DocumentSummary";

type MedicalRecord = {
  id: string;
  diagnosis: string | null;
  created_at: string;
};

type MedicalRecordsUploadProps = {
  records: MedicalRecord[];
};

export const MedicalRecordsUpload = ({ records }: MedicalRecordsUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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

  const handleFileUpload = async (recordId: string, file: File) => {
    try {
      setIsUploading(true);

      // Check auth status first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to upload documents.",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('medical_files')
        .upload(filePath, file);

      if (uploadError) {
        if (uploadError.message.includes('Permission denied')) {
          throw new Error("You don't have permission to upload files to this medical record.");
        }
        throw uploadError;
      }

      // Create document record
      const { data: document, error: dbError } = await supabase
        .from('medical_documents')
        .insert({
          medical_record_id: recordId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size
        })
        .select()
        .single();

      if (dbError) {
        if (dbError.message.includes('foreign key constraint')) {
          throw new Error("Unable to link document to the medical record. Please ensure the record exists.");
        }
        throw dbError;
      }

      toast({
        title: "Document uploaded successfully",
        description: "Your medical document has been uploaded and saved.",
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Error uploading document",
        description: error.message || "Failed to upload document. Please ensure you have the right permissions.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Medical Documents
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
                  <div className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="font-medium">{record.diagnosis || 'General Check-up'}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(record.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            handleFileUpload(record.id, file);
                          }
                        };
                        input.click();
                      }}
                      disabled={isUploading}
                    >
                      <Upload className="h-4 w-4" />
                      {isUploading ? 'Uploading...' : 'Upload Document'}
                    </Button>
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
