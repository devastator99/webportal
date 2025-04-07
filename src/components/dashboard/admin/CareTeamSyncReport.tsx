
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PatientAssignmentsTable } from "@/components/dashboard/admin/reports/PatientAssignmentsTable";
import { usePatientAssignments } from "@/hooks/usePatientAssignments";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SyncCareTeamsButton } from "@/components/dashboard/admin/SyncCareTeamsButton";

export const CareTeamSyncReport = () => {
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const { data: assignments = [], isLoading, error, refetch } = usePatientAssignments();

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refetch();
      toast({
        title: "Assignments refreshed",
        description: "Latest patient assignments have been loaded"
      });
    } catch (error: any) {
      toast({
        title: "Error refreshing data",
        description: error.message || "Failed to refresh assignments",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Patient Care Team Assignments
        </CardTitle>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={isLoading || refreshing}
            className="gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <SyncCareTeamsButton />
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>
              Error loading patient assignments: {error instanceof Error ? error.message : 'Unknown error'}
            </AlertDescription>
          </Alert>
        ) : isLoading ? (
          <LoadingSpinner />
        ) : assignments.length === 0 ? (
          <Alert className="mb-4">
            <AlertDescription>
              No patient assignments found. Please create patient assignments before attempting to sync care teams.
            </AlertDescription>
          </Alert>
        ) : (
          <PatientAssignmentsTable assignments={assignments} />
        )}
      </CardContent>
    </Card>
  );
};
