
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { StatsCards } from "@/components/dashboard/doctor/StatsCards";
import { AiAssistant } from "@/components/dashboard/doctor/AiAssistant";
import { DocumentAnalyzer } from "@/components/dashboard/doctor/DocumentSummary";
import { PrescriptionWriter } from "@/components/dashboard/doctor/PrescriptionWriter";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Users, LayoutGrid } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { featureFlags } from "@/config/features";
import { ChatModule } from "@/modules/chat/ChatModule";
import { DoctorVideoUploader } from "@/components/dashboard/doctor/DoctorVideoUploader";

export const DoctorDashboard = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
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
      
      <Button 
        className="w-full justify-start bg-[#9b87f5] hover:bg-[#7E69AB] text-white flex items-center gap-2 shadow-md text-sm"
        size="sm"
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
      
      <StatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DocumentAnalyzer />
            <PrescriptionWriter />
          </div>
          <AiAssistant />
          
          {/* Only show chat if enabled */}
          {featureFlags.enableChat && featureFlags.doctorDashboardChat && (
            <ChatModule showChatbotWidget={false} />
          )}
          
          {/* Only show video uploader if feature flag is enabled */}
          {featureFlags.enableDoctorVideoUploader && (
            <DoctorVideoUploader />
          )}
        </div>
      </div>
    </div>
  );
};
