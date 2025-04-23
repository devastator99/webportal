
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
    <div className={`w-full mx-auto ${containerPadding} space-y-4 max-w-full`}>
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
        
        <div className={`flex ${gapSize} flex-wrap`}>
          <Button 
            variant="secondary"
            size={buttonSize}
            onClick={() => {}}
            className="gap-2"
          >
            <Brain className={`${isMobile ? "h-3 w-3" : "h-4 w-4"}`} />
            Analyze Conversation
          </Button>
          <Button 
            variant="secondary"
            size={buttonSize}
            onClick={() => setShowPrescription(true)}
            className="gap-2"
          >
            <FileText className={`${isMobile ? "h-3 w-3" : "h-4 w-4"}`} />
            Write Prescription
          </Button>
        </div>
      </div>

      {showPrescription ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold`}>Prescriptions</h2>
            <Button variant="outline" size={buttonSize} onClick={() => setShowPrescription(false)}>
              Back to Chat
            </Button>
          </div>
          <ResponsiveCard className="w-full">
            <Tabs defaultValue="write" className="w-full">
              <TabsList className="w-full justify-start mb-4">
                <TabsTrigger value="write">Write Prescription</TabsTrigger>
                <TabsTrigger value="history">Prescription History</TabsTrigger>
              </TabsList>
              <TabsContent value="write" className="w-full">
                <PrescriptionWriter patientId={patientId} />
              </TabsContent>
              <TabsContent value="history" className="w-full">
                <PrescriptionHistory patientId={patientId} />
              </TabsContent>
            </Tabs>
          </ResponsiveCard>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="w-full overflow-x-auto pb-2">
            <TabsList className={`${isMobile ? "w-full" : ""} grid grid-cols-4 min-w-min`}>
              <TabsTrigger value="chat" className="whitespace-nowrap">
                <MessageSquare className={`${isMobile ? "h-3 w-3 mr-1" : "h-4 w-4 mr-2"}`} />
                Chat
              </TabsTrigger>
              <TabsTrigger value="habits" className="whitespace-nowrap">
                <Activity className={`${isMobile ? "h-3 w-3 mr-1" : "h-4 w-4 mr-2"}`} />
                Habits
              </TabsTrigger>
              <TabsTrigger value="timeline" className="whitespace-nowrap">
                <FileSpreadsheet className={`${isMobile ? "h-3 w-3 mr-1" : "h-4 w-4 mr-2"}`} />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="notes" className="whitespace-nowrap">
                <FileText className={`${isMobile ? "h-3 w-3 mr-1" : "h-4 w-4 mr-2"}`} />
                Notes
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="chat" className="mt-4 w-full">
            <Card className={cardPadding}>
              Chat content will go here
            </Card>
          </TabsContent>

          <TabsContent value="habits" className="mt-4 w-full">
            <Card className={cardPadding}>
              Habits tracking will go here
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="mt-4 w-full">
            <Card className={cardPadding}>
              Patient timeline will go here
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="mt-4 w-full">
            <Card className={cardPadding}>
              Doctor's notes will go here
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
