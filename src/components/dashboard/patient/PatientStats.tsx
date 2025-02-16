
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, FileText, Heart, Clock, Upload } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type PatientStatsProps = {
  appointmentsCount: number;
  nextAppointmentDate: string | null;
};

export const PatientStats = ({
  appointmentsCount,
  nextAppointmentDate,
}: PatientStatsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Query for medical reports - simplified direct query
  const { data: reports = [] } = useQuery({
    queryKey: ["medical_reports_count", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      console.log('Fetching medical reports for stats');
      const { data, error } = await supabase
        .from('patient_medical_reports')
        .select('id, file_name, file_path, uploaded_at')
        .eq('patient_id', user.id);

      if (error) {
        console.error('Error fetching reports:', error);
        toast({
          title: "Error fetching reports",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }

      console.log('Fetched medical reports:', data);
      return data || [];
    },
    enabled: !!user?.id
  });

  const handleViewReports = async () => {
    try {
      if (!user?.id) return;

      // Open latest report if available
      if (reports.length > 0) {
        const latestReport = reports[0];
        console.log('Attempting to view report:', latestReport);

        // Get a public URL for the file using the authenticated session
        const { data } = await supabase.storage
          .from('patient_medical_reports')
          .getPublicUrl(latestReport.file_path);

        console.log('Generated public URL:', data.publicUrl);
        window.open(data.publicUrl, '_blank');
      } else {
        toast({
          title: "No reports found",
          description: "You haven't uploaded any medical reports yet.",
        });
      }
    } catch (error) {
      console.error('Error viewing report:', error);
      toast({
        title: "Error",
        description: "Unable to view the report. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{appointmentsCount}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Medical Records</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{reports.length}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Health Status</CardTitle>
          <Heart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">Good</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Next Check-up</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {nextAppointmentDate || 'No appointments'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Medical Reports</CardTitle>
          <Upload className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold">{reports.length}</div>
          {reports.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={handleViewReports}
            >
              View Latest
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
