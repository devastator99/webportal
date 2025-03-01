
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { StatsCards } from "./doctor/StatsCards";
import { TodaySchedule } from "./doctor/TodaySchedule";
import { ChatInterface } from "../chat/ChatInterface";
import { AiAssistant } from "./doctor/AiAssistant";
import { DoctorAppointmentCalendar } from "./doctor/DoctorAppointmentCalendar";
import { VideoUploader } from "@/components/videos/VideoUploader";
import { VideoList } from "@/components/videos/VideoList";
import { DocumentAnalyzer } from "./doctor/DocumentSummary";
import { PrescriptionWriter } from "./doctor/PrescriptionWriter";
import { DashboardHeader } from "./DashboardHeader";
import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";

export const DoctorDashboard = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  // Create an action button for doctors
  const scheduleButton = (
    <Button 
      className="flex-1 sm:flex-initial gap-2" 
      size={isMobile ? "lg" : "default"}
      variant="outline"
      onClick={() => console.log("Calendar view clicked")}
    >
      <CalendarPlus className="h-4 w-4" />
      View Calendar
    </Button>
  );
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <DashboardHeader actionButton={scheduleButton} />
      
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
