
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useResponsive } from "@/contexts/ResponsiveContext";
import { useResponsiveValue } from "@/hooks/use-responsive";
import { AllPatientsList } from "@/components/dashboard/doctor/AllPatientsList";
import { DoctorAppointmentCalendar } from "@/components/dashboard/doctor/DoctorAppointmentCalendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, UserRound } from "lucide-react";

export const DoctorDashboard = () => {
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const [activeTab, setActiveTab] = useState("patients");
  
  const doctorFirstName = user?.user_metadata?.first_name || "";
  const doctorLastName = user?.user_metadata?.last_name || "";
  const doctorName = `${doctorFirstName} ${doctorLastName}`.trim();
  
  const sectionSpacing = useResponsiveValue({
    mobile: 'space-y-4', 
    tablet: 'space-y-6',
    desktop: 'space-y-8',
    default: 'space-y-6'
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="container mx-auto px-4 animate-fade-up">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-[#E5DEFF] p-2 rounded-full">
            <UserRound className="h-6 w-6 text-[#9b87f5]" />
          </div>
          <h1 className="text-2xl font-semibold">
            Welcome, Dr. {doctorFirstName}
          </h1>
        </div>
      </div>

      <Tabs 
        defaultValue="patients" 
        value={activeTab} 
        onValueChange={handleTabChange}
        className="space-y-6"
      >
        <TabsList className="bg-muted/50 p-1 w-full md:w-auto flex">
          <TabsTrigger 
            value="patients" 
            className={`gap-2 flex-1 md:flex-initial transition-all duration-200 ${activeTab === "patients" ? "bg-white text-[#7E69AB]" : ""}`}
          >
            <Users className={`h-4 w-4 ${activeTab === "patients" ? "text-[#9b87f5]" : ""}`} />
            <span className="hidden sm:inline">Patients</span>
          </TabsTrigger>
          <TabsTrigger 
            value="calendar" 
            className={`gap-2 flex-1 md:flex-initial transition-all duration-200 ${activeTab === "calendar" ? "bg-white text-[#7E69AB]" : ""}`}
          >
            <Calendar className={`h-4 w-4 ${activeTab === "calendar" ? "text-[#9b87f5]" : ""}`} />
            <span className="hidden sm:inline">Calendar</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className={sectionSpacing}>
          <AllPatientsList />
        </TabsContent>

        <TabsContent value="calendar" className={sectionSpacing}>
          <DoctorAppointmentCalendar doctorId={user?.id || ""} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DoctorDashboard;
