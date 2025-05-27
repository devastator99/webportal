
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, AlertTriangle, CheckCircle, Users, Mail, Database } from 'lucide-react';

export const TestDataCleanup = () => {
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [cleanupResults, setCleanupResults] = useState<{
    users: number;
    profiles: number;
    otps: number;
    messages: number;
  } | null>(null);

  const cleanupTestData = async () => {
    setIsCleaningUp(true);
    try {
      const { data, error } = await supabase.functions.invoke('cleanup-test-data', {
        body: { 
          confirmCleanup: true,
          testDataOnly: true 
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error);
      }

      setCleanupResults(data.summary);
      toast.success('Test data cleanup completed successfully');
    } catch (error: any) {
      console.error('Cleanup error:', error);
      toast.error(`Cleanup failed: ${error.message}`);
    } finally {
      setIsCleaningUp(false);
    }
  };

  const resetCleanupResults = () => {
    setCleanupResults(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Test Data Cleanup
        </CardTitle>
        <CardDescription>
          Remove all test data from the system to clean up after testing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> This will permanently delete all test users, profiles, 
            and related data. Only test data (marked with test_user: true) will be removed.
            Production data will not be affected.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4">
          <div>
            <h4 className="font-medium mb-2">What will be cleaned up:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                Test user accounts (auth.users)
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Database className="h-4 w-4" />
                Test user profiles
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                Password reset OTPs
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Database className="h-4 w-4" />
                Test user roles
              </div>
            </div>
          </div>

          {!cleanupResults ? (
            <div className="flex gap-4">
              <Button
                onClick={cleanupTestData}
                disabled={isCleaningUp}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {isCleaningUp ? 'Cleaning Up...' : 'Clean Up Test Data'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Test data cleanup completed successfully!
                </AlertDescription>
              </Alert>

              <div>
                <h4 className="font-medium mb-2">Cleanup Summary:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <Badge variant="outline" className="mb-1">Users</Badge>
                    <p className="text-2xl font-bold text-green-600">{cleanupResults.users}</p>
                    <p className="text-xs text-gray-600">deleted</p>
                  </div>
                  <div className="text-center">
                    <Badge variant="outline" className="mb-1">Profiles</Badge>
                    <p className="text-2xl font-bold text-green-600">{cleanupResults.profiles}</p>
                    <p className="text-xs text-gray-600">deleted</p>
                  </div>
                  <div className="text-center">
                    <Badge variant="outline" className="mb-1">OTPs</Badge>
                    <p className="text-2xl font-bold text-green-600">{cleanupResults.otps}</p>
                    <p className="text-xs text-gray-600">deleted</p>
                  </div>
                  <div className="text-center">
                    <Badge variant="outline" className="mb-1">Messages</Badge>
                    <p className="text-2xl font-bold text-green-600">{cleanupResults.messages}</p>
                    <p className="text-xs text-gray-600">deleted</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={resetCleanupResults}
                variant="outline"
                className="flex items-center gap-2"
              >
                Reset View
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
