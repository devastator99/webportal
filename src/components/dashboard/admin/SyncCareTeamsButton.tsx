
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const SyncCareTeamsButton = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      console.log("Starting care team room sync...");
      
      // Call the Edge Function to sync care team rooms
      const { data, error } = await supabase.functions.invoke('sync-care-team-rooms');
      
      if (error) {
        console.error("Error syncing care team rooms:", error);
        throw new Error(`Failed to sync: ${error.message}`);
      }
      
      // Count the rooms synced
      const roomCount = data?.rooms?.length || 0;
      const results = data?.results || [];
      
      // Count results by status
      const statusCounts = {
        created: results.filter(r => r.status === 'created').length,
        updated: results.filter(r => r.status === 'updated').length,
        skipped: results.filter(r => r.status === 'skipped').length,
        error: results.filter(r => r.status === 'error').length
      };
      
      console.log("Sync complete: ", {
        totalRooms: roomCount,
        statusCounts
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["doctor_care_team_rooms"] });
      queryClient.invalidateQueries({ queryKey: ["user_care_team_rooms"] });
      
      const message = `Rooms synced: ${roomCount} (${statusCounts.created} created, ${statusCounts.updated} updated, ${statusCounts.skipped} skipped, ${statusCounts.error} errors)`;
      
      toast({
        title: "Care Teams Synced",
        description: message
      });
    } catch (error: any) {
      console.error("Error in sync operation:", error);
      toast({
        title: "Sync Failed",
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
