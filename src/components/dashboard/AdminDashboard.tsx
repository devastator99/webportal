
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserManagement } from "@/components/dashboard/admin/UserManagement";
import { PatientAssignmentManager } from "@/components/dashboard/admin/PatientAssignmentManager";
import { PatientAssignmentsReport } from "@/components/dashboard/admin/PatientAssignmentsReport";
import { UserRegistration } from "@/components/dashboard/admin/UserRegistration";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { Settings, Users, FileText, Database, UserPlus, Building } from "lucide-react";
import { SyncCareTeamsButton } from "@/components/dashboard/admin/SyncCareTeamsButton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AdminSettings } from "@/components/dashboard/admin/AdminSettings";

// Updated system settings component that imports and uses AdminSettings
const SystemSettings = () => {
  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AdminSettings />
        </CardContent>
      </Card>
    </div>
  );
};

export const AdminDashboard = () => {
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        <SyncCareTeamsButton />
      </div>
      
      {syncSuccess && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <AlertDescription>{syncSuccess}</AlertDescription>
        </Alert>
      )}
      
      {syncError && (
        <Alert variant="destructive">
          <AlertDescription>{syncError}</AlertDescription>
        </Alert>
      )}
      
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center">
              <div className="bg-[#D3E4FD] p-3 rounded-full mb-2">
                <Users className="h-6 w-6 text-[#0EA5E9]" />
              </div>
              <span className="text-2xl font-bold">-</span>
              <span className="text-xs text-gray-500 text-center">Total Users</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="bg-[#E5DEFF] p-3 rounded-full mb-2">
                <Building className="h-6 w-6 text-[#9b87f5]" />
              </div>
              <span className="text-2xl font-bold">-</span>
              <span className="text-xs text-gray-500 text-center">Clinics</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="bg-[#F2FCE2] p-3 rounded-full mb-2">
                <Database className="h-6 w-6 text-green-500" />
              </div>
              <span className="text-2xl font-bold">-</span>
              <span className="text-xs text-gray-500 text-center">System Status</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-6">
        {/* Separate Care Team Assignment section */}
        <CollapsibleSection title="Care Team Assignment" defaultOpen={true}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Assign Care Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PatientAssignmentManager />
            </CardContent>
          </Card>
        </CollapsibleSection>
        
        {/* Separate Care Team Report section */}
        <CollapsibleSection title="Care Team Reports" defaultOpen={false}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Patient Care Team Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PatientAssignmentsReport />
            </CardContent>
          </Card>
        </CollapsibleSection>
        
        <CollapsibleSection title="User Management">
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
        </CollapsibleSection>
        
        <CollapsibleSection title="System Settings">
          <SystemSettings />
        </CollapsibleSection>
      </div>
    </div>
  );
};
