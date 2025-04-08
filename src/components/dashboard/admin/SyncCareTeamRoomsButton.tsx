
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SyncResult = {
  patient_id: string;
  room_id: string;
  doctor_id: string;
  nutritionist_id: string | null;
  result: string;
};

export const SyncCareTeamRoomsButton = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const handleSyncRooms = async () => {
    try {
      setIsSyncing(true);
      setResults(null);
      
      const { data, error } = await supabase.functions.invoke('sync-care-team-rooms', {
        method: 'POST',
        body: {}
      });
      
      if (error) {
        throw error;
      }
      
      console.log("Sync results:", data);
      setResults(data);
      
      toast({
        title: "Care team rooms synced",
        description: `Created: ${data.statusCounts.created}, Updated: ${data.statusCounts.updated}, Skipped: ${data.statusCounts.skipped}, Errors: ${data.statusCounts.error}`,
      });
    } catch (error) {
      console.error("Error syncing care team rooms:", error);
      toast({
        title: "Error syncing care team rooms",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  const handleSyncRoomsWithDbFunction = async () => {
    try {
      setIsSyncing(true);
      setResults(null);
      
      // First, verify the function exists
      console.log("Starting care team room sync with DB function...");
      
      // Use any type assertion to work with the RPC function that isn't in the TypeScript definitions
      const { data: rpcResult, error } = await supabase.rpc(
        'sync_all_care_team_rooms' as any
      );
      
      if (error) {
        console.error("DB function call error:", error);
        throw error;
      }
      
      console.log("Sync results from DB function:", rpcResult);
      
      // Handle the response - ensure we can process different return formats
      if (Array.isArray(rpcResult)) {
        // The expected format: array of results
        const results = rpcResult as SyncResult[];
        
        // Count the success and error results
        const successCount = results.filter(r => r.result === 'Success').length;
        const errorCount = results.filter(r => r.result && r.result.includes('Error')).length;
        
        setResults({
          success: true,
          results: results,
          statusCounts: {
            success: successCount,
            error: errorCount
          }
        });
        
        // Verify doctors were added correctly
        for (const result of results) {
          if (result.doctor_id && result.room_id) {
            const { data: memberCheck, error: memberError } = await supabase
              .from('room_members')
              .select('*')
              .eq('room_id', result.room_id)
              .eq('user_id', result.doctor_id)
              .maybeSingle();
              
            if (memberError) {
              console.error(`Error checking doctor membership: ${memberError.message}`);
            } else if (!memberCheck) {
              console.warn(`Doctor ${result.doctor_id} not found in room ${result.room_id} after sync`);
            }
          }
        }
        
        toast({
          title: "Care team rooms synced",
          description: `Success: ${successCount}, Errors: ${errorCount}`,
        });
      } else {
        // Handle unexpected response format
        console.warn("Unexpected response format from sync_all_care_team_rooms:", rpcResult);
        
        setResults({
          success: true,
          results: rpcResult,
          statusCounts: {
            success: 0,
            error: 0
          }
        });
        
        toast({
          title: "Care team rooms synced",
          description: "Operation completed but result format was unexpected.",
        });
      }
    } catch (error) {
      console.error("Error syncing care team rooms using DB function:", error);
      toast({
        title: "Error syncing care team rooms",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Care Team Rooms Sync</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={handleSyncRooms} 
            disabled={isSyncing}
            className="w-full"
          >
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Care Team Rooms (Edge Function)
              </>
            )}
          </Button>
          
          <Button 
            onClick={handleSyncRoomsWithDbFunction} 
            disabled={isSyncing}
            variant="outline"
            className="w-full"
          >
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Care Team Rooms (DB Function)
              </>
            )}
          </Button>
        </div>
        
        {results && (
          <div className="border rounded p-3 text-sm bg-muted/20">
            <h4 className="font-medium mb-2">Results</h4>
            {results.success ? (
              <div>
                <p>Successfully processed {results.results?.length || 0} rooms</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="border rounded p-2 bg-green-50">
                    <span className="text-xs font-medium">Created</span>
                    <p className="text-2xl font-bold">{results.statusCounts?.created || results.statusCounts?.success || 0}</p>
                  </div>
                  <div className="border rounded p-2 bg-blue-50">
                    <span className="text-xs font-medium">Updated</span>
                    <p className="text-2xl font-bold">{results.statusCounts?.updated || 0}</p>
                  </div>
                  <div className="border rounded p-2 bg-orange-50">
                    <span className="text-xs font-medium">Skipped</span>
                    <p className="text-2xl font-bold">{results.statusCounts?.skipped || 0}</p>
                  </div>
                  <div className="border rounded p-2 bg-red-50">
                    <span className="text-xs font-medium">Errors</span>
                    <p className="text-2xl font-bold">{results.statusCounts?.error || 0}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p>Error: {results.error}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
