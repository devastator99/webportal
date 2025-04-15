
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserManagement } from "@/components/dashboard/admin/UserManagement";
import { PatientAssignmentManager } from "@/components/dashboard/admin/PatientAssignmentManager";
import { PatientAssignmentsReport } from "@/components/dashboard/admin/PatientAssignmentsReport";
import { UserRegistration } from "@/components/dashboard/admin/UserRegistration";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { Settings, Users, FileText, Database, UserPlus, Building, CreditCard, FileDown, Home, LogOut, ArrowRight } from "lucide-react";
import { SyncCareTeamsButton } from "@/components/dashboard/admin/SyncCareTeamsButton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AdminSettings } from "@/components/dashboard/admin/AdminSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminStats } from "@/hooks/useAdminStats";
import { NumericFormat } from "react-number-format";
import { PatientPaymentManager } from "@/components/dashboard/admin/PatientPaymentManager";
import { UserTrainingDocumentPDF } from "@/components/dashboard/admin/UserTrainingDocumentPDF";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/navbar/SignOutButton";
import { ForceLogoutButton } from "@/components/navbar/ForceLogoutButton";

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
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Sections data for easy navigation
  const sections = [
    { id: "care-team", title: "Assign Care Team", icon: <Users className="h-4 w-4" /> },
    { id: "reports", title: "Care Team Reports", icon: <FileText className="h-4 w-4" /> },
    { id: "user-management", title: "User Management", icon: <Users className="h-4 w-4" /> },
    { id: "payments", title: "Patient Payments", icon: <CreditCard className="h-4 w-4" /> },
    { id: "settings", title: "System Settings", icon: <Settings className="h-4 w-4" /> },
    { id: "training", title: "User Training Documentation", icon: <FileDown className="h-4 w-4" /> }
  ];

  // Handle scroll to section
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="sticky top-16 z-30 bg-white dark:bg-gray-950 pt-2 pb-3 border-b">
        <Breadcrumb className="mb-3">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                <Home className="h-4 w-4 mr-1" />
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Admin Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1 border-[#9b87f5] text-[#7E69AB] hover:bg-[#E5DEFF]"
              onClick={() => {
                window.location.href = '/dashboard';
              }}
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              <SyncCareTeamsButton />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 border-[#9b87f5] text-[#7E69AB] hover:bg-[#E5DEFF]"
            >
              <SignOutButton />
            </Button>
            
            <Button
              variant="destructive"
              size="sm"
              className="flex items-center gap-1 shadow-sm"
            >
              <ForceLogoutButton />
            </Button>
          </div>
        </div>
        
        {/* Quick navigation buttons */}
        <div className="flex overflow-x-auto pb-2 gap-2 mt-4 no-scrollbar">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`inline-flex items-center px-3 py-1.5 text-sm whitespace-nowrap rounded-full border 
                ${activeSection === section.id 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'bg-background hover:bg-muted/50'}`}
            >
              <span className="mr-1.5">{section.icon}</span>
              {section.title}
            </button>
          ))}
        </div>
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
      
      <div className="space-y-6 pb-20">
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
      
      {/* Floating action bar for mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 border-t p-3 flex justify-between gap-2 z-50 md:hidden">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={() => window.location.href = '/dashboard'}
        >
          <Home className="h-4 w-4" />
          <span>Dashboard</span>
        </Button>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
          >
            <ArrowRight className="h-4 w-4 rotate-270" />
            <span>Top</span>
          </Button>
          <SignOutButton />
        </div>
      </div>
    </div>
  );
};
