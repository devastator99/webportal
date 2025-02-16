
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

  // Direct query to count reports without any policy checks
  const { data: reportsCount = 0 } = useQuery({
    queryKey: ["medical_reports_count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from('patient_medical_reports')
        .select('*', { count: 'exact' })
        .eq('patient_id', user.id);

      if (error) {
        console.error('Error fetching reports count:', error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!user?.id
  });

  // Simple query for latest report
  const { data: latestReport } = useQuery({
    queryKey: ["latest_medical_report", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('patient_medical_reports')
        .select('file_name, file_path')
        .eq('patient_id', user.id)
        .order('uploaded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching latest report:', error);
        return null;
      }

      return data;
    },
    enabled: !!user?.id
  });

  const handleViewReports = async () => {
    try {
      if (!latestReport) {
        toast({
          title: "No reports found",
          description: "You haven't uploaded any medical reports yet.",
        });
        return;
      }

      const { data } = await supabase.storage
        .from('patient_medical_reports')
        .getPublicUrl(latestReport.file_path);

      window.open(data.publicUrl, '_blank');
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
          <div className="text-2xl font-bold">{reportsCount}</div>
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
          <div className="text-2xl font-bold">{reportsCount}</div>
          {reportsCount > 0 && (
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
