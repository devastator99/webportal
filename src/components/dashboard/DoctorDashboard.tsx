
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useResponsive } from "@/contexts/ResponsiveContext";
import { useResponsiveValue } from "@/hooks/use-responsive";
import { AllPatientsList } from "@/components/dashboard/doctor/AllPatientsList";
import { DoctorAppointmentCalendar } from "@/components/dashboard/doctor/DoctorAppointmentCalendar";
import { ResponsiveCard } from "@/components/ui/responsive-card";
import { PatientAvatar } from "@/components/dashboard/doctor/PatientAvatar";
import { Card } from "@/components/ui/card";

export const DoctorDashboard = () => {
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  
  const doctorFirstName = user?.user_metadata?.first_name || "";
  const doctorLastName = user?.user_metadata?.last_name || "";
  const doctorName = `${doctorFirstName} ${doctorLastName}`.trim();
  const greeting = doctorName ? `Hello, Dr. ${doctorFirstName}` : "Hello, Doctor";
  
  const sectionSpacing = useResponsiveValue({
    mobile: 'space-y-4', 
    tablet: 'space-y-6',
    desktop: 'space-y-8',
    default: 'space-y-6'
  });

  return (
    <div className="container mx-auto px-4 animate-fade-up">
      <div className={sectionSpacing}>
        {/* Header Section */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-none shadow-sm">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-primary/90 mb-2">{greeting}</h1>
            <p className="text-muted-foreground">
              Welcome back to your dashboard
            </p>
          </div>
        </Card>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient List Section - Takes 2 columns on desktop */}
          <div className="lg:col-span-2">
            <AllPatientsList />
          </div>

          {/* Calendar Section */}
          <div className="lg:col-span-1">
            <ResponsiveCard withShadow className="h-full">
              <DoctorAppointmentCalendar doctorId={user?.id || ""} />
            </ResponsiveCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
