
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PatientReport[];
    },
    enabled: !!user?.id
  });

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      
      const fileName = `${crypto.randomUUID()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('medical_files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      await supabase.from('medical_documents').insert({
        file_name: file.name,
        file_path: fileName,
        file_type: file.type,
        medical_record_id: null
      });

      await refetch();
      toast({ title: "Report uploaded successfully" });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewDocument = async (report: PatientReport) => {
    try {
      const { data } = await supabase.storage
        .from('medical_files')
        .createSignedUrl(report.file_path, 60);

      if (data?.signedUrl) window.open(data.signedUrl, '_blank');
    } catch (error: any) {
      toast({
        title: "Error viewing file",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Medical Reports
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
                if (file) handleFileUpload(file);
              };
              input.click();
            }}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload Report'}
          </Button>

          {reports?.length ? (
            <ScrollArea className="h-[300px] w-full">
              <div className="space-y-2">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-2 border rounded hover:bg-accent"
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
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No reports uploaded yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
