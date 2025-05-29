
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserManagement } from "@/components/dashboard/admin/UserManagement";
import { PatientAssignmentManager } from "@/components/dashboard/admin/PatientAssignmentManager";
import { PatientAssignmentsReport } from "@/components/dashboard/admin/PatientAssignmentsReport";
import { UserRegistration } from "@/components/dashboard/admin/UserRegistration";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { Settings, Users, FileText, Database, UserPlus, Building, CreditCard, FileDown, Wrench } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AdminSettings } from "@/components/dashboard/admin/AdminSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminStats } from "@/hooks/useAdminStats";
import { NumericFormat } from "react-number-format";
import { PatientPaymentManager } from "@/components/dashboard/admin/PatientPaymentManager";
import { UserTrainingDocumentPDF } from "@/components/dashboard/admin/UserTrainingDocumentPDF";
import { RegistrationProgressReport } from "@/components/dashboard/admin/RegistrationProgressReport";
import { RegistrationTaskProcessor } from "@/components/testing/RegistrationTaskProcessor";

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
  const { data: stats, isLoading: isLoadingStats } = useAdminStats();

  return (
    <div className="space-y-4 animate-fade-up">
      {syncSuccess && (
        <Alert className="bg-green-50 border-green-200 text-green-800 mb-4">
          <AlertDescription>{syncSuccess}</AlertDescription>
        </Alert>
      )}
      
      {syncError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{syncError}</AlertDescription>
        </Alert>
      )}
      
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center">
              <div className="bg-[#D3E4FD] p-3 rounded-full mb-2">
                <Users className="h-6 w-6 text-[#0EA5E9]" />
              </div>
              {isLoadingStats ? (
                <Skeleton className="h-8 w-16 mb-2" />
              ) : (
                <span className="text-2xl font-bold">
                  <NumericFormat 
                    value={stats?.total_users || 0} 
                    displayType="text" 
                    thousandSeparator="," 
                  />
                </span>
              )}
              <span className="text-xs text-gray-500 text-center">Total Users</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="bg-[#E5DEFF] p-3 rounded-full mb-2">
                <Building className="h-6 w-6 text-[#9b87f5]" />
              </div>
              {isLoadingStats ? (
                <Skeleton className="h-8 w-16 mb-2" />
              ) : (
                <span className="text-2xl font-bold">
                  <NumericFormat 
                    value={stats?.total_clinics || 0} 
                    displayType="text" 
                    thousandSeparator="," 
                  />
                </span>
              )}
              <span className="text-xs text-gray-500 text-center">Clinics</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="bg-[#F2FCE2] p-3 rounded-full mb-2">
                <Database className="h-6 w-6 text-green-500" />
              </div>
              {isLoadingStats ? (
                <Skeleton className="h-8 w-16 mb-2" />
              ) : (
                <span className="text-2xl font-bold">
                  {stats?.system_status || "Checking..."}
                </span>
              )}
              <span className="text-xs text-gray-500 text-center">System Status</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-6">
        <CollapsibleSection title="Registration Management" id="registration-management">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Registration Task Processor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RegistrationTaskProcessor />
              </CardContent>
            </Card>
            
            <RegistrationProgressReport />
          </div>
        </CollapsibleSection>
        
        <CollapsibleSection title="Assign Care Team" id="care-team">
          <PatientAssignmentManager />
        </CollapsibleSection>
        
        <CollapsibleSection title="Care Team Reports" defaultOpen={false} id="reports">
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
        
        <CollapsibleSection title="User Management" id="user-management">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UserManagement />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Register New User
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UserRegistration />
              </CardContent>
            </Card>
          </div>
        </CollapsibleSection>
        
        <CollapsibleSection title="Patient Payments" id="payments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Patient Payments and Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PatientPaymentManager />
            </CardContent>
          </Card>
        </CollapsibleSection>
        
        <CollapsibleSection title="System Settings" id="settings">
          <SystemSettings />
        </CollapsibleSection>
        
        <CollapsibleSection title="User Training Documentation" defaultOpen={false} id="training">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileDown className="h-5 w-5" />
                User Training Documentation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UserTrainingDocumentPDF />
            </CardContent>
          </Card>
        </CollapsibleSection>
      </div>
    </div>
  );
};
