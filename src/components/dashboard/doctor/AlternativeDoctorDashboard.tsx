
import { useAuth } from "@/contexts/AuthContext";
import { DoctorAppointmentCalendar } from "@/components/dashboard/doctor/DoctorAppointmentCalendar";
import { useResponsive } from "@/contexts/ResponsiveContext";
import { Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResponsiveCard } from "@/components/ui/responsive-card";
import { useResponsiveValue } from "@/hooks/use-responsive";
import { AllPatientsList } from "@/components/dashboard/doctor/AllPatientsList";

export const AlternativeDoctorDashboard = () => {
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  
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
  
  return (
    <div className="animate-fade-up">
      {/* Greeting Section */}
      <ResponsiveCard withShadow className="mb-4" compact={isMobile}>
        <h1 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold mb-2 text-left`}>{greeting}</h1>
        <p className="text-sm text-gray-500 text-left mb-4">Welcome back to your dashboard</p>
      </ResponsiveCard>
      
      {/* Main content with collapsible sections */}
      <ScrollArea className="mb-16">
        <div className={sectionSpacing}>
          <CollapsibleSection 
            title="Patients" 
            defaultOpen={true}
            className="mobile-card"
          >
            <AllPatientsList />
          </CollapsibleSection>
          
          <CollapsibleSection 
            title="Appointment Calendar" 
            className="mobile-card"
          >
            <DoctorAppointmentCalendar doctorId={user?.id || ""} />
          </CollapsibleSection>
        </div>
      </ScrollArea>
    </div>
  );
};
