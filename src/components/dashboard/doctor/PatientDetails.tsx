import React, { useState, useEffect } from "react";
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
import { cn } from "@/lib/utils";
import { PrescriptionTabsViewer } from '@/components/prescriptions/PrescriptionTabsViewer';

export const PatientDetails = ({ patientId }: { patientId: string }) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("chat");
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

  const menuItems = [
    { id: "chat", label: "Care Team Chat", icon: <MessageSquare className="h-5 w-5" /> },
    { id: "analyze", label: "Analyze", icon: <Brain className="h-5 w-5" /> },
    { id: "prescriptions", label: "Prescriptions", icon: <FileUp className="h-5 w-5" /> },
    { id: "timeline", label: "Timeline", icon: <FileSpreadsheet className="h-5 w-5" /> },
    { id: "habits", label: "Habits", icon: <Activity className="h-5 w-5" /> },
    { id: "notes", label: "Notes", icon: <FileText className="h-5 w-5" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container py-3">
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
                  <h1 className="text-xl font-semibold text-[#7E69AB]">
                    {patientData?.first_name} {patientData?.last_name}
                  </h1>
                  <p className="text-sm text-[#9b87f5]/70">
                    Patient Details
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Navigation List */}
          <div className="lg:w-56 flex-shrink-0">
            <div className="sticky top-24 space-y-1 rounded-lg overflow-hidden border bg-card">
              {menuItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 rounded-none border-l-2 px-4 py-2 font-medium transition-all",
                    activeSection === item.id
                      ? "border-l-[#9b87f5] bg-[#E5DEFF] text-[#7E69AB]"
                      : "border-l-transparent hover:border-l-[#9b87f5] hover:bg-[#E5DEFF] hover:text-[#7E69AB]"
                  )}
                  onClick={() => setActiveSection(item.id)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {activeSection === "chat" && (
              <div className="h-[calc(100vh-220px)] rounded-lg border bg-card">
                {roomLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <Skeleton className="h-[400px] w-full rounded-lg" />
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
            )}

            {activeSection === "prescriptions" && (
              <PrescriptionTabsViewer patientId={patientId} />
            )}

            {activeSection === "analyze" && (
              <div className="p-6 rounded-lg border bg-card">
                <h2 className="text-lg font-semibold mb-4 text-[#7E69AB]">Conversation Analysis</h2>
                <p className="text-muted-foreground">
                  AI analysis of care team conversations will appear here.
                </p>
              </div>
            )}

            {activeSection === "timeline" && (
              <div className="p-6 rounded-lg border bg-card space-y-4">
                <div className="border-l-2 border-[#9b87f5] pl-4 space-y-4">
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-[#9b87f5]" />
                    <h3 className="text-[#7E69AB] font-medium">Patient timeline will go here</h3>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "habits" && (
              <div className="p-6 rounded-lg border bg-card">
                <div className="space-y-4">
                  <h3 className="text-[#7E69AB] font-medium">Habits tracking will go here</h3>
                </div>
              </div>
            )}

            {activeSection === "notes" && (
              <div className="p-6 rounded-lg border bg-card">
                <div className="space-y-4">
                  <h3 className="text-[#7E69AB] font-medium">Doctor's notes will go here</h3>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
