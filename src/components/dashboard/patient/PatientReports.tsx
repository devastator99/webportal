
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Upload } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";

type PatientReport = {
  id: string;
  file_name: string;
  file_type: string | null;
  file_path: string;
  file_size: number;
  created_at: string;
};

export const PatientReports = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: reports, refetch } = useQuery({
    queryKey: ["patient_reports", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_documents')
        .select('*')
        .eq('medical_record_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reports:', error);
        throw error;
      }
      return data as PatientReport[];
    },
    enabled: !!user?.id
  });

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('medical_files')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      // Create document record
      const { error: dbError } = await supabase
        .from('medical_documents')
        .insert({
          medical_record_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size
        });

      if (dbError) {
        console.error('Database insert error:', dbError);
        throw dbError;
      }

      await refetch();

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

  const handleViewDocument = async (report: PatientReport) => {
    try {
      const { data, error } = await supabase.storage
        .from('medical_files')
        .createSignedUrl(report.file_path, 60);

      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error: any) {
      console.error('Error viewing document:', error);
      toast({
        title: "Error viewing file",
        description: error.message || "Failed to access the file.",
        variant: "destructive",
      });
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

          {reports && reports.length > 0 ? (
            <ScrollArea className="h-[300px] w-full">
              <div className="space-y-2">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-2 border rounded hover:bg-accent"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium truncate">{report.file_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDocument(report)}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No reports uploaded yet. Upload your first medical report.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
