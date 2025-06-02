
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Play, RotateCcw } from 'lucide-react';

export const TaskTrigger = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const triggerTaskProcessor = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('Triggering registration task processor...');

      const { data, error } = await supabase.functions.invoke(
        'process-registration-tasks',
        { body: {} }
      );

      if (error) {
        throw error;
      }

      setResult(data);
      toast({
        title: "Success",
        description: `Processed ${data?.processed || 0} tasks successfully`,
      });

    } catch (error: any) {
      console.error('Error processing registration tasks:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process registration tasks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fixExistingUsers = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('Fixing existing professional users...');

      const { data, error } = await supabase.rpc('fix_existing_professional_users');

      if (error) {
        throw error;
      }

      setResult(data);
      toast({
        title: "Success",
        description: `Fixed ${data?.users_fixed || 0} users and created ${data?.tasks_created || 0} tasks`,
      });

      // After fixing, trigger task processing
      setTimeout(() => {
        triggerTaskProcessor();
      }, 2000);

    } catch (error: any) {
      console.error('Error fixing existing users:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fix existing users",
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
          <Play className="h-5 w-5" />
          Registration Task Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={fixExistingUsers} 
            disabled={loading}
            variant="default"
            className="flex-1"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-2" />
            )}
            Fix Existing Users
          </Button>

          <Button 
            onClick={triggerTaskProcessor} 
            disabled={loading}
            variant="outline"
            className="flex-1"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Process Tasks
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
