
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Play, RotateCcw } from 'lucide-react';

export const RegistrationTaskProcessor = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('mihir.chandra@gmail.com');
  const [result, setResult] = useState<any>(null);

  const resetAndProcessTasks = async () => {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter a patient email",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log(`Resetting and processing tasks for: ${email}`);

      const { data, error } = await supabase.functions.invoke(
        'reset-stuck-registration-tasks',
        { body: { patient_email: email.trim() } }
      );

      if (error) {
        throw error;
      }

      setResult(data);
      toast({
        title: "Success",
        description: `Registration tasks reset and processed for ${email}`,
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

  const processTasksOnly = async () => {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter a patient email",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Get user ID first
      const { data: authResponse, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        throw new Error(`Failed to get users: ${authError.message}`);
      }

      if (!authResponse?.users) {
        throw new Error('No users data received');
      }

      // Type assertion to handle the auth user type properly
      const user = authResponse.users.find((u: any) => u.email === email.trim());
      if (!user) {
        throw new Error(`User with email ${email} not found`);
      }

      console.log(`Processing tasks for user: ${user.id}`);

      const { data, error } = await supabase.functions.invoke(
        'process-registration-tasks',
        { body: { patient_id: user.id } }
      );

      if (error) {
        throw error;
      }

      setResult(data);
      toast({
        title: "Success",
        description: `Registration tasks processed for ${email}`,
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Registration Task Processor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Patient Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="patient@example.com"
          />
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={resetAndProcessTasks} 
            disabled={loading}
            variant="default"
            className="flex-1"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-2" />
            )}
            Reset & Process Tasks
          </Button>

          <Button 
            onClick={processTasksOnly} 
            disabled={loading}
            variant="outline"
            className="flex-1"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Process Tasks Only
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
