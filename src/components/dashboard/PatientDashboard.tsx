import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { PatientStats } from "./patient/PatientStats";
import { DashboardHeader } from "./DashboardHeader";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { ScheduleAppointment } from "../appointments/ScheduleAppointment";
import { Suspense, lazy } from "react";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load components
const LazyAppointmentsList = lazy(() => 
  import('./patient/AppointmentsList').then(module => ({ 
    default: module.AppointmentsList 
  }))
);

const LazyMedicalRecordsUpload = lazy(() => 
  import('./patient/MedicalRecordsUpload').then(module => ({ 
    default: module.MedicalRecordsUpload 
  }))
);

const LazyChatInterface = lazy(() => 
  import('../chat/ChatInterface').then(module => ({ 
    default: module.ChatInterface 
  }))
);

// Loading fallback component
const LoadingFallback = () => (
  <div className="space-y-3 p-4">
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-12 w-3/4" />
  </div>
);

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
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: patientData, isLoading } = useQuery({
    queryKey: ["patient_dashboard", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("No user ID");
      
      // First get the profile data
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      if (!profile) {
        throw new Error("No profile found");
      }

      // Use the get_patient_appointments function to fetch appointments
      const { data: appointments, error: appointmentsError } = await supabase
        .rpc('get_patient_appointments', {
          p_patient_id: user.id
        });

      if (appointmentsError) {
        throw appointmentsError;
      }

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

  // Create action button for the header
  const actionButton = (
    <ScheduleAppointment callerRole="patient">
      <Button 
        className="text-[#9b87f5] hover:text-[#7E69AB] bg-transparent hover:bg-[#E5DEFF] flex items-center gap-2 text-sm border-0 shadow-none"
        size="sm"
        variant="ghost"
      >
        <Calendar className="h-4 w-4" />
        <span>New Appointment</span>
      </Button>
    </ScheduleAppointment>
  );

  return (
    <div className="container mx-auto pt-20 pb-6 px-6 space-y-6">
      <DashboardHeader actionButton={actionButton} />
      
      {/* Stats Row - Always loaded since it's essential and compact */}
      <PatientStats />

      {/* Main Content - Use collapsible sections with lazy loading */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-1">
          <CollapsibleSection title="Your Appointments" defaultOpen={true}>
            <Suspense fallback={<LoadingFallback />}>
              <LazyAppointmentsList appointments={upcomingAppointments} />
            </Suspense>
          </CollapsibleSection>
        </div>
        
        <div className="lg:col-span-2 space-y-6">
          <CollapsibleSection title="Upload Medical Records" defaultOpen={false}>
            <Suspense fallback={<LoadingFallback />}>
              <LazyMedicalRecordsUpload showUploadOnly />
            </Suspense>
          </CollapsibleSection>
          
          <CollapsibleSection title="Chat with Doctor" defaultOpen={false}>
            <Suspense fallback={<LoadingFallback />}>
              <LazyChatInterface />
            </Suspense>
          </CollapsibleSection>
        </div>
      </div>
    </div>
  );
};
