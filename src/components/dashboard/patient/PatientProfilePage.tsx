
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
import { Edit, Upload, File, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";

const PatientProfilePage = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  // Fetch patient profile data
  const { data: profile, isLoading } = useQuery({
    queryKey: ["patient_profile", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("No user ID");
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
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
