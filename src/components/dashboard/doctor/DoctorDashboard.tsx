
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { StatsCards } from "@/components/dashboard/doctor/StatsCards";
// import { TodaySchedule } from "@/components/dashboard/doctor/TodaySchedule";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { AiAssistant } from "@/components/dashboard/doctor/AiAssistant";
import { DoctorAppointmentCalendar } from "@/components/dashboard/doctor/DoctorAppointmentCalendar";
import { VideoUploader } from "@/components/videos/VideoUploader";
import { VideoList } from "@/components/videos/VideoList";
import { DocumentAnalyzer } from "@/components/dashboard/doctor/DocumentSummary";
import { PrescriptionWriter } from "@/components/dashboard/doctor/PrescriptionWriter";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Mic, LayoutGrid } from "lucide-react";
import { ScheduleAppointment } from "@/components/appointments/ScheduleAppointment";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { VoiceScheduler } from "@/components/voice/VoiceScheduler";

export const DoctorDashboard = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
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
          console.log("Navigating to patients view");
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
        onClick={() => navigate("/dashboard-alt")}
      >
        <LayoutGrid className="h-4 w-4" />
        <span>Collapsible View</span>
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
      
      <StatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Commented out Today's Schedule as requested */}
        <div className="lg:col-span-3 space-y-6">
          <DoctorAppointmentCalendar doctorId={user?.id || ""} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DocumentAnalyzer />
            <PrescriptionWriter />
          </div>
          <AiAssistant />
          <ChatInterface />
          <div>
            <h2 className="text-2xl font-semibold mb-4">Your Knowledge Sharing Videos</h2>
            <VideoUploader />
            <VideoList />
          </div>
        </div>
      </div>
    </div>
  );
};
