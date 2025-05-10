
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveContainer } from "@/components/layout/ResponsiveContainer";
import { ResponsiveGrid } from "@/components/layout/ResponsiveGrid";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HealthTrackingCards } from "./patient/HealthTrackingCards";
import { PatientCuratedHealthTips } from "./patient/PatientCuratedHealthTips";
import { RecentCareTeamMessages } from "@/components/chat/RecentCareTeamMessages";
import { useQuery } from "@tanstack/react-query";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { Calendar, UserRound, CheckCircle2, Clock } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePatientHabits } from "@/hooks/usePatientHabits";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserRegistrationStatus } from "@/types/registration";

export const PatientDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [careTeamRoomId, setCareTeamRoomId] = useState<string | null>(null);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [registrationStatus, setRegistrationStatus] = useState<UserRegistrationStatus | null>(null);
  const [isRegistrationComplete, setIsRegistrationComplete] = useState(true);
  
  // Get habit summary data using the usePatientHabits hook
  const { summaryData, percentages, habitSummary, isLoading: isLoadingSummary } = usePatientHabits();

  // Check registration status
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase.rpc('get_user_registration_status', {
          p_user_id: user.id
        });
        
        if (error) {
          console.error("Error getting registration status:", error);
          return;
        }
        
        const regStatus = data as unknown as UserRegistrationStatus;
        setRegistrationStatus(regStatus);
        setIsRegistrationComplete(regStatus?.registration_status === 'fully_registered');
        
        console.log("Registration status:", regStatus);
        
        // If registration is not complete, show toast notification
        if (regStatus?.registration_status !== 'fully_registered') {
          toast({
            title: "Registration in progress",
            description: "Your account setup is still in process. Some features may be limited.",
          });
        }
      } catch (err) {
        console.error("Error checking registration status:", err);
      }
    };
    
    checkRegistrationStatus();
  }, [user?.id, toast]);

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
  
  // If registration is not complete, show a simplified dashboard
  if (!isRegistrationComplete && registrationStatus) {
    return (
      <ResponsiveContainer fluid withPadding className="space-y-6">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="h-12 w-12 bg-[#E5DEFF]">
            <AvatarFallback className="text-[#9b87f5] font-medium">
              {patientData?.profile?.first_name?.charAt(0)}{patientData?.profile?.last_name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold">Welcome, {patientData?.profile?.first_name}</h1>
            <p className="text-muted-foreground">Your account setup is in progress</p>
          </div>
        </div>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#9b87f5]" />
              Registration Status
            </CardTitle>
            <CardDescription>Your account is being set up</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-[#E5DEFF]/20 border-[#9b87f5]/30">
              <AlertDescription>
                Your account is currently being set up. This includes assigning your care team and creating your communication channels. This process should be completed shortly.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-5 w-5 ${registrationStatus.registration_status === 'payment_pending' ? 'text-gray-300' : 'text-green-500'}`} />
                  <span>Payment Completed</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {registrationStatus.registration_status !== 'payment_pending' ? 'Completed' : 'Pending'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-5 w-5 ${['care_team_assigned', 'fully_registered'].includes(registrationStatus.registration_status) ? 'text-green-500' : 'text-gray-300'}`} />
                  <span>Care Team Assignment</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {['care_team_assigned', 'fully_registered'].includes(registrationStatus.registration_status) ? 'Completed' : 'In Progress'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-5 w-5 ${registrationStatus.registration_status === 'fully_registered' ? 'text-green-500' : 'text-gray-300'}`} />
                  <span>Account Setup Complete</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {registrationStatus.registration_status === 'fully_registered' ? 'Completed' : 'In Progress'}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Check Status Again
            </Button>
          </CardFooter>
        </Card>

        <PatientCuratedHealthTips />
      </ResponsiveContainer>
    );
  }

  // Regular dashboard for completed registration
  return (
    <ResponsiveContainer fluid withPadding className="space-y-6">
      {isMobile ? (
        <div className="h-16"></div> // Spacer for mobile header
      ) : (
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
      )}

      <div className="w-full">
        <HealthTrackingCards habitSummary={habitSummary} />
      </div>

      {/* Updated grid layout to ensure the two cards take full row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {patientData?.nextAppointment && (
          <Card className="bg-[#E5DEFF]/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-[#E5DEFF] p-2 rounded-full">
                    <Calendar className="h-5 w-5 text-[#9b87f5]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm mb-2">Next Appointment</h3>
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
        <PatientCuratedHealthTips />
      </div>

      <div className="w-full">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5" />
              Care Team Chat
            </CardTitle>
            <CardDescription>
              Recent messages from your healthcare team
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 h-[300px]">
            {isLoadingRoom ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#9b87f5]"></div>
              </div>
            ) : (
              <RecentCareTeamMessages patientRoomId={careTeamRoomId} messageLimit={4} />
            )}
          </CardContent>
        </Card>
      </div>
    </ResponsiveContainer>
  );
};
