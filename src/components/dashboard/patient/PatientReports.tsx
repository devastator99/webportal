
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Upload } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

type PatientReport = {
  id: string;
  file_name: string;
  file_type: string | null;
  uploaded_at: string;
};

export const PatientReports = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('medical_files')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Create document record
      const { error: dbError } = await supabase
        .from('medical_documents')
        .insert({
          medical_record_id: user?.id, // Using user ID as record ID for patient uploads
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size
        });

      if (dbError) {
        throw dbError;
      }

      toast({
        title: "Report uploaded successfully",
        description: "Your medical report has been uploaded and saved.",
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Error uploading report",
        description: error.message || "Failed to upload report. Please try again.",
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
          Upload Medical Reports
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full"
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
            {isUploading ? 'Uploading...' : 'Upload New Report'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
