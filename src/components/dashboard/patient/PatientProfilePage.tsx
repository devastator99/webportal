
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PatientSidebar } from "@/components/dashboard/patient/PatientSidebar";
import { Button } from "@/components/ui/button";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { MedicalRecordsUpload } from "@/components/dashboard/patient/MedicalRecordsUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Edit, Upload, File, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { Progress } from "@/components/ui/progress";
import { format } from 'date-fns';

// Define interfaces for our data
interface ProfileData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  blood_type?: string;
  allergies?: string;
  medical_conditions?: string;
  emergency_contact?: string;
}

interface HabitSummary {
  habit_type: string;
  avg_value: number;
}

const PatientProfilePage = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const today = format(new Date(), 'yyyy-MM-dd');

  // Fetch patient profile data
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["patient_profile", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("No user ID");
      
      // Get main profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (profileError) {
        throw new Error(profileError.message);
      }
      
      // Fetch additional patient details
      const { data: patientDetails, error: patientError } = await supabase
        .from("patient_details")
        .select("*")
        .eq("id", user.id)
        .single();
      
      // Combine profile data with patient details
      return {
        ...profileData,
        ...patientDetails,
      } as ProfileData;
    },
    enabled: !!user?.id,
  });

  // Fetch habit summary data
  const { data: habitSummary, isLoading: isHabitLoading } = useQuery({
    queryKey: ["patient_habit_summary", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("No user ID");
      
      const { data, error } = await supabase
        .rpc("get_patient_habit_summary", {
          p_user_id: user.id
        });
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as HabitSummary[];
    },
    enabled: !!user?.id,
  });

  // Calculate percentages from habit data
  const getHabitPercentage = (habitType: string): number => {
    if (!habitSummary) return 0;
    
    const habit = habitSummary.find(h => h.habit_type === habitType);
    if (!habit) return 0;
    
    const targetValues: Record<string, number> = {
      physical: 60, // 60 minutes per day
      nutrition: 8, // score out of 10
      sleep: 8, // 8 hours
      mindfulness: 20 // 20 minutes
    };
    
    return Math.min(100, Math.round((habit.avg_value / targetValues[habitType]) * 100));
  };

  const getHabitValue = (habitType: string): string => {
    if (!habitSummary) return "0";
    
    const habit = habitSummary.find(h => h.habit_type === habitType);
    if (!habit) return "0";
    
    const units: Record<string, string> = {
      physical: "min",
      nutrition: "/10",
      sleep: "hrs",
      mindfulness: "min"
    };
    
    return `${habit.avg_value}${units[habitType]}`;
  };

  if (isProfileLoading || isHabitLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <PatientSidebar />
        <div className={`flex-1 ${isMobile ? "pb-20 pt-16" : ""}`}>
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold mb-6">My Profile</h1>
            
            <Tabs defaultValue="personal" className="space-y-6">
              <TabsList>
                <TabsTrigger value="personal" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personal Information
                </TabsTrigger>
                <TabsTrigger value="health" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Health Tracking
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-2">
                  <File className="h-4 w-4" />
                  Medical Records
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="personal" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Personal Information</CardTitle>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Edit Profile
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      <Avatar className="h-24 w-24">
                        <AvatarFallback className="text-2xl bg-[#E5DEFF] text-[#9b87f5]">
                          {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                        <div>
                          <p className="text-sm text-muted-foreground">First Name</p>
                          <p className="font-medium">{profile?.first_name || "Not provided"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Last Name</p>
                          <p className="font-medium">{profile?.last_name || "Not provided"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{user?.email || "Not provided"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium">{profile?.phone || "Not provided"}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm text-muted-foreground">Address</p>
                          <p className="font-medium">{profile?.address || "Not provided"}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Medical Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Blood Type</p>
                        <p className="font-medium">{profile?.blood_type || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Allergies</p>
                        <p className="font-medium">{profile?.allergies || "None reported"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Medical Conditions</p>
                        <p className="font-medium">{profile?.medical_conditions || "None reported"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Emergency Contact</p>
                        <p className="font-medium">{profile?.emergency_contact || "Not provided"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="health" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Health Tracking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Physical Activity Card */}
                      <Card className="shadow-sm hover:shadow-md transition-all duration-200">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">Physical Activity</h3>
                              <Activity className="h-4 w-4 text-[#9b87f5]" />
                            </div>
                            <span className="text-sm font-medium">{getHabitValue('physical')}</span>
                          </div>
                          <div className="space-y-2">
                            <Progress value={getHabitPercentage('physical')} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              {getHabitPercentage('physical')}% of daily goal
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Nutrition Card */}
                      <Card className="shadow-sm hover:shadow-md transition-all duration-200">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">Nutrition</h3>
                              <Activity className="h-4 w-4 text-[#9b87f5]" />
                            </div>
                            <span className="text-sm font-medium">{getHabitValue('nutrition')}</span>
                          </div>
                          <div className="space-y-2">
                            <Progress value={getHabitPercentage('nutrition')} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              {getHabitPercentage('nutrition')}% of daily goal
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Sleep Card */}
                      <Card className="shadow-sm hover:shadow-md transition-all duration-200">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">Sleep</h3>
                              <Activity className="h-4 w-4 text-[#9b87f5]" />
                            </div>
                            <span className="text-sm font-medium">{getHabitValue('sleep')}</span>
                          </div>
                          <div className="space-y-2">
                            <Progress value={getHabitPercentage('sleep')} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              {getHabitPercentage('sleep')}% of daily goal
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Mindfulness Card */}
                      <Card className="shadow-sm hover:shadow-md transition-all duration-200">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">Mindfulness</h3>
                              <Activity className="h-4 w-4 text-[#9b87f5]" />
                            </div>
                            <span className="text-sm font-medium">{getHabitValue('mindfulness')}</span>
                          </div>
                          <div className="space-y-2">
                            <Progress value={getHabitPercentage('mindfulness')} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              {getHabitPercentage('mindfulness')}% of daily goal
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="documents" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Medical Records</CardTitle>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload New
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <MedicalRecordsUpload />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default PatientProfilePage;

