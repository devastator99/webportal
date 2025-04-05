
import { useAuth } from "@/contexts/AuthContext";
import { StatsCards } from "@/components/dashboard/doctor/StatsCards";
import { AiAssistant } from "@/components/dashboard/doctor/AiAssistant";
import { DoctorAppointmentCalendar } from "@/components/dashboard/doctor/DoctorAppointmentCalendar";
import { VideoUploader } from "@/components/videos/VideoUploader";
import { VideoList } from "@/components/videos/VideoList";
import { DocumentAnalyzer } from "@/components/dashboard/doctor/DocumentSummary";
import { PrescriptionWriter } from "@/components/dashboard/doctor/PrescriptionWriter";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Mic } from "lucide-react";
import { ScheduleAppointment } from "@/components/appointments/ScheduleAppointment";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { VoiceScheduler } from "@/components/voice/VoiceScheduler";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { ScrollArea } from "@/components/ui/scroll-area";

export const AlternativeDoctorDashboard = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [showVoiceScheduler, setShowVoiceScheduler] = useState(false);
  
  return (
    <div className="animate-fade-up">
      {/* Greeting and quick action buttons */}
      <div className="mobile-card mb-4">
        <h1 className="text-xl font-bold mb-2 text-left">Hello, Doctor 👋</h1>
        <p className="text-sm text-gray-500 text-left mb-4">Welcome back to your dashboard</p>
        
        <div className="grid grid-cols-2 gap-2">
          <Button 
            className="rounded-full bg-[#9b87f5] hover:bg-[#7E69AB] text-white"
            onClick={() => navigate("/patients")}
          >
            <Users className="mr-2 h-4 w-4" />
            Patients
          </Button>
          
          <ScheduleAppointment callerRole="doctor">
            <Button 
              className="rounded-full bg-[#E5DEFF] text-[#9b87f5] hover:bg-[#d1c9ff]"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Schedule
            </Button>
          </ScheduleAppointment>
        </div>
      </div>
      
      {/* Stats cards in a more compact design */}
      <StatsCards />
      
      {/* Main content with collapsible sections for mobile */}
      <ScrollArea className="mb-16">
        <div className="space-y-4">
          <CollapsibleSection 
            title="Today's Appointments" 
            defaultOpen={true}
            className="mobile-card"
          >
            <DoctorAppointmentCalendar doctorId={user?.id || ""} />
          </CollapsibleSection>
          
          <CollapsibleSection 
            title="Document Analyzer" 
            className="mobile-card"
          >
            <DocumentAnalyzer />
          </CollapsibleSection>
          
          <CollapsibleSection 
            title="Write Prescription" 
            className="mobile-card"
          >
            <PrescriptionWriter />
          </CollapsibleSection>
          
          <CollapsibleSection 
            title="AI Assistant" 
            className="mobile-card"
          >
            <AiAssistant />
          </CollapsibleSection>
          
          <CollapsibleSection 
            title="Knowledge Sharing" 
            className="mobile-card"
          >
            <VideoUploader />
            <VideoList />
          </CollapsibleSection>
        </div>
      </ScrollArea>
      
      {showVoiceScheduler && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
          <div className="w-full max-w-md">
            <VoiceScheduler onClose={() => setShowVoiceScheduler(false)} />
          </div>
        </div>
      )}
      
      {/* Only show fixed FAB for voice scheduling on mobile */}
      {isMobile && (
        <Button
          className="fixed right-6 bottom-20 z-40 rounded-full w-14 h-14 p-0 bg-[#9b87f5] hover:bg-[#7E69AB] shadow-lg"
          onClick={() => setShowVoiceScheduler(true)}
        >
          <Mic className="h-6 w-6 text-white" />
        </Button>
      )}
    </div>
  );
};
