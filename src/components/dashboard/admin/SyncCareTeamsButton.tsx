
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { syncAllCareTeamRooms } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const SyncCareTeamsButton = () => {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      console.log("Starting care team room sync...");
      
      const result = await syncAllCareTeamRooms();
      console.log("Sync result:", result);
      
      if (result.success) {
        const createdCount = result.statusCounts?.created || 0;
        const updatedCount = result.statusCounts?.updated || 0;
        const errorCount = result.statusCounts?.error || 0;
        const totalRooms = result.rooms?.length || 0;
        
        toast({
          title: "Care teams synced successfully",
          description: `Processed ${totalRooms} care team rooms (${createdCount} created, ${updatedCount} updated, ${errorCount} errors)`
        });
      } else {
        toast({
          title: "Care team sync failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Error syncing care team rooms:", error);
      toast({
        title: "Error syncing care teams",
        description: error.message || "Please check the console for details",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  return (
    <Button
      onClick={handleSync}
      disabled={isSyncing}
      variant="outline"
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
      {isSyncing ? 'Syncing...' : 'Sync Care Teams'}
    </Button>
  );
};
