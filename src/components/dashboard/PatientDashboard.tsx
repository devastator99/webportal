
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { PatientStats } from "./patient/PatientStats";
import { DashboardHeader } from "./DashboardHeader";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { useIsIPad } from "@/hooks/use-mobile";
import { 
  Calendar, 
  FileText, 
  ArrowRight,
  UserRound
} from "lucide-react";
import { MedicalRecordsList } from './patient/MedicalRecordsList';
import { WhatsAppStyleChatInterface } from "@/components/chat/WhatsAppStyleChatInterface";
import { PatientCuratedHealthTips } from "./patient/PatientCuratedHealthTips";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const PatientDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isIPad = useIsIPad();
  const navigate = useNavigate();

  const [careTeamRoomId, setCareTeamRoomId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoomId = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase.functions.invoke('get-patient-care-team-room', {
          body: { patient_id: user.id }
        });
        
        if (error) {
          console.error("Failed to get care team chat room:", error);
        } else if (typeof data === "string" && data) {
          setCareTeamRoomId(data);
        } else if (typeof data === "object" && data !== null && data.id) {
          setCareTeamRoomId(data.id);
        } else if (typeof data === "object" && data !== null && "room_id" in data) {
          setCareTeamRoomId(data.room_id);
        } else {
          setCareTeamRoomId(null);
        }
      } catch (err) {
        console.error("Error fetching care team chat room:", err);
        setCareTeamRoomId(null);
      }
    };
    fetchRoomId();
  }, [user?.id]);

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

  const containerClasses = isIPad 
    ? "container mx-auto pt-20 pb-6 px-4 space-y-6 max-w-[95%]" 
    : "container mx-auto pt-20 pb-6 px-6 space-y-6";

  return (
    <div className={containerClasses}>
      <DashboardHeader />
      
      <div className="flex items-center gap-4 mb-4">
        <Avatar className="h-12 w-12 bg-[#E5DEFF]">
          <AvatarFallback className="text-[#9b87f5] font-medium">
            {patientData?.profile?.first_name?.charAt(0)}{patientData?.profile?.last_name?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-semibold">
            Welcome, {patientData?.profile?.first_name}
          </h1>
          <p className="text-muted-foreground">
            Keep track of your health journey
          </p>
        </div>
      </div>
      
      <div className={isIPad ? "overflow-x-auto pb-2" : ""}>
        <PatientStats />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-3 space-y-2"> {/* Reduced space-y from 4 to 2 */}
          {patientData?.nextAppointment && (
            <div className="p-4 bg-[#E5DEFF]/20 rounded-lg">
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
                    <p className="text-xs">With Dr. {patientData.nextAppointment.doctor_first_name} {patientData.nextAppointment.doctor_last_name}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-[#9b87f5]">
                  View Details
                </Button>
              </div>
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <UserRound className="h-5 w-5" />
              Care Team Chat
            </h2>
            <p className="text-muted-foreground mb-4">
              Connect with your healthcare team, send updates, and upload medical reports.
            </p>
            <div className="w-full max-w-2xl mx-auto">
              <WhatsAppStyleChatInterface patientRoomId={careTeamRoomId} />
            </div>
          </div>
          
          <PatientCuratedHealthTips />
          
          {patientData?.latestPrescription && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-500" />
                Latest Prescription
              </h2>
              <p className="text-muted-foreground mb-4">
                Issued on {new Date(patientData.latestPrescription.created_at).toLocaleDateString()} by Dr. {patientData.latestPrescription.doctor_first_name} {patientData.latestPrescription.doctor_last_name}
              </p>
              <div className="space-y-3 p-4 bg-muted/20 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium">Diagnosis</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {patientData.latestPrescription.diagnosis}
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium">Prescribed Medications</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {patientData.latestPrescription.prescription}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/patient/prescriptions')}>
                  View All Prescriptions <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
