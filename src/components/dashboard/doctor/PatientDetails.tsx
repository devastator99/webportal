import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Brain, MessageSquare, Activity, FileSpreadsheet, FileUp } from "lucide-react";
import { PrescriptionWriter } from "@/components/dashboard/doctor/PrescriptionWriter";
import { useResponsive } from "@/contexts/ResponsiveContext";
import { useBreakpoint } from "@/hooks/use-responsive";
import { CareTeamRoomChat } from "@/components/chat/CareTeamRoomChat";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { PatientAvatar } from "./PatientAvatar";

export const PatientDetails = ({ patientId }: { patientId: string }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("chat");
  const { isMobile, isTablet } = useResponsive();
  const { isSmallScreen, isMediumScreen } = useBreakpoint();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

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

  useEffect(() => {
    if (roomData && roomData.room_id) {
      setSelectedRoomId(roomData.room_id);
    }
  }, [roomData]);

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            {patientLoading ? (
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <PatientAvatar
                  firstName={patientData?.first_name || ''}
                  lastName={patientData?.last_name || ''}
                  size="lg"
                />
                <div>
                  <h1 className="text-xl font-semibold">
                    {patientData?.first_name} {patientData?.last_name}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Patient Details
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="container">
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="w-full"
          >
            <TabsList className="inline-flex h-11 items-center justify-start w-full bg-transparent p-0 mb-0">
              <TabsTrigger
                value="chat"
                className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-primary rounded-none"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Care Team Chat
              </TabsTrigger>
              <TabsTrigger
                value="analyze"
                className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-primary rounded-none"
              >
                <Brain className="mr-2 h-4 w-4" />
                Analyze
              </TabsTrigger>
              <TabsTrigger
                value="prescriptions"
                className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-primary rounded-none"
              >
                <FileUp className="mr-2 h-4 w-4" />
                Prescriptions
              </TabsTrigger>
              <TabsTrigger
                value="timeline"
                className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-primary rounded-none"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Timeline
              </TabsTrigger>
              <TabsTrigger
                value="habits"
                className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-primary rounded-none"
              >
                <Activity className="mr-2 h-4 w-4" />
                Habits
              </TabsTrigger>
              <TabsTrigger
                value="notes"
                className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-primary rounded-none"
              >
                <FileText className="mr-2 h-4 w-4" />
                Notes
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="container py-6">
        <TabsContent value="chat" className="m-0 outline-none">
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
                    onClick={() => navigate("/dashboard")} 
                    variant="outline"
                  >
                    Return to Dashboard
                  </Button>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analyze" className="m-0 outline-none">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Conversation Analysis</h2>
              <p className="text-muted-foreground">
                AI analysis of care team conversations will appear here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prescriptions" className="m-0 outline-none">
          <PrescriptionWriter patientId={patientId} />
        </TabsContent>

        <TabsContent value="timeline" className="m-0 outline-none">
          <Card>
            <CardContent className="p-6">
              Patient timeline will go here
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="habits" className="m-0 outline-none">
          <Card>
            <CardContent className="p-6">
              Habits tracking will go here
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="m-0 outline-none">
          <Card>
            <CardContent className="p-6">
              Doctor's notes will go here
            </CardContent>
          </Card>
        </TabsContent>
      </div>
    </div>
  );
};
