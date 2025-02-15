
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Medical Reports
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
