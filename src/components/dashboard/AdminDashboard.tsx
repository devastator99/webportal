
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserManagement } from "@/components/admin/UserManagement";
import { PatientAssignmentManager } from "@/components/admin/PatientAssignmentManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalyticsPanel } from "@/components/admin/AnalyticsPanel";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Users, Database, BarChart4, RefreshCw } from "lucide-react";
import { syncAllCareTeamRooms } from "@/integrations/supabase/client";

export const AdminDashboard = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSyncCareTeams = async () => {
    try {
      setIsSyncing(true);
      toast({
        title: "Syncing care team rooms...",
        description: "This may take a moment",
      });
      
      const result = await syncAllCareTeamRooms();
      
      toast({
        title: "Sync completed",
        description: `Successfully synced ${result?.rooms?.length || 0} care team rooms`,
      });
      
      // Invalidate any patient assignments or chat rooms queries
      queryClient.invalidateQueries({ queryKey: ["patient_assignments_report"] });
      queryClient.invalidateQueries({ queryKey: ["care_team_rooms"] });
      
    } catch (error: any) {
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
        <Button 
          onClick={handleSyncCareTeams} 
          disabled={isSyncing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          Sync Care Teams
        </Button>
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
