
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { PatientStats } from "./patient/PatientStats";
import { DashboardHeader } from "./DashboardHeader";
import { Suspense, lazy } from "react";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { Skeleton } from "@/components/ui/skeleton";
import { featureFlags } from "@/config/features";

// Lazy load components
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

      return {
        profile: {
          first_name: profile.first_name ?? '',
          last_name: profile.last_name ?? ''
        }
      };
    },
    enabled: !!user?.id,
    staleTime: 30000,
    retry: 1
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="container mx-auto pt-20 pb-6 px-6 space-y-6">
      <DashboardHeader />
      
      {/* Stats Row - Always loaded since it's essential and compact */}
      <PatientStats />

      {/* Main Content - Use collapsible sections with lazy loading */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <CollapsibleSection title="Upload Medical Records" defaultOpen={true}>
            <Suspense fallback={<LoadingFallback />}>
              <LazyMedicalRecordsUpload showUploadOnly />
            </Suspense>
          </CollapsibleSection>
          
          {/* Only show chat if enabled */}
          {featureFlags.enableChat && featureFlags.patientDashboardChat && (
            <CollapsibleSection title="Chat with Doctor" defaultOpen={false}>
              <Suspense fallback={<LoadingFallback />}>
                <LazyChatInterface />
              </Suspense>
            </CollapsibleSection>
          )}
        </div>
      </div>
    </div>
  );
};
