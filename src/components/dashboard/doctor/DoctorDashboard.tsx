
import { useAuth } from "@/contexts/AuthContext";
import { supabase, getDoctorPatients } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Calendar, Users, Mic } from "lucide-react";
import { ScheduleAppointment } from "@/components/appointments/ScheduleAppointment";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { VoiceScheduler } from "@/components/voice/VoiceScheduler";
import { useToast } from "@/hooks/use-toast";

export const DoctorDashboard = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [showVoiceScheduler, setShowVoiceScheduler] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return (
    <div className="container mx-auto pt-20 pb-6 px-6 space-y-6">
      <DashboardHeader />
      
      <StatsCards />

      {/* Action buttons */}
      <div className="flex flex-wrap justify-end gap-3">
        <Link to="/patients">
          <Button 
            className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white flex items-center gap-2 shadow-md"
          >
            <Users className="h-4 w-4" />
            <span>View All Patients</span>
          </Button>
        </Link>
        
        <ScheduleAppointment callerRole="doctor">
          <Button 
            className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white flex items-center gap-2 shadow-md"
          >
            <Calendar className="h-4 w-4" />
            <span>Schedule Patient Appointment</span>
          </Button>
        </ScheduleAppointment>
      </div>

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
