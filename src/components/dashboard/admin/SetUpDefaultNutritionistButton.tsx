
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export const SetUpDefaultNutritionistButton = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
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
      const { data, error } = await supabase.functions.invoke('admin-setup-nutritionist-as-default', {
        body: { admin_id: user.id }
      });

      if (error) {
        console.error("Error setting up default nutritionist:", error);
        throw error;
      }

      console.log("Default nutritionist setup response:", data);
      
      toast({
        title: "Success",
        description: "NutritionistJee has been set as the default nutritionist",
      });
    } catch (err: any) {
      console.error("Error setting up default nutritionist:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to set up default nutritionist",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleClick} 
      disabled={isLoading}
      className="flex items-center gap-1"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          Setting up...
        </>
      ) : (
        "Set NutritionistJee as Default"
      )}
    </Button>
  );
};
