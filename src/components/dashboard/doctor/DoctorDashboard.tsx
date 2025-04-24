
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useResponsive } from "@/contexts/ResponsiveContext";
import { useResponsiveValue } from "@/hooks/use-responsive";
import { AllPatientsList } from "@/components/dashboard/doctor/AllPatientsList";
import { DoctorAppointmentCalendar } from "@/components/dashboard/doctor/DoctorAppointmentCalendar";
import { ResponsiveCard } from "@/components/ui/responsive-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Users, Calendar } from "lucide-react";

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
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="patients" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Patients</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Calendar</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className={sectionSpacing}>
          <ResponsiveCard withShadow className="bg-gradient-to-r from-primary/5 to-primary/10 border-none shadow-sm">
            <div className="p-6">
              <h1 className="text-2xl font-bold text-primary/90 mb-2">{greeting}</h1>
              <p className="text-muted-foreground">
                Welcome back to your dashboard
              </p>
            </div>
          </ResponsiveCard>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveCard withShadow>
              <DoctorAppointmentCalendar doctorId={user?.id || ""} />
            </ResponsiveCard>
            <ResponsiveCard withShadow>
              <AllPatientsList compact />
            </ResponsiveCard>
          </div>
        </TabsContent>

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
