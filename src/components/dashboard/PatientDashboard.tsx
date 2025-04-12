import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { PatientStats } from "./patient/PatientStats";
import { DashboardHeader } from "./DashboardHeader";
import { useState } from "react";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { useIsIPad } from "@/hooks/use-mobile";
import { 
  Calendar, 
  FileText, 
  Activity, 
  Dumbbell, 
  Utensils, 
  Moon, 
  Brain,
  ArrowRight
} from "lucide-react";
import { PatientHealthTips } from "./patient/PatientHealthTips";
import { MedicalRecordsList } from './patient/MedicalRecordsList';
import { MedicalRecordsUpload } from './patient/MedicalRecordsUpload';

// Loading fallback component
const LoadingFallback = () => (
  <div className="space-y-3 p-4">
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-12 w-3/4" />
  </div>
);

export const PatientDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isIPad = useIsIPad();
  const navigate = useNavigate();

  const { data: patientData, isLoading } = useQuery({
    queryKey: ["patient_dashboard", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("No user ID");
      
      // First get the profile data
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

      // Get next appointment
      const { data: appointments, error: appointmentsError } = await supabase
        .rpc("get_patient_appointments", { p_patient_id: user.id });
        
      if (appointmentsError) {
        console.error("Error fetching appointments:", appointmentsError);
      }

      // Get latest prescription
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

      // Get health plan items
      const { data: healthPlanItems, error: healthPlanError } = await supabase
        .rpc("get_patient_health_plan", { p_patient_id: user.id });
        
      if (healthPlanError) {
        console.error("Error fetching health plan:", healthPlanError);
      }

      return {
        profile: {
          first_name: profile.first_name ?? '',
          last_name: profile.last_name ?? ''
        },
        nextAppointment: appointments && appointments.length > 0 ? appointments[0] : null,
        latestPrescription,
        healthPlanItems: healthPlanItems || []
      };
    },
    enabled: !!user?.id,
    staleTime: 30000,
    retry: 1
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Add iPad-specific classes for better visibility
  const containerClasses = isIPad 
    ? "container mx-auto pt-20 pb-6 px-4 space-y-6 max-w-[95%]" 
    : "container mx-auto pt-20 pb-6 px-6 space-y-6";

  return (
    <div className={containerClasses}>
      <DashboardHeader />
      
      {/* Stats Row - Enhanced for iPad */}
      <div className={isIPad ? "overflow-x-auto pb-2" : ""}>
        <PatientStats />
      </div>

      {/* Health Progress Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <Dumbbell className="h-8 w-8 text-blue-500 mb-1" />
              <h3 className="font-medium text-sm">Physical Activity</h3>
              <Progress value={75} className="h-2 w-full" />
              <p className="text-xs text-muted-foreground">75% of goal</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <Utensils className="h-8 w-8 text-green-500 mb-1" />
              <h3 className="font-medium text-sm">Nutrition</h3>
              <Progress value={60} className="h-2 w-full" />
              <p className="text-xs text-muted-foreground">60% of goal</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <Moon className="h-8 w-8 text-indigo-500 mb-1" />
              <h3 className="font-medium text-sm">Sleep</h3>
              <Progress value={85} className="h-2 w-full" />
              <p className="text-xs text-muted-foreground">85% of goal</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <Brain className="h-8 w-8 text-purple-500 mb-1" />
              <h3 className="font-medium text-sm">Mindfulness</h3>
              <Progress value={50} className="h-2 w-full" />
              <p className="text-xs text-muted-foreground">50% of goal</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Use collapsible sections but without lazy loading */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-3 space-y-6">
          {/* Next Appointment Highlight - Moved above medical reports upload */}
          {patientData?.nextAppointment && (
            <Card className="border-[#E5DEFF]">
              <CardContent className="p-4 flex items-center justify-between">
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
              </CardContent>
            </Card>
          )}
          
          {/* Update Medical Report */}
          <CollapsibleSection 
            title="Update Medical Report" 
            defaultOpen={true}
            className={isIPad ? "overflow-x-visible" : ""}
          >
            <div className={isIPad ? "p-2" : ""}>
              <MedicalRecordsUpload showUploadOnly />
            </div>
          </CollapsibleSection>
          
          {/* View Reports */}
          <CollapsibleSection 
            title="View Reports" 
            defaultOpen={false}
            className={isIPad ? "overflow-x-visible" : ""}
          >
            <MedicalRecordsList />
          </CollapsibleSection>
          
          {/* Display prescription summary */}
          {patientData?.latestPrescription && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-500" />
                  Latest Prescription
                </CardTitle>
                <CardDescription>
                  Issued on {new Date(patientData.latestPrescription.created_at).toLocaleDateString()} by Dr. {patientData.latestPrescription.doctor_first_name} {patientData.latestPrescription.doctor_last_name}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="space-y-3">
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
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="ml-auto" onClick={() => navigate('/patient/prescriptions')}>
                  View All Prescriptions <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {/* Display health plan summary */}
          {patientData?.healthPlanItems && patientData.healthPlanItems.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-500" />
                  Health Plan
                </CardTitle>
                <CardDescription>
                  Your personalized health activities
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="space-y-3">
                  {patientData.healthPlanItems.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.type === 'food' && <Utensils className="h-4 w-4 text-green-500" />}
                        {item.type === 'exercise' && <Dumbbell className="h-4 w-4 text-blue-500" />}
                        {item.type === 'meditation' && <Brain className="h-4 w-4 text-purple-500" />}
                        {item.type === 'sleep' && <Moon className="h-4 w-4 text-indigo-500" />}
                        <p className="text-sm">{item.description}</p>
                      </div>
                      <Badge variant="outline">{item.scheduled_time}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="ml-auto" onClick={() => navigate('/patient/habits')}>
                  View Full Health Plan <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}
          
          <PatientHealthTips />
        </div>
      </div>
    </div>
  );
};
