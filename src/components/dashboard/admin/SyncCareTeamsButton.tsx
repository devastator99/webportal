
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';

export const SyncCareTeamsButton = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSync = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in as an administrator",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-care-team-rooms', {
        body: { admin_id: user.id }
      });

      if (error) {
        console.error("Error syncing care teams:", error);
        throw error;
      }

      console.log("Care team sync response:", data);
      
      toast({
        title: "Success",
        description: "Care team rooms have been synchronized successfully",
      });
    } catch (err: any) {
      console.error("Error syncing care teams:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to sync care teams",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleSync} 
      disabled={isLoading}
      size="sm"
      className="flex items-center gap-1"
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      {isLoading ? 'Syncing...' : 'Sync Care Teams'}
    </Button>
  );
};

export default SyncCareTeamsButton;
