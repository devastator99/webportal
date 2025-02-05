
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Upload, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type MedicalRecord = {
  id: string;
  diagnosis: string | null;
  created_at: string;
};

type MedicalDocument = {
  id: string;
  file_name: string;
  file_path: string;
  uploaded_at: string;
};

type MedicalRecordsListProps = {
  records: MedicalRecord[];
};

export const MedicalRecordsList = ({ records }: MedicalRecordsListProps) => {
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (recordId: string, file: File) => {
    try {
      setIsUploading(true);

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('medical_files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('medical_files')
        .getPublicUrl(filePath);

      // Create document record
      const { error: dbError } = await supabase
        .from('medical_documents')
        .insert({
          medical_record_id: recordId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size
        });

      if (dbError) throw dbError;

      toast({
        title: "Document uploaded successfully",
        description: "Your medical document has been uploaded.",
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Error uploading document",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setSelectedRecord(null);
    }
  };

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
              <div key={record.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
                <div>
                  <p className="font-medium">{record.diagnosis || 'General Check-up'}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(record.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
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
                    Upload Document
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
