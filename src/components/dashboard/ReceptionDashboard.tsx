
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MessageCircle, Users, LogOut } from "lucide-react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { AppointmentsList } from "./patient/AppointmentsList";
import { DashboardHeader } from "./DashboardHeader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

export const ReceptionDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Successfully signed out",
        description: "You have been signed out of your account",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: "There was a problem signing you out. Please try again.",
      });
    }
  };

  const actionButtons = (
    <div className="flex items-center justify-end">
      <Button 
        onClick={handleSignOut}
        variant="outline" 
        className="border-[#9b87f5] text-[#7E69AB] hover:bg-[#E5DEFF]"
        size={isMobile ? "sm" : "default"}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );

  const { data: dashboardData } = useQuery({
    queryKey: ["reception_dashboard", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("No user ID");

      const [
        { data: appointments, error: appointmentsError },
        { data: totalPatients, error: patientsError },
        { data: totalDoctors, error: doctorsError }
      ] = await Promise.all([
        supabase
          .from("appointments")
          .select(`
            id,
            scheduled_at,
            status,
            doctor:profiles!appointments_doctor_profile_fkey(
              first_name,
              last_name
            ),
            patient:profiles!appointments_patient_profile_fkey(
              first_name,
              last_name
            )
          `)
          .eq("status", "scheduled")
          .order("scheduled_at", { ascending: true }),
        supabase
          .from("user_roles")
          .select("id")
          .eq("role", "patient")
          .limit(1)
          .select("count"),
        supabase
          .from("user_roles")
          .select("id")
          .eq("role", "doctor")
          .limit(1)
          .select("count")
      ]);

      if (appointmentsError) throw appointmentsError;
      if (patientsError) throw patientsError;
      if (doctorsError) throw doctorsError;

      return {
        appointments: appointments || [],
        totalPatients: totalPatients?.[0]?.count || 0,
        totalDoctors: totalDoctors?.[0]?.count || 0
      };
    },
    enabled: !!user?.id
  });

  return (
    <div className="container mx-auto pt-20 pb-6 px-6 space-y-6">
      <DashboardHeader actionButton={actionButtons} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.appointments.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.totalPatients || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.totalDoctors || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AppointmentsList appointments={dashboardData?.appointments || []} />
        <ChatInterface />
      </div>
    </div>
  );
};
