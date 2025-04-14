
import { useAuth } from "@/contexts/AuthContext";
import { StatsCards } from "@/components/dashboard/doctor/StatsCards";
import { AiAssistant } from "@/components/dashboard/doctor/AiAssistant";
import { DoctorAppointmentCalendar } from "@/components/dashboard/doctor/DoctorAppointmentCalendar";
import { VideoUploader } from "@/components/videos/VideoUploader";
import { VideoList } from "@/components/videos/VideoList";
import { DocumentAnalyzer } from "@/components/dashboard/doctor/DocumentSummary";
import { PrescriptionWriter } from "@/components/dashboard/doctor/PrescriptionWriter";
import { Button } from "@/components/ui/button";
import { Users, MessageCircle, Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WhatsAppStyleChatInterface } from "@/components/chat/WhatsAppStyleChatInterface";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { VoiceScheduler } from "@/components/voice/VoiceScheduler";
import { TodaySchedule } from "@/components/dashboard/doctor/TodaySchedule";
import { useBreakpoint, useResponsiveButtonSize, useResponsiveValue } from "@/hooks/use-responsive";
import { ResponsiveCard } from "@/components/ui/responsive-card";
import { ResponsiveText } from "@/components/ui/responsive-typography";

export const DoctorDashboard = () => {
  const { user } = useAuth();
  const { isSmallScreen, isMediumScreen } = useBreakpoint();
  const navigate = useNavigate();
  const [showChatOverlay, setShowChatOverlay] = useState(false);
  const [showVoiceScheduler, setShowVoiceScheduler] = useState(false);
  
  // Extract doctor's name from user metadata
  const doctorFirstName = user?.user_metadata?.first_name || "";
  const doctorLastName = user?.user_metadata?.last_name || "";
  const doctorName = `${doctorFirstName} ${doctorLastName}`.trim();
  const greeting = doctorName ? `Hello, Dr. ${doctorFirstName} 👋` : "Hello, Doctor 👋";
  
  // Responsive spacing between sections
  const sectionSpacing = useResponsiveValue({
    mobile: 'space-y-3', 
    tablet: 'space-y-4',
    desktop: 'space-y-5',
    default: 'space-y-4'
  });
  
  // Responsive button sizes
  const buttonSize = useResponsiveButtonSize({
    mobile: 'sm',
    tablet: 'sm',
    default: 'default'
  });
  
  return (
    <div className="animate-fade-up">
      {/* Greeting and quick action buttons */}
      <ResponsiveCard withShadow className="mb-4" compact={isSmallScreen}>
        <ResponsiveText 
          as="h1" 
          className="mb-2 text-left" 
          mobileSize="lg" 
          tabletSize="xl" 
          weight="bold"
        >
          {greeting}
        </ResponsiveText>
        
        <p className="text-sm text-gray-500 text-left mb-4">Welcome back to your dashboard</p>
        
        <div className="grid grid-cols-3 gap-2">
          <Button 
            size={buttonSize}
            className="rounded-full bg-[#9b87f5] hover:bg-[#7E69AB] text-white"
            onClick={() => navigate("/patients")}
          >
            <Users className={`${isSmallScreen ? 'mr-1 h-3.5 w-3.5' : 'mr-2 h-4 w-4'}`} />
            <span className={`${isSmallScreen ? 'text-xs' : ''}`}>Patients</span>
          </Button>
          
          <Dialog open={showVoiceScheduler} onOpenChange={setShowVoiceScheduler}>
            <DialogTrigger asChild>
              <Button
                size={buttonSize}
                className="rounded-full bg-[#E5DEFF] text-[#9b87f5] hover:bg-[#d1c9ff]"
              >
                <Mic className={`${isSmallScreen ? 'mr-1 h-3.5 w-3.5' : 'mr-2 h-4 w-4'}`} />
                <span className={`${isSmallScreen ? 'text-xs' : ''}`}>Voice</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[80vh] p-0">
              <div className="h-[70vh]">
                <VoiceScheduler onClose={() => setShowVoiceScheduler(false)} />
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showChatOverlay} onOpenChange={setShowChatOverlay}>
            <DialogTrigger asChild>
              <Button
                size={buttonSize}
                className="rounded-full bg-[#E5DEFF] text-[#9b87f5] hover:bg-[#d1c9ff]"
              >
                <MessageCircle className={`${isSmallScreen ? 'mr-1 h-3.5 w-3.5' : 'mr-2 h-4 w-4'}`} />
                <span className={`${isSmallScreen ? 'text-xs' : ''}`}>Chat</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[80vh] p-0">
              <div className="h-[70vh]">
                <WhatsAppStyleChatInterface />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </ResponsiveCard>
      
      {/* Stats cards in a more compact design */}
      <StatsCards />
      
      {/* Schedule section with increased priority and size */}
      <div className="mb-4 sm:mb-6">
        <ResponsiveCard className="shadow-sm" compact={isSmallScreen}>
          <ResponsiveText 
            as="h2" 
            className="mb-3 text-left" 
            mobileSize="base" 
            tabletSize="lg" 
            weight="semibold"
          >
            Today's Schedule
          </ResponsiveText>
          <TodaySchedule />
        </ResponsiveCard>
      </div>
      
      {/* Main content with collapsible sections for mobile */}
      <ScrollArea className={`mb-16 ${sectionSpacing}`}>
        <CollapsibleSection 
          title="Appointment Calendar" 
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
      </ScrollArea>
    </div>
  );
};
