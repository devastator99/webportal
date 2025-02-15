
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

type Report = {
  id: string;
  file_name: string;
  file_path: string;
  created_at: string;
};

type PatientReportsProps = {
  reports: Report[];
};

export const PatientReports = ({ reports }: PatientReportsProps) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  const handleFileUpload = async (file: File) => {
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
          throw new Error("You don't have permission to upload files.");
        }
        throw uploadError;
      }

      // Create document record
      const { error: dbError } = await supabase
        .from('medical_documents')
        .insert({
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size
        });

      if (dbError) throw dbError;

      toast({
        title: "Document uploaded successfully",
        description: "Your medical document has been uploaded and saved.",
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Error uploading document",
        description: error.message || "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewDocument = async (report: Report) => {
    try {
      const { data } = await supabase.storage
        .from('medical_files')
        .createSignedUrl(report.file_path, 60);

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Error viewing document",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Medical Reports
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
                  handleFileUpload(file);
                }
              };
              input.click();
            }}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4" />
            {isUploading ? 'Uploading...' : 'Upload Report'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {reports.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No medical reports available
              </p>
            ) : (
              reports.map((report) => (
                <div
                  key={report.id}
                  className="flex justify-between items-center p-2 border rounded hover:bg-accent"
                >
                  <span className="text-sm font-medium truncate">
                    {report.file_name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDocument(report)}
                  >
                    View
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
