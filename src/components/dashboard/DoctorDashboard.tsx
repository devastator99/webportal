
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useResponsive } from "@/contexts/ResponsiveContext";
import { useResponsiveValue } from "@/hooks/use-responsive";
import { AllPatientsList } from "@/components/dashboard/doctor/AllPatientsList";
import { DoctorAppointmentCalendar } from "@/components/dashboard/doctor/DoctorAppointmentCalendar";
import { ResponsiveCard } from "@/components/ui/responsive-card";

export const DoctorDashboard = () => {
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
        <p className="text-sm text-gray-500 text-left">Welcome back to your dashboard</p>
      </ResponsiveCard>

      <div className={sectionSpacing}>
        {/* Main content with patient list and calendar */}
        <div className="grid grid-cols-1 gap-4">
          {/* Patient List */}
          <AllPatientsList />
          
          {/* Calendar Section */}
          <ResponsiveCard withShadow>
            <DoctorAppointmentCalendar doctorId={user?.id || ""} />
          </ResponsiveCard>
        </div>
      </div>
    </div>
  );
};
