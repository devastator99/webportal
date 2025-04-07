
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserManagement } from "@/components/dashboard/admin/UserManagement";
import { PatientAssignmentManager } from "@/components/dashboard/admin/PatientAssignmentManager";
import { PatientAssignmentsReport } from "@/components/dashboard/admin/PatientAssignmentsReport";
import { UserRegistration } from "@/components/dashboard/admin/UserRegistration";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { Settings, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSyncCareTeams = async () => {
    setSyncing(true);
    setSyncSuccess(null);
    setSyncError(null);

    try {
      // Check if user has permission to sync rooms
      const { data: canSync, error: permissionError } = await supabase.rpc('user_can_sync_rooms');
      
      if (permissionError) {
        throw new Error(`Permission check failed: ${permissionError.message}`);
      }
      
      if (!canSync) {
        throw new Error("You don't have permission to sync care team rooms");
      }

      // Call the function to sync all care team rooms
      const { data, error } = await supabase.rpc('sync_all_care_team_rooms');
      
      if (error) {
        throw error;
      }
      
      // Count the number of room IDs returned
      const roomCount = Array.isArray(data) ? data.length : 0;
      setSyncSuccess(`Successfully synced ${roomCount} care team rooms`);
      
      toast({
        title: "Care Teams Synced",
        description: `Successfully synced ${roomCount} care team rooms`,
      });
    } catch (error: any) {
      console.error("Error syncing care teams:", error);
      
      const errorMessage = error.message || "Failed to sync care teams";
      setSyncError(errorMessage);
      
      toast({
        title: "Sync Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        <Button 
          onClick={handleSyncCareTeams} 
          disabled={syncing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? "Syncing..." : "Sync Care Teams"}
        </Button>
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
