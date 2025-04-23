import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Brain, MessageSquare, Activity, FileSpreadsheet } from "lucide-react";
import { PrescriptionWriter } from "@/components/dashboard/doctor/PrescriptionWriter";
import { PrescriptionHistory } from "./prescription/PrescriptionHistory";
import { useResponsive } from "@/contexts/ResponsiveContext";
import { useBreakpoint } from "@/hooks/use-responsive";
import { ResponsiveCard } from "@/components/ui/responsive-card";
import { CareTeamRoomChat } from "@/components/chat/CareTeamRoomChat";

interface PatientDetailsProps {
  patientId: string;
}

export const PatientDetails = ({ patientId }: PatientDetailsProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("chat");
  const [showPrescription, setShowPrescription] = useState(false);
  const { isMobile, isTablet } = useResponsive();
  const { isSmallScreen, isMediumScreen } = useBreakpoint();

  // Responsive spacing and sizes
  const containerPadding = isMobile ? "p-3" : isTablet ? "p-4" : "p-6";
  const buttonSize = isMobile ? "sm" : "default";
  const cardPadding = isMobile ? "p-3" : isTablet ? "p-4" : "p-5";
  const gapSize = isMobile ? "gap-2" : "gap-3";
  const headerSpacing = isMobile ? "mb-3" : isTablet ? "mb-4" : "mb-6";

  return (
    <div className={`w-full mx-auto ${containerPadding} space-y-4 max-w-full animate-fade-up`}>
      <div className={`flex flex-wrap justify-between items-center ${headerSpacing}`}>
        <Button
          variant="outline"
          size={buttonSize}
          onClick={() => navigate("/doctor-dashboard")}
          className="gap-2 mb-2 sm:mb-0"
        >
          <ArrowLeft className={`${isMobile ? "h-3 w-3" : "h-4 w-4"}`} />
          Back to Dashboard
        </Button>
      </div>

      <ResponsiveCard className="overflow-hidden border-0 shadow-sm">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="w-full border-b bg-white sticky top-0 z-10">
            <TabsList className="w-full justify-start rounded-none border-b bg-white px-6">
              <TabsTrigger value="chat" className="data-[state=active]:bg-[#E5DEFF] data-[state=active]:text-[#9b87f5]">
                <MessageSquare className={`${isMobile ? "h-3 w-3 mr-1" : "h-4 w-4 mr-2"}`} />
                Care Team Chat
              </TabsTrigger>
              <TabsTrigger value="timeline" className="data-[state=active]:bg-[#E5DEFF] data-[state=active]:text-[#9b87f5]">
                <FileSpreadsheet className={`${isMobile ? "h-3 w-3 mr-1" : "h-4 w-4 mr-2"}`} />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="habits" className="data-[state=active]:bg-[#E5DEFF] data-[state=active]:text-[#9b87f5]">
                <Activity className={`${isMobile ? "h-3 w-3 mr-1" : "h-4 w-4 mr-2"}`} />
                Habits
              </TabsTrigger>
              <TabsTrigger value="notes" className="data-[state=active]:bg-[#E5DEFF] data-[state=active]:text-[#9b87f5]">
                <FileText className={`${isMobile ? "h-3 w-3 mr-1" : "h-4 w-4 mr-2"}`} />
                Notes
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="chat" className="m-0 p-0 border-none">
            <div className="h-[calc(100vh-220px)]">
              <CareTeamRoomChat patientId={patientId} showRoomsList={false} />
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="p-6">
            <Card className={cardPadding}>
              Patient timeline will go here
            </Card>
          </TabsContent>

          <TabsContent value="habits" className="p-6">
            <Card className={cardPadding}>
              Habits tracking will go here
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="p-6">
            <Card className={cardPadding}>
              Doctor's notes will go here
            </Card>
          </TabsContent>
        </Tabs>
      </ResponsiveCard>
    </div>
  );
};
