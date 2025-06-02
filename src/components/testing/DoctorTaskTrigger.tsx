
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, UserCheck, RotateCcw } from 'lucide-react';

export const DoctorTaskTrigger = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const fixExistingDoctors = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('Fixing existing doctors...');

      const { data, error } = await supabase.rpc('fix_existing_doctors');

      if (error) {
        throw error;
      }

      setResult(data);
      toast({
        title: "Success",
        description: `Fixed ${data?.doctors_fixed || 0} doctors and created ${data?.tasks_created || 0} tasks`,
      });

      // After fixing, trigger task processing
      setTimeout(async () => {
        try {
          const { error: processError } = await supabase.functions.invoke(
            'process-registration-tasks',
            { body: {} }
          );
          
          if (processError) {
            console.error("Failed to process registration tasks:", processError);
          } else {
            console.log("Registration tasks processing triggered successfully");
            toast({
              title: "Tasks Processed",
              description: "Doctor registration tasks have been processed successfully",
            });
          }
        } catch (err) {
          console.error("Error triggering task processing:", err);
        }
      }, 2000);

    } catch (error: any) {
      console.error('Error fixing existing doctors:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fix existing doctors",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Doctor Registration Fixer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={fixExistingDoctors} 
            disabled={loading}
            variant="default"
            className="flex-1"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-2" />
            )}
            Fix Existing Doctors
          </Button>
        </div>

        {result && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Result:</h4>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
