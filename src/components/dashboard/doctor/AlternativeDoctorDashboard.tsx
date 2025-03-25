import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { StatsCards } from "@/components/dashboard/doctor/StatsCards";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { AiAssistant } from "@/components/dashboard/doctor/AiAssistant";
import { DoctorAppointmentCalendar } from "@/components/dashboard/doctor/DoctorAppointmentCalendar";
import { VideoUploader } from "@/components/videos/VideoUploader";
import { VideoList } from "@/components/videos/VideoList";
import { DocumentAnalyzer } from "@/components/dashboard/doctor/DocumentSummary";
import { PrescriptionWriter } from "@/components/dashboard/doctor/PrescriptionWriter";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Mic, Layout } from "lucide-react";
import { ScheduleAppointment } from "@/components/appointments/ScheduleAppointment";
import { useNavigate } from "react-router-dom";
import { useState, Suspense, lazy } from "react";
import { VoiceScheduler } from "@/components/voice/VoiceScheduler";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { Skeleton } from "@/components/ui/skeleton";
import { featureFlags } from "@/config/features";

// Create lazy-loaded components
const LazyDoctorAppointmentCalendar = lazy(() => 
  import('@/components/dashboard/doctor/DoctorAppointmentCalendar').then(module => ({ 
    default: module.DoctorAppointmentCalendar 
  }))
);

const LazyDocumentAnalyzer = lazy(() => 
  import('@/components/dashboard/doctor/DocumentSummary').then(module => ({ 
    default: module.DocumentAnalyzer 
  }))
);

const LazyPrescriptionWriter = lazy(() => 
  import('@/components/dashboard/doctor/PrescriptionWriter').then(module => ({ 
    default: module.PrescriptionWriter 
  }))
);

const LazyAiAssistant = lazy(() => 
  import('@/components/dashboard/doctor/AiAssistant').then(module => ({ 
    default: module.AiAssistant 
  }))
);

const LazyChatInterface = lazy(() => 
  import('@/components/chat/ChatInterface').then(module => ({ 
    default: module.ChatInterface 
  }))
);

const LazyVideoUploader = lazy(() => 
  import('@/components/videos/VideoUploader').then(module => ({ 
    default: module.VideoUploader 
  }))
);

const LazyVideoList = lazy(() => 
  import('@/components/videos/VideoList').then(module => ({ 
    default: module.VideoList 
  }))
);

const LazyDoctorVideoUploader = lazy(() => 
  import('@/components/dashboard/doctor/DoctorVideoUploader').then(module => ({ 
    default: module.DoctorVideoUploader 
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

export const AlternativeDoctorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showVoiceScheduler, setShowVoiceScheduler] = useState(false);
  
  // Create the action buttons to pass to the header
  const actionButtons = (
    <>
      <Button 
        className="w-full justify-start text-[#9b87f5] hover:text-[#7E69AB] bg-transparent hover:bg-[#E5DEFF] flex items-center gap-2 text-sm border-0 shadow-none"
        size="sm"
        variant="ghost"
        onClick={() => {
          navigate("/patients");
        }}
      >
        <Users className="h-4 w-4" />
        <span>Patients</span>
      </Button>
      
      <ScheduleAppointment callerRole="doctor">
        <Button 
          className="w-full justify-start text-[#9b87f5] hover:text-[#7E69AB] bg-transparent hover:bg-[#E5DEFF] flex items-center gap-2 text-sm border-0 shadow-none"
          size="sm"
          variant="ghost"
        >
          <Calendar className="h-4 w-4" />
          <span>Schedule</span>
        </Button>
      </ScheduleAppointment>

      <Button 
        className="w-full justify-start text-[#9b87f5] hover:text-[#7E69AB] bg-transparent hover:bg-[#E5DEFF] flex items-center gap-2 text-sm border-0 shadow-none"
        size="sm"
        variant="ghost"
        onClick={() => setShowVoiceScheduler(true)}
      >
        <Mic className="h-4 w-4" />
        <span>Voice Schedule</span>
      </Button>
      
      <Button 
        className="w-full justify-start text-[#9b87f5] hover:text-[#7E69AB] bg-transparent hover:bg-[#E5DEFF] flex items-center gap-2 text-sm border-0 shadow-none"
        size="sm"
        variant="ghost"
        onClick={() => navigate("/dashboard")}
      >
        <Layout className="h-4 w-4" />
        <span>Standard View</span>
      </Button>
    </>
  );
  
  return (
    <div className="container mx-auto pt-20 pb-6 px-6 space-y-6">
      <DashboardHeader actionButton={actionButtons} />
      
      {showVoiceScheduler && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
          <div className="w-full max-w-md">
            <VoiceScheduler onClose={() => setShowVoiceScheduler(false)} />
          </div>
        </div>
      )}
      
      {/* Stats are always loaded since they're small and critical */}
      <StatsCards />

      <ScrollArea className="h-[calc(100vh-220px)]">
        <div className="space-y-6 pr-4">
          <CollapsibleSection title="Appointments Calendar" defaultOpen={true}>
            <Suspense fallback={<LoadingFallback />}>
              <LazyDoctorAppointmentCalendar doctorId={user?.id || ""} />
            </Suspense>
          </CollapsibleSection>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CollapsibleSection title="Document Analyzer" defaultOpen={false}>
              <Suspense fallback={<LoadingFallback />}>
                <LazyDocumentAnalyzer />
              </Suspense>
            </CollapsibleSection>
            
            <CollapsibleSection title="Prescription Writer" defaultOpen={false}>
              <Suspense fallback={<LoadingFallback />}>
                <LazyPrescriptionWriter />
              </Suspense>
            </CollapsibleSection>
          </div>
          
          <CollapsibleSection title="AI Assistant" defaultOpen={false}>
            <Suspense fallback={<LoadingFallback />}>
              <LazyAiAssistant />
            </Suspense>
          </CollapsibleSection>
          
          <CollapsibleSection title="Patient Chat" defaultOpen={false}>
            <Suspense fallback={<LoadingFallback />}>
              <LazyChatInterface />
            </Suspense>
          </CollapsibleSection>
          
          {featureFlags.enableDoctorVideoUploader && (
            <CollapsibleSection title="Knowledge Sharing Videos" defaultOpen={false}>
              <Suspense fallback={<LoadingFallback />}>
                <LazyDoctorVideoUploader />
              </Suspense>
            </CollapsibleSection>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
