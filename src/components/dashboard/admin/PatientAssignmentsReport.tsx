
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PatientAssignmentsTable } from "@/components/dashboard/admin/reports/PatientAssignmentsTable";
import { usePatientAssignments } from "@/hooks/usePatientAssignments";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useResponsive } from "@/contexts/ResponsiveContext";
import { useBreakpoint } from "@/hooks/use-responsive";

export const PatientAssignmentsReport = () => {
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const { data: assignments = [], isLoading, error, refetch } = usePatientAssignments();
  const { isSmallScreen, isMediumScreen } = useBreakpoint();

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
    <Card className={isSmallScreen || isMediumScreen ? "overflow-x-auto max-w-full" : ""}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <div className="bg-[#D3E4FD] p-1.5 rounded-full">
            <Users className="h-4 w-4 text-[#0EA5E9]" />
          </div>
          Patient Care Team Assignments
        </CardTitle>
        <Button 
          variant="outline" 
          size={isSmallScreen ? "sm" : "default"} 
          onClick={handleRefresh} 
          disabled={isLoading || refreshing}
          className="gap-1"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {!isSmallScreen && "Refresh"}
        </Button>
      </CardHeader>
      <CardContent className={isSmallScreen || isMediumScreen ? "pb-6 overflow-x-auto" : ""}>
        {error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
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
          <div className={isSmallScreen || isMediumScreen ? "max-w-full overflow-x-auto -mx-2 px-2" : ""}>
            <PatientAssignmentsTable assignments={assignments} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
