import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
      </div>

      <div className="container py-6">
        <div className="flex gap-6">
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-24 backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-lg shadow-lg overflow-hidden">
              <nav className="flex flex-col p-2 space-y-1">
                {menuItems.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={cn(
                      "justify-start gap-3 px-3 py-2 w-full",
                      activeSection === item.id
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "hover:bg-accent hover:text-accent-foreground"
                    )}
                    onClick={() => setActiveSection(item.id)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Button>
                ))}
              </nav>
            </div>
          </div>

          <div className="flex-1">
            {activeSection === "chat" && (
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
            )}

            {activeSection === "analyze" && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Conversation Analysis</h2>
                  <p className="text-muted-foreground">
                    AI analysis of care team conversations will appear here.
                  </p>
                </CardContent>
              </Card>
            )}

            {activeSection === "prescriptions" && (
              <PrescriptionWriter patientId={patientId} />
            )}

            {activeSection === "timeline" && (
              <Card>
                <CardContent className="p-6">
                  Patient timeline will go here
                </CardContent>
              </Card>
            )}

            {activeSection === "habits" && (
              <Card>
                <CardContent className="p-6">
                  Habits tracking will go here
                </CardContent>
              </Card>
            )}

            {activeSection === "notes" && (
              <Card>
                <CardContent className="p-6">
                  Doctor's notes will go here
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
