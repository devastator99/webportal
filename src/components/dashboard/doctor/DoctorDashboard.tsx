
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useResponsive } from "@/contexts/ResponsiveContext";
import { useResponsiveValue } from "@/hooks/use-responsive";
import { AllPatientsList } from "@/components/dashboard/doctor/AllPatientsList";
import { DoctorAppointmentCalendar } from "@/components/dashboard/doctor/DoctorAppointmentCalendar";
import { ResponsiveCard } from "@/components/ui/responsive-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar } from "lucide-react";

export const DoctorDashboard = () => {
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  
  const doctorFirstName = user?.user_metadata?.first_name || "";
  const doctorLastName = user?.user_metadata?.last_name || "";
  const doctorName = `${doctorFirstName} ${doctorLastName}`.trim();
  
  const sectionSpacing = useResponsiveValue({
    mobile: 'space-y-4', 
    tablet: 'space-y-6',
    desktop: 'space-y-8',
    default: 'space-y-6'
  });

  return (
    <div className="container mx-auto px-4 animate-fade-up">
      <Tabs defaultValue="patients" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="patients" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Patients</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Calendar</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className={sectionSpacing}>
          <AllPatientsList />
        </TabsContent>

        <TabsContent value="calendar" className={sectionSpacing}>
          <ResponsiveCard withShadow>
            <DoctorAppointmentCalendar doctorId={user?.id || ""} />
          </ResponsiveCard>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DoctorDashboard;
