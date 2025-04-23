
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Brain, MessageSquare, Activity, FileSpreadsheet, Stethoscope, FileUp } from "lucide-react";
import { PrescriptionWriter } from "@/components/dashboard/doctor/PrescriptionWriter";
import { PrescriptionHistory } from "./prescription/PrescriptionHistory";
import { useResponsive } from "@/contexts/ResponsiveContext";
import { useBreakpoint } from "@/hooks/use-responsive";
import { ResponsiveCard } from "@/components/ui/responsive-card";
import { CareTeamRoomChat } from "@/components/chat/CareTeamRoomChat";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface PatientDetailsProps {
  patientId: string;
}

export const PatientDetails = ({ patientId }: PatientDetailsProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("chat");
  const { isMobile, isTablet } = useResponsive();
  const { isSmallScreen, isMediumScreen } = useBreakpoint();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Responsive spacing and sizes
  const containerPadding = isMobile ? "p-3" : isTablet ? "p-4" : "p-6";
  const buttonSize = isMobile ? "sm" : "default";
  const cardPadding = isMobile ? "p-3" : isTablet ? "p-4" : "p-5";
  const headerSpacing = isMobile ? "mb-3" : isTablet ? "mb-4" : "mb-6";

  // Fetch patient details
  const { data: patientData, isLoading: patientLoading } = useQuery({
    queryKey: ["patient_details", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', patientId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!patientId
  });

  // Fetch the patient's care team room ID
  const { data: roomData, isLoading: roomLoading } = useQuery({
    queryKey: ["patient_care_team_room", patientId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-patient-care-team-room', {
        body: { patientId }
      });
      
      if (error) throw error;
      return data;
    },
    enabled: !!patientId
  });

  // Set the selected room ID when data is available
  useEffect(() => {
    if (roomData && roomData.room_id) {
      setSelectedRoomId(roomData.room_id);
    }
  }, [roomData]);

  return (
    <div className={`w-full mx-auto ${containerPadding} space-y-4 max-w-full animate-fade-up`}>
      <div className={`flex flex-col ${headerSpacing}`}>
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size={buttonSize}
            onClick={() => navigate("/doctor-dashboard")}
            className="gap-2"
          >
            <ArrowLeft className={`${isMobile ? "h-3 w-3" : "h-4 w-4"}`} />
            Back to Dashboard
          </Button>
        </div>

        {patientLoading ? (
          <Skeleton className="h-8 w-1/3" />
        ) : (
          <h1 className="text-2xl font-bold text-gray-900">
            {patientData?.first_name} {patientData?.last_name}
          </h1>
        )}
      </div>

      <ResponsiveCard className="overflow-hidden border-0 shadow-sm">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="w-full border-b bg-white sticky top-0 z-10">
            <TabsList className="w-full justify-start rounded-none border-b bg-white px-6">
              <TabsTrigger value="chat" className="data-[state=active]:bg-[#E5DEFF] data-[state=active]:text-[#9b87f5]">
                <MessageSquare className={`${isMobile ? "h-3 w-3 mr-1" : "h-4 w-4 mr-2"}`} />
                Care Team Chat
              </TabsTrigger>
              <TabsTrigger value="analyze" className="data-[state=active]:bg-[#E5DEFF] data-[state=active]:text-[#9b87f5]">
                <Brain className={`${isMobile ? "h-3 w-3 mr-1" : "h-4 w-4 mr-2"}`} />
                Analyze Conversation
              </TabsTrigger>
              <TabsTrigger value="prescriptions" className="data-[state=active]:bg-[#E5DEFF] data-[state=active]:text-[#9b87f5]">
                <FileUp className={`${isMobile ? "h-3 w-3 mr-1" : "h-4 w-4 mr-2"}`} />
                Prescriptions
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
              {selectedRoomId ? (
                <CareTeamRoomChat 
                  selectedRoomId={selectedRoomId} 
                  isMobileView={isMobile || isTablet}
                />
              ) : (
                <div className="flex justify-center items-center h-full">
                  <p className="text-muted-foreground">
                    {roomLoading ? "Loading chat..." : "No care team chat found for this patient."}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analyze" className="p-6">
            <Card className={cardPadding}>
              <h2 className="text-lg font-semibold mb-4">Conversation Analysis</h2>
              <p className="text-muted-foreground">AI analysis of care team conversations will appear here.</p>
            </Card>
          </TabsContent>

          <TabsContent value="prescriptions" className="p-6">
            <PrescriptionHistory patientId={patientId} />
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
