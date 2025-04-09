
import { useAuth } from "@/contexts/AuthContext";
import { StatsCards } from "@/components/dashboard/doctor/StatsCards";
import { AiAssistant } from "@/components/dashboard/doctor/AiAssistant";
import { DoctorAppointmentCalendar } from "@/components/dashboard/doctor/DoctorAppointmentCalendar";
import { VideoUploader } from "@/components/videos/VideoUploader";
import { VideoList } from "@/components/videos/VideoList";
import { PrescriptionWriter } from "@/components/dashboard/doctor/PrescriptionWriter";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Users, Mic, MessageCircle } from "lucide-react";
import { ScheduleAppointment } from "@/components/appointments/ScheduleAppointment";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { VoiceScheduler } from "@/components/voice/VoiceScheduler";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TodaySchedule } from "@/components/dashboard/doctor/TodaySchedule";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export const AlternativeDoctorDashboard = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [showVoiceScheduler, setShowVoiceScheduler] = useState(false);
  const [showChatOverlay, setShowChatOverlay] = useState(false);
  
  // Extract doctor's name from user metadata
  const doctorFirstName = user?.user_metadata?.first_name || "";
  const doctorLastName = user?.user_metadata?.last_name || "";
  const doctorName = `${doctorFirstName} ${doctorLastName}`.trim();
  const greeting = doctorName ? `Hello, Dr. ${doctorFirstName} 👋` : "Hello, Doctor 👋";
  
  return (
    <div className="animate-fade-up">
      {/* Greeting and quick action buttons */}
      <div className="mobile-card mb-4">
        <h1 className="text-xl font-bold mb-2 text-left">{greeting}</h1>
        <p className="text-sm text-gray-500 text-left mb-4">Welcome back to your dashboard</p>
        
        <div className="grid grid-cols-3 gap-2">
          <Button 
            className="rounded-full bg-[#9b87f5] hover:bg-[#7E69AB] text-white"
            onClick={() => navigate("/patients")}
          >
            <Users className="mr-2 h-4 w-4" />
            <span>Patients</span>
          </Button>
          
          <Dialog open={showVoiceScheduler} onOpenChange={setShowVoiceScheduler}>
            <DialogTrigger asChild>
              <Button
                className="rounded-full bg-[#E5DEFF] text-[#9b87f5] hover:bg-[#d1c9ff]"
              >
                <Mic className="mr-2 h-4 w-4" />
                <span>Voice</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[80vh] p-0">
              <div className="h-[70vh]">
                <VoiceScheduler onClose={() => setShowVoiceScheduler(false)} />
              </div>
            </DialogContent>
          </Dialog>
          
          <Button
            className="rounded-full bg-[#E5DEFF] text-[#9b87f5] hover:bg-[#d1c9ff]"
            onClick={() => window.open("/chat", "_blank")}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            <span>Chat</span>
          </Button>
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
            <TodaySchedule />
          </CollapsibleSection>
          
          <CollapsibleSection 
            title="Appointment Calendar" 
            className="mobile-card"
          >
            <DoctorAppointmentCalendar doctorId={user?.id || ""} />
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
    </div>
  );
};
