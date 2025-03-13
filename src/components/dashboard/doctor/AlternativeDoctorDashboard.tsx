
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
import { useState } from "react";
import { VoiceScheduler } from "@/components/voice/VoiceScheduler";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CollapsibleSection } from "@/components/ui/collapsible-section";

export const AlternativeDoctorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showVoiceScheduler, setShowVoiceScheduler] = useState(false);
  
  // Create the action buttons to pass to the header
  const actionButtons = (
    <>
      <Button 
        className="w-full justify-start bg-[#9b87f5] hover:bg-[#7E69AB] text-white flex items-center gap-2 shadow-md text-sm"
        size="sm"
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
          className="w-full justify-start bg-[#9b87f5] hover:bg-[#7E69AB] text-white flex items-center gap-2 shadow-md text-sm"
          size="sm"
        >
          <Calendar className="h-4 w-4" />
          <span>Schedule</span>
        </Button>
      </ScheduleAppointment>

      <Button 
        className="w-full justify-start bg-[#9b87f5] hover:bg-[#7E69AB] text-white flex items-center gap-2 shadow-md text-sm"
        size="sm"
        onClick={() => setShowVoiceScheduler(true)}
      >
        <Mic className="h-4 w-4" />
        <span>Voice Schedule</span>
      </Button>
      
      <Button 
        className="w-full justify-start bg-[#9b87f5] hover:bg-[#7E69AB] text-white flex items-center gap-2 shadow-md text-sm"
        size="sm"
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
      
      <StatsCards />

      <ScrollArea className="h-[calc(100vh-220px)]">
        <div className="space-y-6 pr-4">
          <CollapsibleSection title="Appointments Calendar" defaultOpen={true}>
            <DoctorAppointmentCalendar doctorId={user?.id || ""} />
          </CollapsibleSection>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CollapsibleSection title="Document Analyzer">
              <DocumentAnalyzer />
            </CollapsibleSection>
            
            <CollapsibleSection title="Prescription Writer">
              <PrescriptionWriter />
            </CollapsibleSection>
          </div>
          
          <CollapsibleSection title="AI Assistant">
            <AiAssistant />
          </CollapsibleSection>
          
          <CollapsibleSection title="Patient Chat">
            <ChatInterface />
          </CollapsibleSection>
          
          <CollapsibleSection title="Knowledge Sharing Videos">
            <div className="space-y-4">
              <VideoUploader />
              <VideoList />
            </div>
          </CollapsibleSection>
        </div>
      </ScrollArea>
    </div>
  );
};
