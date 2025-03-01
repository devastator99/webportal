import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ChatInterface } from "../chat/ChatInterface";
import { useToast } from "@/hooks/use-toast";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { PatientHeader } from "./patient/PatientHeader";
import { PatientStats } from "./patient/PatientStats";
import { AppointmentsList } from "./patient/AppointmentsList";
import { MedicalRecordsUpload } from "./patient/MedicalRecordsUpload";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type Appointment = {
  id: string;
  scheduled_at: string;
  status: string;
  doctor: {
    first_name: string;
    last_name: string;
  };
};

export const PatientDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Successfully signed out",
        description: "You have been signed out of your account",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: "There was a problem signing you out. Please try again.",
      });
    }
  };

  const { data: patientData, isLoading } = useQuery({
    queryKey: ["patient_dashboard", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("No user ID");

      console.log("Fetching patient profile for user:", user.id);
      
      // First get the profile data
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        throw profileError;
      }

      if (!profile) {
        console.error("No profile found for user");
        throw new Error("No profile found");
      }

      console.log("Retrieved profile data:", profile);

      // Use the get_patient_appointments function to fetch appointments
      const { data: appointments, error: appointmentsError } = await supabase
        .rpc('get_patient_appointments', {
          p_patient_id: user.id
        });

      if (appointmentsError) {
        console.error("Appointments fetch error:", appointmentsError);
        throw appointmentsError;
      }

      console.log("Raw appointments data:", appointments);

      // Transform the appointments to match our expected format
      const transformedAppointments = appointments.map(apt => ({
        id: apt.id,
        scheduled_at: apt.scheduled_at,
        status: 'scheduled', // Status is already filtered in the function
        doctor: {
          first_name: apt.doctor_first_name || '',
          last_name: apt.doctor_last_name || ''
        }
      })) as Appointment[];

      console.log("Transformed appointments:", transformedAppointments);

      return {
        profile: {
          first_name: profile.first_name ?? '',
          last_name: profile.last_name ?? ''
        },
        appointments: transformedAppointments
      };
    },
    enabled: !!user?.id,
    staleTime: 30000,
    retry: 1
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Filter upcoming appointments - note that our RPC function already filters for scheduled status
  const upcomingAppointments = patientData?.appointments || [];

  console.log("Final appointments:", upcomingAppointments);

  return (
    <div className="min-h-screen">
      {/* Fixed header */}
      <div className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 border-b">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <PatientHeader />
          <Button 
            onClick={handleSignOut}
            variant="outline" 
            className="border-[#9b87f5] text-[#7E69AB] hover:bg-[#E5DEFF]"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="pt-24 pb-6 space-y-8">
          {/* Stats Row */}
          <PatientStats />

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column - View Content */}
            <div className="flex-1">
              <AppointmentsList appointments={upcomingAppointments} />
            </div>

            {/* Right Column - Actions */}
            <div className="lg:w-[400px] space-y-6">
              <MedicalRecordsUpload showUploadOnly />
              <ChatInterface />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
