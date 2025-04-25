import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useResponsive } from "@/contexts/ResponsiveContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardResponsiveLayout } from "@/components/layout/DashboardResponsiveLayout";
import { ResponsiveContainer } from "@/components/layout/ResponsiveContainer";
import { ResponsiveGrid } from "@/components/layout/ResponsiveGrid";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PatientStats } from "./patient/PatientStats";
import { PatientCuratedHealthTips } from "./patient/PatientCuratedHealthTips";
import { WhatsAppStyleChatInterface } from "@/components/chat/WhatsAppStyleChatInterface";
import { useQuery } from "@tanstack/react-query";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { SidebarProvider } from "@/components/ui/sidebar";
import { PatientSidebar } from "./patient/PatientSidebar";
import { Calendar, UserRound } from "lucide-react";
import { MobileNavigation } from "@/components/mobile/MobileNavigation";
import { useIsMobile } from "@/hooks/use-mobile";

export const PatientDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isTablet } = useResponsive();
  const navigate = useNavigate();
  const { isMobile } = useIsMobile();

  const [careTeamRoomId, setCareTeamRoomId] = useState<string | null>(null);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);

  useEffect(() => {
    const fetchRoomId = async () => {
      if (!user?.id) return;
      
      setIsLoadingRoom(true);
      try {
        const { data, error } = await supabase.functions.invoke('get-patient-care-team-room', {
          body: { patient_id: user.id }
        });
        
        if (error) {
          console.error("Failed to get care team chat room:", error);
          toast({
            title: "Could not load care team chat",
            description: "Please try again later",
            variant: "destructive"
          });
        } else if (typeof data === "string" && data) {
          setCareTeamRoomId(data);
        } else if (typeof data === "object" && data !== null && data.id) {
          setCareTeamRoomId(data.id);
        } else if (typeof data === "object" && data !== null && "room_id" in data) {
          setCareTeamRoomId(data.room_id);
        } else {
          setCareTeamRoomId(null);
          toast({
            title: "No care team assigned",
            description: "Please contact your healthcare provider to set up a care team",
            variant: "destructive"
          });
        }
      } catch (err) {
        console.error("Error fetching care team chat room:", err);
        toast({
          title: "Error loading care team chat",
          description: "Please try again later",
          variant: "destructive"
        });
        setCareTeamRoomId(null);
      } finally {
        setIsLoadingRoom(false);
      }
    };
    fetchRoomId();
  }, [user?.id, toast]);

  const navigateToPrescriptions = () => {
    if (user?.id) {
      navigate(`/prescriptions/${user.id}`);
    }
  };

  const { data: patientData, isLoading } = useQuery({
    queryKey: ["patient_dashboard", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("No user ID");
      
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      if (!profile) {
        throw new Error("No profile found");
      }

      const { data: appointments, error: appointmentsError } = await supabase
        .rpc("get_patient_appointments", { p_patient_id: user.id });
        
      if (appointmentsError) {
        console.error("Error fetching appointments:", appointmentsError);
      }

      const { data: doctorAssignment } = await supabase
        .from("patient_assignments")
        .select("doctor_id")
        .eq("patient_id", user.id)
        .single();
        
      let latestPrescription = null;
      if (doctorAssignment?.doctor_id) {
        const { data: prescriptions } = await supabase
          .rpc("get_patient_prescriptions", {
            p_patient_id: user.id,
            p_doctor_id: doctorAssignment.doctor_id
          });
          
        if (prescriptions && prescriptions.length > 0) {
          latestPrescription = prescriptions[0];
        }
      }

      return {
        profile: {
          first_name: profile.first_name ?? '',
          last_name: profile.last_name ?? ''
        },
        nextAppointment: appointments && appointments.length > 0 ? appointments[0] : null,
        latestPrescription
      };
    },
    enabled: !!user?.id,
    staleTime: 30000,
    retry: 1
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <PatientSidebar />
        <div className="flex-1 pb-16">
          <ResponsiveContainer fluid withPadding className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-12 w-12 bg-[#E5DEFF]">
                <AvatarFallback className="text-[#9b87f5] font-medium">
                  {patientData?.profile?.first_name?.charAt(0)}{patientData?.profile?.last_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-semibold">Welcome, {patientData?.profile?.first_name}</h1>
                <p className="text-muted-foreground">Keep track of your health journey</p>
              </div>
            </div>

            <div className="w-full">
              <PatientStats />
            </div>

            <ResponsiveGrid 
              mobileColumns={1} 
              tabletColumns={2} 
              desktopColumns={3} 
              gap="lg"
            >
              {patientData?.nextAppointment && (
                <Card className="col-span-full md:col-span-2 lg:col-span-3 bg-[#E5DEFF]/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#E5DEFF] p-2 rounded-full">
                          <Calendar className="h-5 w-5 text-[#9b87f5]" />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">Next Appointment</h3>
                          <p className="text-xs text-muted-foreground">
                            {new Date(patientData.nextAppointment.scheduled_at).toLocaleDateString()} at {new Date(patientData.nextAppointment.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                          <p className="text-xs">
                            With Dr. {patientData.nextAppointment.doctor_first_name} {patientData.nextAppointment.doctor_last_name}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-[#9b87f5]">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="col-span-full lg:col-span-2">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserRound className="h-5 w-5" />
                      Care Team Chat
                    </CardTitle>
                    <CardDescription>
                      Connect with your healthcare team
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 h-[500px] lg:h-[600px]">
                    {isLoadingRoom ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#9b87f5]"></div>
                      </div>
                    ) : (
                      <WhatsAppStyleChatInterface patientRoomId={careTeamRoomId} />
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="col-span-full lg:col-span-1">
                <PatientCuratedHealthTips />
              </div>
            </ResponsiveGrid>
          </ResponsiveContainer>
        </div>
        {isMobile && <MobileNavigation />}
      </div>
    </SidebarProvider>
  );
};
