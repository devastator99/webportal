import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Eye } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface MedicalReport {
  id: string;
  patient_id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_at: string;
}

export const MedicalRecordsList = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('medical-reports')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'patient_medical_reports',
          filter: `patient_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New medical report uploaded:', payload);
          queryClient.invalidateQueries({ queryKey: ["medical_reports", user.id] });
          toast({
            title: "New report uploaded",
            description: "Your medical reports list has been updated."
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient, toast]);

  const { data: reports, isLoading } = useQuery({
    queryKey: ["medical_reports", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("No user ID");

      const { data, error } = await supabase
        .from('patient_medical_reports')
        .select('*')
        .eq('patient_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('patient_medical_reports')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: `Downloading ${fileName}`
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Unable to download the file. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleView = async (filePath: string) => {
    try {
      const { data } = await supabase.storage
        .from('patient_medical_reports')
        .getPublicUrl(filePath);

      window.open(data.publicUrl, '_blank');
    } catch (error) {
      console.error('View error:', error);
      toast({
        title: "Error",
        description: "Unable to view the file. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Medical Reports
          </div>
          <div className="text-sm font-normal text-muted-foreground">
            Total Reports: {reports?.length || 0}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!reports?.length ? (
          <Alert>
            <AlertDescription>
              No medical reports found. You can upload your medical reports using the upload button.
            </AlertDescription>
          </Alert>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{report.file_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Uploaded on {new Date(report.uploaded_at).toLocaleDateString()}
                      </p>
                      {report.file_size && (
                        <p className="text-sm text-muted-foreground">
                          Size: {(report.file_size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleView(report.file_path)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(report.file_path, report.file_name)}
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
