
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { StatsCards } from "@/components/dashboard/doctor/StatsCards";
import { TodaySchedule } from "@/components/dashboard/doctor/TodaySchedule";
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
import { Calendar, Users } from "lucide-react";
import { ScheduleAppointment } from "@/components/appointments/ScheduleAppointment";
import { Link, useNavigate } from "react-router-dom";

export const DoctorDashboard = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  // Create the action buttons to pass to the header
  const actionButtons = (
    <>
      <Button 
        className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white flex items-center gap-2 shadow-md text-sm"
        size="sm"
        onClick={() => navigate("/patients")}
      >
        <Users className="h-4 w-4" />
        <span>Patients</span>
      </Button>
      
      <ScheduleAppointment callerRole="doctor">
        <Button 
          className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white flex items-center gap-2 shadow-md text-sm"
          size="sm"
        >
          <Calendar className="h-4 w-4" />
          <span>Schedule</span>
        </Button>
      </ScheduleAppointment>
    </>
  );
  
  return (
    <div className="container mx-auto pt-20 pb-6 px-6 space-y-6">
      <DashboardHeader actionButton={actionButtons} />
      
      <StatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-1">
          <TodaySchedule />
        </div>
        <div className="lg:col-span-2 space-y-6">
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
