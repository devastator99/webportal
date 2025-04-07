
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserManagement } from "@/components/dashboard/admin/UserManagement";
import { PatientAssignmentManager } from "@/components/dashboard/admin/PatientAssignmentManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Database, BarChart4, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { syncAllCareTeamRooms, supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Placeholder for AnalyticsPanel until it's implemented
const AnalyticsPanel = () => {
  return (
    <div className="p-4">
      <h3 className="text-lg font-medium mb-2">Analytics Dashboard</h3>
      <p className="text-gray-500">Analytics features will be available soon.</p>
    </div>
  );
};

export const AdminDashboard = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState("");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [patientAssignmentsCount, setPatientAssignmentsCount] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check for patient assignments on component mount
  useEffect(() => {
    const checkPatientAssignments = async () => {
      try {
        const { count, error } = await supabase
          .from('patient_assignments')
          .select('*', { count: 'exact', head: true });
          
        if (error) {
          console.error("Error checking patient assignments:", error);
        } else {
          console.log(`Found ${count} total patient assignments`);
          setPatientAssignmentsCount(count || 0);
        }
      } catch (error) {
        console.error("Error in checkPatientAssignments:", error);
      }
    };
    
    checkPatientAssignments();
  }, []);

  const handleSyncCareTeams = async () => {
    try {
      setIsSyncing(true);
      setSyncStatus("Starting sync process...");
      setSyncError(null);
      
      toast({
        title: "Syncing care team rooms...",
        description: "This may take a moment",
      });
      
      console.log("Starting care team rooms sync from AdminDashboard");
      
      // Check patient assignments before sync
      if (patientAssignmentsCount === 0) {
        setSyncStatus("No patient assignments found");
        setSyncError("No patient assignments exist. Please create patient assignments first.");
        toast({
          title: "Sync failed",
          description: "No patient assignments exist. Please create patient assignments first.",
          variant: "destructive",
        });
        return;
      }
      
      // Run the sync function
      const result = await syncAllCareTeamRooms();
      console.log("Sync result:", result);
      
      // Check if result contains expected data
      if (!result || !result.rooms) {
        console.warn("Sync completed but returned unexpected data format:", result);
        setSyncStatus("Sync completed with unexpected data format");
        toast({
          title: "Sync completed",
          description: "Sync process completed but returned unexpected data",
        });
      } else {
        setSyncStatus(`Successfully synced ${result.rooms.length || 0} care team rooms`);
        toast({
          title: "Sync completed",
          description: `Successfully synced ${result.rooms.length || 0} care team rooms`,
        });
      }
      
      // Invalidate any patient assignments or chat rooms queries
      console.log("Invalidating related queries");
      queryClient.invalidateQueries({ queryKey: ["patient_assignments_report"] });
      queryClient.invalidateQueries({ queryKey: ["care_team_rooms"] });
      
    } catch (error: any) {
      console.error("Error in handleSyncCareTeams:", error);
      setSyncStatus(`Error: ${error.message}`);
      setSyncError(error.message);
      toast({
        title: "Sync failed",
        description: error.message || "Could not sync care team rooms",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        <div className="flex flex-col items-end gap-1">
          {patientAssignmentsCount > 0 && (
            <span className="text-sm text-muted-foreground">
              {patientAssignmentsCount} patient assignments in database
            </span>
          )}
          <Button 
            onClick={handleSyncCareTeams} 
            disabled={isSyncing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync Care Teams
          </Button>
          {syncStatus && (
            <span className="text-xs text-muted-foreground mt-1">{syncStatus}</span>
          )}
        </div>
      </div>
      
      {syncError && (
        <Alert variant="destructive" className="mb-2">
          <AlertDescription>{syncError}</AlertDescription>
        </Alert>
      )}
      
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
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart4 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <UserManagement />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Care Team Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <PatientAssignmentManager />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <AnalyticsPanel />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
