
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserManagement } from "@/components/dashboard/admin/UserManagement";
import { PatientAssignmentManager } from "@/components/dashboard/admin/PatientAssignmentManager";
import { PatientAssignmentsReport } from "@/components/dashboard/admin/PatientAssignmentsReport";
import { UserRegistration } from "@/components/dashboard/admin/UserRegistration";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { Settings } from "lucide-react";

// Simple system settings component
const SystemSettings = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          System Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          System settings and configuration options will be available soon.
        </p>
      </CardContent>
    </Card>
  );
};

export const AdminDashboard = () => {
  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
      </div>
      
      <div className="space-y-6">
        <CollapsibleSection title="Patient Assignments" defaultOpen={true}>
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
