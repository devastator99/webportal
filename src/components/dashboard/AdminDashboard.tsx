
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserManagement } from "@/components/dashboard/admin/UserManagement";
import { PatientAssignmentManager } from "@/components/dashboard/admin/PatientAssignmentManager";
import { PatientAssignmentsReport } from "@/components/dashboard/admin/PatientAssignmentsReport";
import { UserRegistration } from "@/components/dashboard/admin/UserRegistration";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Database } from "lucide-react";

export const AdminDashboard = () => {
  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
      </div>
      
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="assignments" className="gap-2">
            <Database className="h-4 w-4" />
            Patient Assignments
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <UserManagement />
                </CardContent>
              </Card>
            </div>
            <div className="md:col-span-1">
              <UserRegistration />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="assignments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Assign Care Team</CardTitle>
                </CardHeader>
                <CardContent>
                  <PatientAssignmentManager />
                </CardContent>
              </Card>
            </div>
            <div className="md:col-span-2">
              <PatientAssignmentsReport />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
