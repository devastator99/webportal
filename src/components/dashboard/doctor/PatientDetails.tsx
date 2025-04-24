
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Brain, MessageSquare, Activity, FileSpreadsheet, Stethoscope, FileUp } from "lucide-react";
import { PrescriptionWriter } from "@/components/dashboard/doctor/PrescriptionWriter";
import { useResponsive } from "@/contexts/ResponsiveContext";
import { useBreakpoint } from "@/hooks/use-responsive";
import { ResponsiveCard } from "@/components/ui/responsive-card";
import { CareTeamRoomChat } from "@/components/chat/CareTeamRoomChat";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

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
      
      if (error) {
        console.error("Error fetching patient details:", error);
        throw error;
      }
      return data;
    },
    enabled: !!patientId
  });

  // Fetch the patient's care team room ID
  const { data: roomData, isLoading: roomLoading, error: roomError } = useQuery({
    queryKey: ["patient_care_team_room", patientId],
    queryFn: async () => {
      try {
        console.log("Fetching care team room for patient:", patientId);
        const { data, error } = await supabase.functions.invoke('get-patient-care-team-room', {
          body: { patient_id: patientId }
        });
        
        if (error) {
          console.error("Error invoking get-patient-care-team-room:", error);
          throw error;
        }

        console.log("Care team room data:", data);
        return data;
      } catch (error) {
        console.error("Error in get-patient-care-team-room query:", error);
        toast({
          title: "Error",
          description: "Could not fetch patient care team room.",
          variant: "destructive"
        });
        throw error;
      }
    },
    enabled: !!patientId,
    retry: 1
  });

  // Set the selected room ID when data is available
  useEffect(() => {
    if (roomData && roomData.room_id) {
      console.log("Setting room ID:", roomData.room_id);
      setSelectedRoomId(roomData.room_id);
    } else if (roomError) {
      console.error("Room data error:", roomError);
    }
  }, [roomData, roomError]);

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
            Patient: {patientData?.first_name} {patientData?.last_name}
          </h1>
        )}
      </div>

      <ResponsiveCard className="overflow-hidden border-0 shadow-sm">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="w-full border-b bg-white sticky top-0 z-10">
            <TabsList className="w-full justify-start rounded-none border-b bg-white px-6 overflow-x-auto">
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
              {roomLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Skeleton className="h-[400px] w-full" />
                </div>
              ) : selectedRoomId ? (
                <CareTeamRoomChat 
                  selectedRoomId={selectedRoomId} 
                  isMobileView={isMobile || isTablet}
                />
              ) : (
                <div className="flex justify-center items-center h-full flex-col p-4">
                  <p className="text-muted-foreground text-center mb-4">
                    {roomError ? "Error loading care team chat" : "No care team chat found for this patient."}
                  </p>
                  {roomError && (
                    <Button 
                      onClick={() => navigate("/doctor-dashboard")} 
                      variant="outline"
                    >
                      Return to Dashboard
                    </Button>
                  )}
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
            <PrescriptionWriter patientId={patientId} />
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
