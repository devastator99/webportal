
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveContainer } from "@/components/layout/ResponsiveContainer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HealthTrackingCards } from "./patient/HealthTrackingCards";
import { PatientCuratedHealthTips } from "./patient/PatientCuratedHealthTips";
import { RecentCareTeamMessages } from "@/components/chat/RecentCareTeamMessages";
import { RegistrationPayment } from "@/components/auth/RegistrationPayment";
import { useQuery } from "@tanstack/react-query";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { Calendar, UserRound, CheckCircle2, Clock, Loader2, AlertTriangle, CreditCard } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePatientHabits } from "@/hooks/usePatientHabits";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserRegistrationStatus } from "@/types/registration";
import "@/styles/mobile-responsive.css";

export const PatientDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [careTeamRoomId, setCareTeamRoomId] = useState<string | null>(null);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [registrationStatus, setRegistrationStatus] = useState<UserRegistrationStatus | null>(null);
  const [isRegistrationComplete, setIsRegistrationComplete] = useState(true);
  const [isProcessingTasks, setIsProcessingTasks] = useState(false);
  const [lastProcessingError, setLastProcessingError] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  
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

  const handleProcessRegistrationTasks = async () => {
    if (!user?.id) {
      const errorMsg = "User not authenticated";
      console.error("Process tasks error:", errorMsg);
      setLastProcessingError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
      return;
    }

    setIsProcessingTasks(true);
    setLastProcessingError(null);
    
    try {
      console.log("=== DASHBOARD: STARTING TASK PROCESSING ===");
      console.log("Triggering registration task processing for user:", user.id);
      
      // Add timeout to the function call
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Function call timeout after 30 seconds')), 30000);
      });
      
      const functionPromise = supabase.functions.invoke('trigger-registration-notifications', {
        body: { patient_id: user.id }
      });
      
      console.log("Dashboard function call initiated, waiting for response...");
      
      // Race between the function call and timeout
      const { data, error } = await Promise.race([functionPromise, timeoutPromise]) as any;
      
      console.log("=== DASHBOARD: FUNCTION RESPONSE RECEIVED ===");
      console.log("Function response data:", data);
      console.log("Function response error:", error);
      
      if (error) {
        console.error("Dashboard edge function error details:", error);
        const errorMessage = error.message || "Failed to process registration tasks";
        setLastProcessingError(errorMessage);
        throw new Error(errorMessage);
      }
      
      console.log("Dashboard registration tasks processing result:", data);
      
      toast({
        title: "Processing Started",
        description: data?.message || "Registration tasks are being processed.",
      });
      
      // Refresh registration status after processing
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
    } catch (err: any) {
      console.error("=== DASHBOARD: TASK PROCESSING ERROR ===");
      console.error("Error details:", err);
      
      const errorMessage = err.message || "Failed to process registration tasks";
      setLastProcessingError(errorMessage);
      
      toast({
        title: "Processing Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessingTasks(false);
      console.log("=== DASHBOARD: TASK PROCESSING COMPLETED ===");
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
  
  // If registration is not complete, show a simplified dashboard with payment option
  if (!isRegistrationComplete && registrationStatus) {
    return (
      <div className="mobile-container mobile-content-spacing">
        <div className="mobile-header">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 bg-[#E5DEFF]">
              <AvatarFallback className="text-[#9b87f5] font-medium mobile-text-scale">
                {patientData?.profile?.first_name?.charAt(0)}{patientData?.profile?.last_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="mobile-card-title">Welcome, {patientData?.profile?.first_name}</h1>
              <p className="mobile-text-scale text-muted-foreground">Your account setup is in progress</p>
            </div>
          </div>
        </div>

        {/* Payment Dialog */}
        {showPaymentDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Complete Registration Payment</h2>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowPaymentDialog(false)}
                  >
                    ×
                  </Button>
                </div>
                <RegistrationPayment 
                  onComplete={() => {
                    setShowPaymentDialog(false);
                    window.location.reload();
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <Card className="mobile-card">
          <CardHeader className="mobile-card-header">
            <CardTitle className="mobile-card-title flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#9b87f5]" />
              Registration Status
            </CardTitle>
            <CardDescription className="mobile-text-scale">Your account is being set up</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert className="bg-[#E5DEFF]/20 border-[#9b87f5]/30">
              <AlertDescription className="mobile-text-scale">
                Your account is currently being set up. This includes assigning your care team and creating your communication channels. This process should be completed shortly.
              </AlertDescription>
            </Alert>
            
            {lastProcessingError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="mobile-text-scale">
                  Processing error: {lastProcessingError}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-4 w-4 ${registrationStatus.registration_status === 'payment_pending' ? 'text-gray-300' : 'text-green-500'}`} />
                  <span className="mobile-text-scale">Payment Completed</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {registrationStatus.registration_status !== 'payment_pending' ? 'Completed' : 'Pending'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-4 w-4 ${['care_team_assigned', 'fully_registered'].includes(registrationStatus.registration_status) ? 'text-green-500' : 'text-gray-300'}`} />
                  <span className="mobile-text-scale">Care Team Assignment</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {['care_team_assigned', 'fully_registered'].includes(registrationStatus.registration_status) ? 'Completed' : 'In Progress'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-4 w-4 ${registrationStatus.registration_status === 'fully_registered' ? 'text-green-500' : 'text-gray-300'}`} />
                  <span className="mobile-text-scale">Account Setup Complete</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {registrationStatus.registration_status === 'fully_registered' ? 'Completed' : 'In Progress'}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            {registrationStatus.registration_status === 'payment_pending' && (
              <Button 
                onClick={() => setShowPaymentDialog(true)}
                className="mobile-button w-full bg-[#9b87f5] hover:bg-[#8b77e5]"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Complete Payment
              </Button>
            )}
            
            <Button 
              onClick={handleProcessRegistrationTasks}
              className="mobile-button w-full"
              variant="outline"
              disabled={isProcessingTasks}
            >
              {isProcessingTasks ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Check Status Again"
              )}
            </Button>
          </CardFooter>
        </Card>

        <div className="mobile-card">
          <PatientCuratedHealthTips />
        </div>
      </div>
    );
  }

  // Regular dashboard for completed registration
  return (
    <div className="mobile-container mobile-content-spacing">
      {/* Mobile optimized header */}
      <div className="mobile-header">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 bg-[#E5DEFF]">
            <AvatarFallback className="text-[#9b87f5] font-medium mobile-text-scale">
              {patientData?.profile?.first_name?.charAt(0)}{patientData?.profile?.last_name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="mobile-card-title">Welcome, {patientData?.profile?.first_name}</h1>
            <p className="mobile-text-scale text-muted-foreground">Keep track of your health journey</p>
          </div>
        </div>
      </div>

      {/* Health tracking cards with mobile grid */}
      <div className="mb-4">
        <HealthTrackingCards habitSummary={habitSummary} />
      </div>

      {/* Mobile optimized grid layout */}
      <div className="mobile-grid mb-4">
        {patientData?.nextAppointment && (
          <Card className="mobile-card bg-[#E5DEFF]/20">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-[#E5DEFF] p-1.5 rounded-full">
                    <Calendar className="h-4 w-4 text-[#9b87f5]" />
                  </div>
                  <div>
                    <h3 className="mobile-card-title mb-1">Next Appointment</h3>
                    <p className="mobile-text-scale text-muted-foreground mb-1">
                      {new Date(patientData.nextAppointment.scheduled_at).toLocaleDateString()} at {new Date(patientData.nextAppointment.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                    <p className="mobile-text-scale">
                      With Dr. {patientData.nextAppointment.doctor_first_name} {patientData.nextAppointment.doctor_last_name}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-[#9b87f5] mobile-text-scale">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="mobile-card">
          <PatientCuratedHealthTips />
        </div>
      </div>

      {/* Care team chat with mobile optimization */}
      <Card className="mobile-card">
        <CardHeader className="mobile-card-header">
          <CardTitle className="mobile-card-title flex items-center gap-2">
            <UserRound className="h-4 w-4" />
            Care Team Chat
          </CardTitle>
          <CardDescription className="mobile-text-scale">
            Recent messages from your healthcare team
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 h-[300px]">
          {isLoadingRoom ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#9b87f5]"></div>
            </div>
          ) : (
            <RecentCareTeamMessages patientRoomId={careTeamRoomId} messageLimit={4} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
