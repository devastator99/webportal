
import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar, FileText, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface DoctorStats {
  patients_count: number;
  medical_records_count: number;
  todays_appointments: number;
  upcoming_appointments: number;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
}

export const StatsCards = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [statsData, setStatsData] = useState<DoctorStats | null>(null);
  const [showPatientsDialog, setShowPatientsDialog] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  // Query to fetch initial stats
  const { isLoading, isError, refetch } = useQuery({
    queryKey: ["doctor_dashboard_stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      try {
        console.log("Fetching dashboard stats for doctor:", user.id);
        
        // Use the database function to get all stats in one query
        const { data, error } = await supabase.functions.invoke('get-doctor-stats', {
          body: { 
            type: 'all',
            doctor_id: user.id 
          }
        });
        
        if (error) {
          throw new Error('Failed to fetch doctor stats: ' + error.message);
        }
        
        console.log("Dashboard stats fetched:", data);
        
        // Update local state with the fetched data
        if (data && data[0]) {
          setStatsData({
            patients_count: Number(data[0].patients_count) || 0,
            medical_records_count: Number(data[0].medical_records_count) || 0,
            todays_appointments: Number(data[0].todays_appointments) || 0,
            upcoming_appointments: Number(data[0].upcoming_appointments) || 0
          });
        } else {
          // Default values if no data is returned
          setStatsData({
            patients_count: 0,
            medical_records_count: 0,
            todays_appointments: 0,
            upcoming_appointments: 0
          });
        }
        
        return data;
      } catch (error) {
        console.error("Error fetching doctor stats:", error);
        toast({
          title: "Error loading statistics",
          description: "Failed to load one or more statistics. Please try again later.",
          variant: "destructive",
        });
        return null;
      }
    },
    enabled: !!user?.id,
    staleTime: 60000, // Cache for 1 minute
    retry: 1,
  });

  // Function to fetch patients assigned to the doctor
  const fetchPatients = async () => {
    if (!user?.id) return;
    
    setLoadingPatients(true);
    try {
      const { data, error } = await supabase.rpc(
        'get_doctor_patients',
        { p_doctor_id: user.id }
      );
      
      if (error) throw error;
      
      setPatients(data || []);
    } catch (err) {
      console.error('Error fetching patients:', err);
      toast({
        title: "Error loading patients",
        description: "Failed to load patient list. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingPatients(false);
    }
  };

  // Set up realtime subscriptions to update stats when data changes
  useEffect(() => {
    if (!user?.id) return;

    // Create a realtime channel to listen for changes
    const channel = supabase
      .channel('doctor-stats-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'patient_assignments',
          filter: `doctor_id=eq.${user.id}`
        },
        () => refetch()
      )
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'medical_records',
          filter: `doctor_id=eq.${user.id}`
        },
        () => refetch()
      )
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'appointments',
          filter: `doctor_id=eq.${user.id}`
        },
        () => refetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetch]);

  // Manual refresh every 2 minutes as a fallback
  useEffect(() => {
    const interval = setInterval(() => {
      if (user?.id) refetch();
    }, 120000); // 2 minutes
    
    return () => clearInterval(interval);
  }, [user?.id, refetch]);

  // Handle opening the patients dialog
  const handleOpenPatientsDialog = () => {
    fetchPatients();
    setShowPatientsDialog(true);
  };

  // Navigate to patient prescriptions
  const navigateToPatientPrescriptions = (patientId: string) => {
    navigate(`/patient/${patientId}/prescriptions`);
    setShowPatientsDialog(false);
  };

  if (isLoading) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <Skeleton className="h-12 w-12 rounded-full mb-2" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-4 w-20 mt-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Dialog open={showPatientsDialog} onOpenChange={setShowPatientsDialog}>
            <DialogTrigger asChild>
              <div 
                className="flex flex-col items-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                onClick={handleOpenPatientsDialog}
              >
                <div className="bg-[#E5DEFF] p-3 rounded-full mb-2">
                  <Users className="h-6 w-6 text-[#9b87f5]" />
                </div>
                <span className="text-2xl font-bold">{isError ? "0" : statsData?.patients_count || 0}</span>
                <span className="text-xs text-gray-500 text-center">Patients</span>
              </div>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Your Patients</DialogTitle>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto">
                {loadingPatients ? (
                  <div className="flex justify-center p-8">
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : patients.length === 0 ? (
                  <div className="text-center p-8 text-gray-500">
                    No patients assigned to you yet.
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {patients.map((patient) => (
                      <div 
                        key={patient.id}
                        className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigateToPatientPrescriptions(patient.id)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Prescriptions
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          <div className="flex flex-col items-center">
            <div className="bg-[#FDE1D3] p-3 rounded-full mb-2">
              <Calendar className="h-6 w-6 text-[#F97316]" />
            </div>
            <span className="text-2xl font-bold">{isError ? "0" : statsData?.todays_appointments || 0}</span>
            <span className="text-xs text-gray-500 text-center">Today</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-[#D3E4FD] p-3 rounded-full mb-2">
              <FileText className="h-6 w-6 text-[#0EA5E9]" />
            </div>
            <span className="text-2xl font-bold">{isError ? "0" : statsData?.medical_records_count || 0}</span>
            <span className="text-xs text-gray-500 text-center">Records</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-[#F2FCE2] p-3 rounded-full mb-2">
              <Clock className="h-6 w-6 text-green-500" />
            </div>
            <span className="text-2xl font-bold">{isError ? "0" : statsData?.upcoming_appointments || 0}</span>
            <span className="text-xs text-gray-500 text-center">Upcoming</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
