
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, FileText, Heart, Clock, Upload } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

type MedicalReport = {
  id: string;
  file_name: string;
  file_path: string;
  uploaded_at: string;
};

type Appointment = {
  id: string;
  scheduled_at: string;
  status: string;
  doctor: {
    first_name: string;
    last_name: string;
  };
};

export const PatientStats = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isReportsOpen, setIsReportsOpen] = useState(false);

  // Query to fetch appointments
  const { data: appointments = [] } = useQuery<Appointment[], Error>({
    queryKey: ["patient_appointments", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .rpc('get_patient_appointments', {
          p_patient_id: user.id
        });

      if (error) {
        console.error('Error fetching appointments:', error);
        toast({
          title: "Error",
          description: "Could not fetch appointments",
          variant: "destructive"
        });
        return [];
      }

      return data.map(apt => ({
        id: apt.id,
        scheduled_at: apt.scheduled_at,
        status: apt.status,
        doctor: {
          first_name: apt.doctor_first_name || '',
          last_name: apt.doctor_last_name || ''
        }
      }));
    },
    enabled: !!user?.id
  });

  // Query to fetch medical reports using the RPC function
  const { data: reports = [] } = useQuery<MedicalReport[], Error>({
    queryKey: ["medical_reports", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .rpc('get_patient_medical_reports', {
          p_patient_id: user.id
        });

      if (error) {
        console.error('Error fetching reports:', error);
        toast({
          title: "Error",
          description: "Could not fetch medical reports",
          variant: "destructive"
        });
        return [];
      }

      return data || [];
    },
    enabled: !!user?.id
  });

  const handleViewReport = async (report: MedicalReport) => {
    try {
      console.log('Attempting to view report:', report.id);
      
      // First get the secure file path using our RPC function
      const { data: filePath, error: rpcError } = await supabase
        .rpc<string, { p_report_id: string }>('get_medical_report_url', {
          p_report_id: report.id
        });

      if (rpcError || !filePath) {
        console.error('Error getting secure file path:', rpcError);
        toast({
          title: "Error",
          description: "Unable to access the report. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Now create a signed URL using the secure file path
      const { data: urlData, error: urlError } = await supabase.storage
        .from('patient_medical_reports')
        .createSignedUrl(filePath, 3600); // URL valid for 1 hour

      if (urlError || !urlData?.signedUrl) {
        console.error('Error creating signed URL:', urlError);
        toast({
          title: "Error",
          description: "Unable to generate report URL. Please try again.",
          variant: "destructive"
        });
        return;
      }

      window.open(urlData.signedUrl, '_blank');
    } catch (error) {
      console.error('Error viewing report:', error);
      toast({
        title: "Error",
        description: "Unable to view the report. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Get next appointment date
  const nextAppointment = appointments[0];
  const nextAppointmentDate = nextAppointment 
    ? new Date(nextAppointment.scheduled_at).toLocaleDateString() 
    : null;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medical Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
            {reports.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2"
                onClick={() => setIsReportsOpen(true)}
              >
                View All Reports
              </Button>
            )}
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
            <CardTitle className="text-sm font-medium">Latest Report</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">{reports[0]?.file_name || "No reports"}</div>
            {reports[0] && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => handleViewReport(reports[0])}
              >
                View Latest
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isReportsOpen} onOpenChange={setIsReportsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Medical Reports</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] w-full pr-4">
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.id}>
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold">{report.file_name}</h4>
                        <p className="text-xs text-muted-foreground">
                          Uploaded: {new Date(report.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewReport(report)}
                      >
                        View Report
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
              {reports.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No medical reports available
                </p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};
